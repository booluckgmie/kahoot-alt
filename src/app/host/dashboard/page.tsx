'use client'

import { QuizSet, supabase } from '@/types/types'
import { useEffect, useState } from 'react'

export default function Home() {
  const [quizSet, setQuizSet] = useState<QuizSet[]>([])

  useEffect(() => {
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
    getQuizSets()
  }, [])

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
    <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
      {quizSet.length === 0 && (
        <p className="glass p-6 text-white/70 sm:col-span-2">
          No quizzes yet. Add one to your database and it will show up here.
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
              <h2 className="text-xl font-bold">{quizSet.name}</h2>
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
          </div>
        </div>
      ))}
    </div>
  )
}
