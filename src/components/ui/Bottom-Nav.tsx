'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  const items = [
    { href: '/', label: 'Home' },
    { href: '/groups', label: 'Grupos' },
    { href: '/payments', label: 'Pagamentos' },
    { href: '/profile', label: 'Perfil' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white">
      <div className="flex justify-around py-3">
        {items.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium ${
                active ? 'text-[#5BC5A7]' : 'text-gray-400'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
