'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PasscodeGate } from '@/components/passcode'
import QuizForm, { QuizDraft } from '@/components/quiz-form'
import { supabase } from '@/types/types'

export default function EditQuiz({
  params: { id: quizId },
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [draft, setDraft] = useState<QuizDraft | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('quiz_sets')
        .select('*, questions(*, choices(*))')
        .eq('id', quizId)
        .order('order', { referencedTable: 'questions', ascending: true })
        .maybeSingle()
      if (error || !data) {
        setLoadError(error?.message ?? 'Quiz not found.')
        return
      }
      setDraft({
        name: data.name,
        description: data.description ?? '',
        questions: data.questions.map((q) => ({
          id: q.id,
          body: q.body,
          choices: q.choices.map((c) => ({
            body: c.body,
            is_correct: c.is_correct,
          })),
        })),
      })
    }
    load()
  }, [quizId])

  return (
    <PasscodeGate>
      {(passcode, lock) => (
        <>
          <h2 className="mx-auto max-w-3xl pb-4 text-2xl font-bold">
            Edit quiz
          </h2>
          {loadError && (
            <p
              role="alert"
              className="glass mx-auto max-w-3xl p-4 text-red-200"
            >
              {loadError}
            </p>
          )}
          {draft && (
            <QuizForm
              initial={draft}
              submitLabel="Save changes"
              onCancel={() => router.push('/host/dashboard')}
              onSubmit={async (next) => {
                const { error } = await supabase.rpc('update_quiz', {
                  p_passcode: passcode,
                  p_quiz_id: quizId,
                  p_name: next.name,
                  p_description: next.description,
                  p_questions: next.questions as never,
                })
                if (error) {
                  if (error.code === '28000') lock()
                  return error.message
                }
                router.push('/host/dashboard')
              }}
            />
          )}
        </>
      )}
    </PasscodeGate>
  )
}
