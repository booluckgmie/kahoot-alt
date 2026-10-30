import {
  Answer,
  GameResult,
  Participant,
  Question,
  QuizSet,
  supabase,
} from '@/types/types'
import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import useWindowSize from 'react-use/lib/useWindowSize'

export default function Results({
  quizSet,
  gameId,
}: {
  participants: Participant[]
  quizSet: QuizSet
  gameId: string
}) {
  const [gameResults, setGameResults] = useState<GameResult[]>([])

  const { width, height } = useWindowSize()

  useEffect(() => {
    const getResults = async () => {
      const { data, error } = await supabase
        .from('game_results')
        .select()
        .eq('game_id', gameId)
        .order('total_score', { ascending: false })
      if (error) {
        return alert(error.message)
      }

      setGameResults(data)
    }
    getResults()
  }, [gameId])

  return (
    <div className="min-h-[100dvh] px-4 py-8 sm:px-8">
      <div className="text-center">
        <h1 className="glass glass-strong inline-block px-6 py-4 text-2xl font-bold sm:px-12 sm:text-4xl">
          {quizSet.name}
        </h1>
      </div>
      <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-3">
        {gameResults.map((gameResult, index) => (
          <div
            key={gameResult.participant_id}
            className={`glass flex items-center gap-4 px-4 py-3 ${
              index < 3 ? 'glass-strong py-4' : ''
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${
                index === 0
                  ? 'bg-yellow-400 text-slate-900'
                  : index === 1
                  ? 'bg-slate-300 text-slate-900'
                  : index === 2
                  ? 'bg-amber-600 text-white'
                  : 'bg-white/15'
              }`}
            >
              {index + 1}
            </div>
            <div
              className={`min-w-0 flex-grow truncate font-bold ${
                index < 3 ? 'text-2xl sm:text-4xl' : 'text-xl'
              }`}
            >
              {gameResult.nickname}
            </div>
            <div className="shrink-0">
              <span className="text-xl font-bold">{gameResult.total_score}</span>
              <span className="pl-1 text-white/70">pts</span>
            </div>
          </div>
        ))}
      </div>
      <Confetti
        className="!pointer-events-none"
        width={width}
        height={height}
        recycle={true}
      />
    </div>
  )
}
