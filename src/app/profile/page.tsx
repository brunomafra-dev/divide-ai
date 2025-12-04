'use client'

import { ArrowLeft, User, Mail, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function Profile() {
  return (
    <div className="min-h-screen bg-[#F7F7F7]">
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
        </div>

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
      </main>
    </div>
  )
}
