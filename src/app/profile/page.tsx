'use client'

import { ArrowLeft, User, Mail, Calendar, Crown } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import BottomNav from '@/components/BottomNav'

export default function Profile() {
  const [isPremium] = useState(false)

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
          <h1 className="text-lg font-semibold text-gray-800">Perfil</h1>
          <button className="text-[#5BC5A7] font-medium hover:text-[#4AB396]">
            Editar
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Avatar e Nome */}
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-[#5BC5A7] to-[#4AB396] rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Você</h2>
          <p className="text-gray-600">Membro desde 2024</p>
          {isPremium && (
            <div className="inline-flex items-center gap-1 mt-2 bg-gradient-to-r from-[#5BC5A7] to-[#4AB396] text-white px-3 py-1 rounded-full text-xs font-medium">
              <Crown className="w-3 h-3" />
              Premium
            </div>
          )}
        </div>

        {/* Upgrade Premium (se não for premium) */}
        {!isPremium && (
          <div className="bg-gradient-to-br from-[#5BC5A7] to-[#4AB396] rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center gap-3 mb-3">
              <Crown className="w-8 h-8" />
              <h2 className="text-xl font-bold">Faça Upgrade para Premium</h2>
            </div>
            <p className="text-white/90 mb-4 text-sm">
              Remova anúncios, tenha grupos ilimitados e exporte relatórios em PDF
            </p>
            <button className="w-full bg-white text-[#5BC5A7] py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Assinar Premium - R$ 9,90/mês
            </button>
          </div>
        )}

        {/* Informações */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <h3 className="text-sm font-medium text-gray-700 px-4 py-3 bg-gray-50">Informações</h3>
          <div className="divide-y divide-gray-100">
            <div className="px-4 py-3 flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-800">voce@email.com</p>
              </div>
            </div>
            <div className="px-4 py-3 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Membro desde</p>
                <p className="text-sm text-gray-800">Janeiro de 2024</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <h3 className="text-sm font-medium text-gray-700 px-4 py-3 bg-gray-50">Estatísticas</h3>
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="px-4 py-4 text-center">
              <p className="text-2xl font-bold text-[#5BC5A7]">3</p>
              <p className="text-xs text-gray-600 mt-1">Grupos</p>
            </div>
            <div className="px-4 py-4 text-center">
              <p className="text-2xl font-bold text-[#5BC5A7]">12</p>
              <p className="text-xs text-gray-600 mt-1">Gastos</p>
            </div>
            <div className="px-4 py-4 text-center">
              <p className="text-2xl font-bold text-[#5BC5A7]">8</p>
              <p className="text-xs text-gray-600 mt-1">Amigos</p>
            </div>
          </div>
        </div>

        {/* Ad Space Placeholder */}
        <div className="bg-gray-100 rounded-xl p-4 text-center border-2 border-dashed border-gray-300">
          <p className="text-xs text-gray-500">Espaço reservado para anúncio</p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
