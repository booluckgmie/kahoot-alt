'use client'

import { useRouter } from 'next/navigation'
import { PasscodeGate } from '@/components/passcode'
import QuizForm, { emptyDraft } from '@/components/quiz-form'
import { supabase } from '@/types/types'

export default function NewQuiz() {
  const router = useRouter()

  return (
    <PasscodeGate>
      {(passcode, lock) => (
        <>
          <h2 className="mx-auto max-w-3xl pb-4 text-2xl font-bold">
            New quiz
          </h2>
          <QuizForm
            initial={emptyDraft()}
            submitLabel="Create quiz"
            onCancel={() => router.push('/host/dashboard')}
            onSubmit={async (draft) => {
              const { error } = await supabase.rpc('create_quiz', {
                p_passcode: passcode,
                p_name: draft.name,
                p_description: draft.description,
                p_questions: draft.questions as never,
              })
              if (error) {
                if (error.code === '28000') lock()
                return error.message
              }
              router.push('/host/dashboard')
            }}
          />
        </>
      )}
    </PasscodeGate>
  )
}
