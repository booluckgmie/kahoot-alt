import { QUESTION_ANSWER_TIME, TIME_TIL_CHOICE_REVEAL } from '@/constants'
import { Choice, Question, supabase } from '@/types/types'
import { useState, useEffect } from 'react'
import { ColorFormat, CountdownCircleTimer } from 'react-countdown-circle-timer'
import {
  CheckIcon,
  ChoiceShape,
  CrossIcon,
  choiceClass,
} from '@/components/glass'

export default function Quiz({
  question: question,
  questionCount: questionCount,
  participantId: playerId,
  isAnswerRevealed,
}: {
  question: Question
  questionCount: number
  participantId: string
  isAnswerRevealed: boolean
}) {
  const [chosenChoice, setChosenChoice] = useState<Choice | null>(null)

  const [hasShownChoices, setHasShownChoices] = useState(false)

  const [questionStartTime, setQuestionStartTime] = useState(Date.now())

  useEffect(() => {
    setChosenChoice(null)
    setHasShownChoices(false)
  }, [question.id])

  const answer = async (choice: Choice) => {
    setChosenChoice(choice)

    const now = Date.now()
    const score = !choice.is_correct
      ? 0
      : 1000 -
        Math.round(
          Math.max(
            0,
            Math.min((now - questionStartTime) / QUESTION_ANSWER_TIME, 1)
          ) * 1000
        )

    const { error } = await supabase.from('answers').insert({
      participant_id: playerId,
      question_id: question.id,
      choice_id: choice.id,
      score,
    })
    if (error) {
      setChosenChoice(null)
      alert(error.message)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-stretch px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center gap-3 pb-4">
          <span className="pill text-sm">
            {question.order + 1} / {questionCount}
          </span>
          <div
            className="h-2 flex-grow overflow-hidden rounded-full bg-white/15"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={questionCount}
            aria-valuenow={question.order + 1}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-400 transition-all duration-500"
              style={{
                width: `${((question.order + 1) * 100) / questionCount}%`,
              }}
            />
          </div>
        </div>

        <h2 className="glass glass-strong p-5 text-center text-xl font-bold leading-snug sm:p-8 sm:text-3xl">
          {question.body}
        </h2>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-grow flex-col">
        {!isAnswerRevealed && chosenChoice && (
          <div className="flex flex-grow items-center justify-center p-4 text-center text-xl text-white/80">
            Wait for others to answer…
          </div>
        )}

        {!hasShownChoices && !isAnswerRevealed && (
          <div className="flex flex-grow flex-col items-center justify-center gap-3 py-6">
            <CountdownCircleTimer
              onComplete={() => {
                setHasShownChoices(true)
                setQuestionStartTime(Date.now())
              }}
              isPlaying
              size={140}
              strokeWidth={8}
              duration={TIME_TIL_CHOICE_REVEAL / 1000}
              colors={['#a78bfa', '#22d3ee', '#22d3ee', '#22d3ee']}
              trailColor={'rgba(255,255,255,0.15)' as ColorFormat}
              colorsTime={[7, 5, 2, 0]}
            >
              {({ remainingTime }) => (
                <span className="text-5xl font-bold text-white">
                  {remainingTime}
                </span>
              )}
            </CountdownCircleTimer>
            <p className="text-white/70">Get ready…</p>
          </div>
        )}

        {hasShownChoices && !isAnswerRevealed && !chosenChoice && (
          <div className="flex flex-grow flex-col justify-end">
            <div className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-2">
              {question.choices.map((choice, index) => (
                <button
                  key={choice.id}
                  onClick={() => answer(choice)}
                  disabled={chosenChoice !== null || isAnswerRevealed}
                  className={`choice ${choiceClass(index)} text-lg sm:min-h-[7rem] sm:text-xl`}
                >
                  <ChoiceShape index={index} />
                  <span>{choice.body}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isAnswerRevealed && (
          <div className="flex flex-grow flex-col items-center justify-center gap-4 py-8">
            <div
              className={`rounded-full p-5 text-white shadow-lg ${
                chosenChoice?.is_correct
                  ? 'bg-green-500/80 shadow-green-500/40'
                  : 'bg-red-500/80 shadow-red-500/40'
              }`}
            >
              {chosenChoice?.is_correct ? (
                <CheckIcon className="h-10 w-10" />
              ) : (
                <CrossIcon className="h-10 w-10" />
              )}
            </div>
            <h2 className="text-3xl font-bold">
              {chosenChoice?.is_correct ? 'Correct!' : 'Incorrect'}
            </h2>
          </div>
        )}
      </div>
    </div>
  )
}
