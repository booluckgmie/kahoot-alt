import { TIME_TIL_CHOICE_REVEAL } from '@/constants'
import { Answer, Participant, Question, supabase } from '@/types/types'
import { useEffect, useRef, useState } from 'react'
import { CountdownCircleTimer } from 'react-countdown-circle-timer'
import {
  CheckIcon,
  ChoiceShape,
  CrossIcon,
  barClass,
  choiceClass,
} from '@/components/glass'

export default function Quiz({
  question: question,
  questionCount: questionCount,
  gameId,
  participants,
}: {
  question: Question
  questionCount: number
  gameId: string
  participants: Participant[]
}) {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)

  const [hasShownChoices, setHasShownChoices] = useState(false)

  const [answers, setAnswers] = useState<Answer[]>([])

  const answerStateRef = useRef<Answer[]>()

  answerStateRef.current = answers

  const getNextQuestion = async () => {
    var updateData
    if (questionCount == question.order + 1) {
      updateData = { phase: 'result' }
    } else {
      updateData = {
        current_question_sequence: question.order + 1,
        is_answer_revealed: false,
      }
    }

    const { data, error } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', gameId)
    if (error) {
      return alert(error.message)
    }
  }

  const onTimeUp = async () => {
    setIsAnswerRevealed(true)
    await supabase
      .from('games')
      .update({
        is_answer_revealed: true,
      })
      .eq('id', gameId)
  }

  useEffect(() => {
    setIsAnswerRevealed(false)
    setHasShownChoices(false)
    setAnswers([])

    setTimeout(() => {
      setHasShownChoices(true)
    }, TIME_TIL_CHOICE_REVEAL)

    const channel = supabase
      .channel('answers')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
          filter: `question_id=eq.${question.id}`,
        },
        (payload) => {
          setAnswers((currentAnswers) => {
            return [...currentAnswers, payload.new as Answer]
          })

          if (
            (answerStateRef.current?.length ?? 0) + 1 ===
            participants.length
          ) {
            onTimeUp()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [question.id])

  return (
    <div className="flex min-h-[100dvh] flex-col px-4 py-4 sm:px-8 sm:py-6">
      <div className="flex items-center justify-between gap-3 pb-4">
        <span className="pill text-lg">
          {question.order + 1} / {questionCount}
        </span>
        {isAnswerRevealed && (
          <button className="btn btn-primary" onClick={getNextQuestion}>
            Next
          </button>
        )}
      </div>

      <h2 className="glass glass-strong mx-auto w-full max-w-5xl p-5 text-center text-2xl font-bold leading-snug sm:p-8 sm:text-4xl">
        {question.body}
      </h2>

      <div className="flex flex-grow items-center justify-center py-6">
        {hasShownChoices && !isAnswerRevealed && (
          <div className="flex w-full max-w-3xl flex-wrap items-center justify-around gap-8">
            <CountdownCircleTimer
              onComplete={() => {
                onTimeUp()
              }}
              isPlaying
              size={160}
              strokeWidth={10}
              duration={20}
              colors={['#22d3ee', '#facc15', '#f87171', '#f87171']}
              trailColor="rgba(255,255,255,0.15)"
              colorsTime={[7, 5, 2, 0]}
            >
              {({ remainingTime }) => (
                <span className="text-5xl font-bold text-white">
                  {remainingTime}
                </span>
              )}
            </CountdownCircleTimer>
            <div className="glass px-10 py-6 text-center">
              <div className="text-6xl font-bold">{answers.length}</div>
              <div className="pt-1 text-xl text-white/75">Answers</div>
            </div>
          </div>
        )}
        {isAnswerRevealed && (
          <div className="flex items-end justify-center gap-3 sm:gap-6">
            {question.choices.map((choice, index) => {
              const count = answers.filter(
                (answer) => answer.choice_id === choice.id
              ).length
              return (
                <div
                  key={choice.id}
                  className="flex h-56 w-16 flex-col items-stretch justify-end sm:h-64 sm:w-28"
                >
                  <div className="relative flex-grow">
                    <div
                      style={{
                        height: `${(count * 100) / (answers.length || 1)}%`,
                      }}
                      className={`absolute bottom-0 left-0 right-0 rounded-t-xl transition-all duration-700 ${barClass(
                        index
                      )}`}
                    ></div>
                  </div>
                  <div
                    className={`glass mt-2 flex items-center justify-center gap-1 py-2 text-lg font-bold ${
                      choice.is_correct ? 'ring-2 ring-green-400' : 'opacity-70'
                    }`}
                  >
                    <ChoiceShape index={index} />
                    {count}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {hasShownChoices && (
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2">
          {question.choices.map((choice, index) => (
            <div
              key={choice.id}
              className={`choice ${choiceClass(index)} justify-between text-xl sm:min-h-[6rem] sm:text-2xl ${
                isAnswerRevealed && !choice.is_correct ? 'opacity-50' : ''
              }`}
            >
              <span className="flex items-center gap-3">
                <ChoiceShape index={index} />
                {choice.body}
              </span>
              {isAnswerRevealed &&
                (choice.is_correct ? <CheckIcon /> : <CrossIcon />)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
