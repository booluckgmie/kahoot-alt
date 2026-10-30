'use client'

import { FormEvent, useState } from 'react'
import { ChoiceShape, choiceClass } from '@/components/glass'

export type DraftChoice = { body: string; is_correct: boolean }
export type DraftQuestion = {
  id?: string
  body: string
  choices: DraftChoice[]
}
export type QuizDraft = {
  name: string
  description: string
  questions: DraftQuestion[]
}

const CHOICES_PER_QUESTION = 4

export const emptyQuestion = (): DraftQuestion => ({
  body: '',
  choices: Array.from({ length: CHOICES_PER_QUESTION }, (_, i) => ({
    body: '',
    is_correct: i === 0,
  })),
})

export const emptyDraft = (): QuizDraft => ({
  name: '',
  description: '',
  questions: [emptyQuestion()],
})

/** Checks the draft and returns the payload for the create_quiz / update_quiz functions */
function toPayload(
  draft: QuizDraft,
): { error: string } | { questions: unknown } {
  if (!draft.name.trim()) return { error: 'Give the quiz a title.' }

  const questions = []
  for (let i = 0; i < draft.questions.length; i++) {
    const q = draft.questions[i]
    const n = i + 1
    if (!q.body.trim()) return { error: `Question ${n} needs text.` }

    const correct = q.choices.find((c: DraftChoice) => c.is_correct)
    if (!correct || !correct.body.trim()) {
      return { error: `Question ${n}: mark a filled-in choice as correct.` }
    }
    const choices = q.choices.filter((c: DraftChoice) => c.body.trim())
    if (choices.length < 2) {
      return { error: `Question ${n} needs at least 2 choices.` }
    }

    questions.push({
      id: q.id ?? null,
      body: q.body.trim(),
      choices: choices.map((c: DraftChoice) => ({
        body: c.body.trim(),
        is_correct: c.is_correct,
      })),
    })
  }
  if (questions.length === 0) return { error: 'Add at least one question.' }
  return { questions }
}

export default function QuizForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: QuizDraft
  submitLabel: string
  onSubmit: (draft: {
    name: string
    description: string
    questions: unknown
  }) => Promise<string | void>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<QuizDraft>(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const setQuestion = (index: number, patch: Partial<DraftQuestion>) =>
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q, i) =>
        i === index ? { ...q, ...patch } : q,
      ),
    }))

  const setChoice = (qi: number, ci: number, patch: Partial<DraftChoice>) =>
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q, i) =>
        i === qi
          ? {
              ...q,
              choices: q.choices.map((c, j) =>
                j === ci ? { ...c, ...patch } : c,
              ),
            }
          : q,
      ),
    }))

  const markCorrect = (qi: number, ci: number) =>
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q, i) =>
        i === qi
          ? {
              ...q,
              choices: q.choices.map((c, j) => ({
                ...c,
                is_correct: j === ci,
              })),
            }
          : q,
      ),
    }))

  const moveQuestion = (index: number, by: -1 | 1) =>
    setDraft((d) => {
      const target = index + by
      if (target < 0 || target >= d.questions.length) return d
      const questions = [...d.questions]
      ;[questions[index], questions[target]] = [
        questions[target],
        questions[index],
      ]
      return { ...d, questions }
    })

  const removeQuestion = (index: number) =>
    setDraft((d) => ({
      ...d,
      questions: d.questions.filter((_, i) => i !== index),
    }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const payload = toPayload(draft)
    if ('error' in payload) {
      setError(payload.error)
      return
    }
    setBusy(true)
    setError('')
    const message = await onSubmit({
      name: draft.name.trim(),
      description: draft.description.trim(),
      questions: payload.questions,
    })
    if (message) {
      setError(message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-3xl flex-col gap-6">
      <section className="glass flex flex-col gap-3 p-5 sm:p-6">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-white/70">Quiz title</span>
          <input
            className="input"
            value={draft.name}
            maxLength={120}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. The Art of Stakeholder Engagement"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-white/70">Description (optional)</span>
          <input
            className="input"
            value={draft.description}
            maxLength={200}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
            placeholder="A short line shown on the dashboard"
          />
        </label>
      </section>

      {draft.questions.map((q, qi) => (
        <section key={qi} className="glass flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <span className="pill text-sm">Question {qi + 1}</span>
            <div className="flex gap-1">
              <button
                type="button"
                className="btn btn-ghost min-h-[2.5rem] px-3 py-1"
                onClick={() => moveQuestion(qi, -1)}
                disabled={qi === 0}
                aria-label={`Move question ${qi + 1} up`}
              >
                ↑
              </button>
              <button
                type="button"
                className="btn btn-ghost min-h-[2.5rem] px-3 py-1"
                onClick={() => moveQuestion(qi, 1)}
                disabled={qi === draft.questions.length - 1}
                aria-label={`Move question ${qi + 1} down`}
              >
                ↓
              </button>
              <button
                type="button"
                className="btn btn-ghost min-h-[2.5rem] px-3 py-1"
                onClick={() => removeQuestion(qi)}
                disabled={draft.questions.length === 1}
                aria-label={`Remove question ${qi + 1}`}
              >
                Remove
              </button>
            </div>
          </div>

          <textarea
            className="input min-h-[5rem] rounded-2xl"
            value={q.body}
            onChange={(e) => setQuestion(qi, { body: e.target.value })}
            placeholder="Type the question"
            aria-label={`Question ${qi + 1} text`}
          />

          <div className="flex flex-col gap-3">
            {q.choices.map((c, ci) => (
              <div
                key={ci}
                className={`choice ${choiceClass(ci)} min-h-0 !p-2 pl-4`}
              >
                <ChoiceShape index={ci} />
                <input
                  className="min-h-[2.5rem] w-full min-w-0 flex-grow bg-transparent text-white outline-none placeholder:text-white/60"
                  value={c.body}
                  onChange={(e) => setChoice(qi, ci, { body: e.target.value })}
                  placeholder={`Choice ${ci + 1}`}
                  aria-label={`Question ${qi + 1} choice ${ci + 1}`}
                />
                <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-black/25 px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name={`correct-${qi}`}
                    checked={c.is_correct}
                    onChange={() => markCorrect(qi, ci)}
                    className="h-4 w-4 accent-white"
                  />
                  Correct
                </label>
              </div>
            ))}
          </div>
        </section>
      ))}

      <button
        type="button"
        className="btn btn-ghost"
        onClick={() =>
          setDraft((d) => ({
            ...d,
            questions: [...d.questions, emptyQuestion()],
          }))
        }
      >
        + Add question
      </button>

      {error && (
        <p role="alert" className="glass border-red-400/60 p-4 text-red-200">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3 pb-6">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary px-10" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
