import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'SupaQuiz',
  description: 'Fun quiz game powered by Supabase',
}

const menuItems: {
  label: string
  href: string
  icon: React.ReactNode
}[] = [
  {
    label: 'Home',
    href: '/host/dashboard',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>
    ),
  },
  {
    label: 'How to Play',
    href: '/host/dashboard/how-to',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
        />
      </svg>
    ),
  },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl px-4 pb-10 pt-4 sm:px-6">
      <header className="glass sticky top-4 z-10 mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <h1 className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-xl font-extrabold text-transparent">
          SupaQuiz
        </h1>
        <nav aria-label="Main">
          <ul className="flex gap-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  className="btn btn-ghost min-h-[2.5rem] px-4 py-2 text-sm"
                  href={item.href}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}
