'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, CreditCard, User } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  const items = [
    { href: '/', icon: Home, label: 'Início' },
    { href: '/groups', icon: Users, label: 'Grupos' },
    { href: '/payments', icon: CreditCard, label: 'Pagamentos' },
    { href: '/profile', icon: User, label: 'Perfil' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-sm">
      <div className="max-w-4xl mx-auto flex justify-around py-2">
        {items.map(item => {
          const active = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center text-xs ${
                active ? 'text-[#5BC5A7]' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
