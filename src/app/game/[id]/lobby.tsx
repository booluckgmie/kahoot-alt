import { Participant, supabase } from '@/types/types'
import { Screen } from '@/components/glass'
import { FormEvent, useEffect, useState } from 'react'

export default function Lobby({
  gameId,
  onRegisterCompleted,
}: {
  gameId: string
  onRegisterCompleted: (participant: Participant) => void
}) {
  const [participant, setParticipant] = useState<Participant | null>(null)

  useEffect(() => {
    const fetchParticipant = async () => {
      let userId: string | null = null

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession()

      if (sessionData.session) {
        userId = sessionData.session?.user.id ?? null
      } else {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) console.error(error)
        userId = data?.user?.id ?? null
      }

      if (!userId) {
        return
      }

      const { data: participantData, error } = await supabase
        .from('participants')
        .select()
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        return alert(error.message)
      }

      if (participantData) {
        setParticipant(participantData)
        onRegisterCompleted(participantData)
      }
    }

    fetchParticipant()
  }, [gameId, onRegisterCompleted])

  return (
    <Screen>
      <div className="glass w-full max-w-md p-6 sm:p-10">
        {!participant && (
          <Register
            gameId={gameId}
            onRegisterCompleted={(participant) => {
              onRegisterCompleted(participant)
              setParticipant(participant)
            }}
          />
        )}

        {participant && (
          <div className="text-center">
            <div className="text-5xl pb-4" aria-hidden="true">
              ✅
            </div>
            <h1 className="text-2xl font-bold pb-3">
              Welcome {participant.nickname}!
            </h1>
            <p className="text-white/75">
              You&apos;re in. Your nickname should show up on the host screen.
              Sit back and wait for the host to start the game.
            </p>
          </div>
        )}
      </div>
    </Screen>
  )
}

function Register({
  onRegisterCompleted,
  gameId,
}: {
  onRegisterCompleted: (player: Participant) => void
  gameId: string
}) {
  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!nickname.trim()) {
      return
    }
    setSending(true)
    const { data: participant, error } = await supabase
      .from('participants')
      .insert({ nickname, game_id: gameId })
      .select()
      .single()

    if (error) {
      setSending(false)

      return alert(error.message)
    }

    onRegisterCompleted(participant)
  }

  const [nickname, setNickname] = useState('')
  const [sending, setSending] = useState(false)

  return (
    <form onSubmit={(e) => onFormSubmit(e)} className="flex flex-col gap-4">
      <div className="text-center pb-2">
        <h1 className="text-3xl font-bold">Join the game</h1>
        <p className="text-white/70 pt-1">Pick a nickname to get started</p>
      </div>
      <input
        className="input text-center"
        type="text"
        autoComplete="off"
        aria-label="Nickname"
        onChange={(val) => setNickname(val.currentTarget.value)}
        placeholder="Nickname"
        maxLength={20}
      />
      <button disabled={sending} className="btn btn-primary w-full text-lg">
        {sending ? 'Joining…' : 'Join'}
      </button>
    </form>
  )
}
