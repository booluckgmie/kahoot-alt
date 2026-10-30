'use client'

import { FormEvent, ReactNode, useCallback, useEffect, useState } from 'react'
import { supabase } from '@/types/types'

const STORAGE_KEY = 'host_passcode'

function readStored() {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/** Host passcode kept for the browser tab only */
export function useHostPasscode() {
  const [passcode, setPasscode] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setPasscode(readStored())
    setReady(true)
  }, [])

  const unlock = useCallback(async (attempt: string) => {
    const { data, error } = await supabase.rpc('verify_host_passcode', {
      p_passcode: attempt,
    })
    if (error) throw error
    if (!data) return false
    try {
      sessionStorage.setItem(STORAGE_KEY, attempt)
    } catch {}
    setPasscode(attempt)
    return true
  }, [])

  const lock = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {}
    setPasscode(null)
  }, [])

  return { passcode, ready, unlock, lock }
}

export function PasscodeForm({
  onSubmit,
  note,
}: {
  onSubmit: (passcode: string) => Promise<boolean>
  note?: string
}) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!value) return
    setBusy(true)
    setError('')
    try {
      if (!(await onSubmit(value))) setError('Wrong passcode, try again.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {note && <p className="text-white/70">{note}</p>}
      <input
        className="input"
        type="password"
        autoComplete="off"
        aria-label="Host passcode"
        placeholder="Host passcode"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      <button className="btn btn-primary" disabled={busy || !value}>
        {busy ? 'Checking…' : 'Unlock'}
      </button>
    </form>
  )
}

/** Shows its children once the host passcode has been entered */
export function PasscodeGate({
  children,
}: {
  children: (passcode: string, lock: () => void) => ReactNode
}) {
  const { passcode, ready, unlock, lock } = useHostPasscode()

  if (!ready) return null
  if (!passcode) {
    return (
      <div className="glass mx-auto max-w-md p-6 sm:p-8">
        <h2 className="pb-3 text-2xl font-bold">Host passcode</h2>
        <PasscodeForm
          onSubmit={unlock}
          note="Enter the host passcode to create or edit quizzes."
        />
      </div>
    )
  }
  return <>{children(passcode, lock)}</>
}
