import { ReactNode } from 'react'

/** Fixed animated gradient behind the whole app */
export function Background() {
  return (
    <div className="bg-mesh" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  )
}

export function choiceClass(index: number) {
  return `choice-${index % 4}`
}

export function barClass(index: number) {
  return `bar-${index % 4}`
}

const shapes = [
  // triangle, diamond, circle, square: answers stay distinguishable without colour
  <polygon key="t" points="12,3 22,21 2,21" />,
  <polygon key="d" points="12,2 22,12 12,22 2,12" />,
  <circle key="c" cx="12" cy="12" r="10" />,
  <rect key="s" x="3" y="3" width="18" height="18" rx="2" />,
]

export function ChoiceShape({ index }: { index: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 shrink-0 fill-white/90"
      aria-hidden="true"
    >
      {shapes[index % 4]}
    </svg>
  )
}

export function CheckIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={4}
      stroke="currentColor"
      className={className}
      aria-label="Correct"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4.5 12.75 6 6 9-13.5"
      />
    </svg>
  )
}

export function CrossIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={4}
      stroke="currentColor"
      className={className}
      aria-label="Incorrect"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
  )
}

/** Full-height centered screen used by lobby / results style pages */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-8 sm:px-6">
      {children}
    </div>
  )
}
