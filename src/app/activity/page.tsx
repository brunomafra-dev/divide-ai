'use client'

import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/ui/bottom-nav'

export default function Activity() {
  const activities = [
    {
      id: '1',
      type: 'expense',
      description: 'João pagou R$ 150,00',
      group: 'Viagem para Praia',
      date: '2 horas atrás',
    },
    {
      id: '2',
      type: 'settle',
      description: 'Você zerou com Maria',
      group: 'Casa dos Pais',
      date: '1 dia atrás',
    },
    {
      id: '3',
      type: 'expense',
      description: 'Você pagou R$ 80,00',
      group: 'Churrasco Domingo',
      date: '2 dias atrás',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <button className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">Atividade</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#5BC5A7]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-[#5BC5A7]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{activity.description}</p>
                  <p className="text-xs text-gray-600 mt-1">{activity.group}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Ad Space Placeholder */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-gray-100 rounded-xl p-4 text-center border-2 border-dashed border-gray-300">
          <p className="text-xs text-gray-500">Espaço reservado para anúncio</p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
