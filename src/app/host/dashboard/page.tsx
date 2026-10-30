'use client'

import { QuizSet, supabase } from '@/types/types'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PasscodeForm, useHostPasscode } from '@/components/passcode'

export default function Home() {
  const [quizSet, setQuizSet] = useState<QuizSet[]>([])

  const { passcode, unlock, lock } = useHostPasscode()
  const [showUnlock, setShowUnlock] = useState(false)

  const getQuizSets = async () => {
    const { data, error } = await supabase
      .from('quiz_sets')
      .select(`*, questions(*, choices(*))`)
      .order('created_at', { ascending: false })
    if (error) {
      alert('Failed to fetch quiz sets')
      return
    }
    setQuizSet(data)
  }

  useEffect(() => {
    getQuizSets()
  }, [])

  const deleteQuiz = async (quiz: QuizSet) => {
    if (!passcode) return
    if (
      !confirm(
        `Delete "${quiz.name}"? Its games and results are deleted too. This cannot be undone.`,
      )
    )
      return
    const { error } = await supabase.rpc('delete_quiz', {
      p_passcode: passcode,
      p_quiz_id: quiz.id,
    })
    if (error) {
      if (error.code === '28000') lock()
      alert(error.message)
      return
    }
    getQuizSets()
  }

  const startGame = async (quizSetId: string) => {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()

    if (!sessionData.session) {
      await supabase.auth.signInAnonymously()
    }

    const { data, error } = await supabase
      .from('games')
      .insert({
        quiz_set_id: quizSetId,
      })
      .select()
      .single()
    if (error) {
      console.error(error)
      alert('Failed to start game')
      return
    }

    const gameId = data.id
    window.open(`/host/game/${gameId}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <h2 className="text-2xl font-bold">Quizzes</h2>
        {passcode ? (
          <div className="flex gap-2">
            <Link
              href="/host/dashboard/quizzes/new"
              className="btn btn-primary"
            >
              + New quiz
            </Link>
            <button className="btn btn-ghost" onClick={lock}>
              Lock
            </button>
          </div>
        ) : (
          <button
            className="btn btn-ghost"
            onClick={() => setShowUnlock((v) => !v)}
          >
            Unlock editing
          </button>
        )}
      </div>
      {!passcode && showUnlock && (
        <div className="glass mb-4 max-w-md p-5">
          <PasscodeForm
            onSubmit={async (value) => {
              const ok = await unlock(value)
              if (ok) setShowUnlock(false)
              return ok
            }}
          />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {quizSet.length === 0 && (
          <p className="glass p-6 text-white/70 sm:col-span-2">
            No quizzes yet. Unlock editing to create one.
          </p>
        )}
        {quizSet.map((quizSet) => (
          <div key={quizSet.id} className="glass flex flex-col overflow-hidden">
            <img
              className="h-36 w-full object-cover opacity-90"
              src="/default.png"
              alt="default quiz image"
            />
            <div className="flex flex-grow flex-col justify-between gap-4 p-5">
              <div>
                <h3 className="text-xl font-bold">{quizSet.name}</h3>
                {quizSet.description && (
                  <p className="pt-1 text-sm text-white/70">
                    {quizSet.description}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="pill text-sm">
                  {quizSet.questions.length} questions
                </span>
                <button
                  className="btn btn-primary"
                  onClick={() => startGame(quizSet.id)}
                >
                  Start Game
                </button>
              </div>
              {passcode && (
                <div className="flex gap-2">
                  <Link
                    href={`/host/dashboard/quizzes/${quizSet.id}/edit`}
                    className="btn btn-ghost min-h-[2.5rem] flex-1 py-1"
                  >
                    Edit
                  </Link>
                  <button
                    className="btn btn-ghost min-h-[2.5rem] flex-1 py-1"
                    onClick={() => deleteQuiz(quizSet)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
