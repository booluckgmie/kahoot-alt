import { Participant, supabase } from '@/types/types'
import { useQRCode } from 'next-qrcode'
import { useEffect, useState } from 'react'
import { Screen } from '@/components/glass'

export default function Lobby({
  participants: participants,
  gameId,
}: {
  participants: Participant[]
  gameId: string
}) {
  const { Canvas } = useQRCode()

  // Use the host's own origin so the QR also works on localhost / preview deploys
  const [origin, setOrigin] = useState('')
  useEffect(() => setOrigin(window.location.origin), [])
  const joinUrl = `${origin}/game/${gameId}`

  const onClickStartGame = async () => {
    const { data, error } = await supabase
      .from('games')
      .update({ phase: 'quiz' })
      .eq('id', gameId)
    if (error) {
      return alert(error.message)
    }
  }

  return (
    <Screen>
      <div className="glass grid w-full max-w-5xl gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold sm:text-4xl">Join the game</h1>
          <p className="pt-2 text-white/70">
            Scan the QR code or open the link on your phone.
          </p>
          {origin && (
            <p className="mt-3 break-all rounded-2xl bg-white/10 px-4 py-2 text-sm text-white/80">
              {joinUrl}
            </p>
          )}

          <div className="flex flex-grow flex-wrap content-start gap-2 py-6">
            {participants.length === 0 && (
              <p className="text-white/60">Waiting for players…</p>
            )}
            {participants.map((participant) => (
              <div className="pill text-lg" key={participant.id}>
                {participant.nickname}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-white/70">
              {participants.length} player{participants.length === 1 ? '' : 's'}
            </span>
            <button
              className="btn btn-primary px-10 text-lg"
              onClick={onClickStartGame}
            >
              Start Game
            </button>
          </div>
        </div>

        <div className="mx-auto self-center rounded-3xl bg-white p-3 shadow-xl [&_canvas]:h-auto [&_canvas]:max-w-full">
          {origin && (
            <Canvas
              text={joinUrl}
              options={{
                errorCorrectionLevel: 'M',
                margin: 2,
                scale: 4,
                width: 320,
              }}
            />
          )}
        </div>
      </div>
    </Screen>
  )
}
