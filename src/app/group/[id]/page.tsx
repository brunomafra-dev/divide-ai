'use client'

import { ArrowLeft, Plus, TrendingUp, TrendingDown, Settings } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

interface Participant {
  id: string
  name: string
  email?: string
}

interface Group {
  id: string
  name: string
  category: string
  total_spent: number
  balance: number
  participants: Participant[]
}

export default function GroupPage() {
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadGroup() {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (error) {
        console.error(error)
        return
      }

      setGroup(data)
      setLoading(false)
    }

    loadGroup()
  }, [groupId])

  if (loading || !group) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

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
          <h1 className="text-lg font-semibold text-gray-800">{group.name}</h1>

          <Link href={`/group/${groupId}/settings`}>
            <button className="text-gray-600 hover:text-gray-800">
              <Settings className="w-6 h-6" />
            </button>
          </Link>
        </div>
      </header>

      {/* Balance */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total gasto</p>
              <p className="text-2xl font-bold text-gray-800">
                R$ {Number(group.total_spent).toFixed(2)}
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Seu saldo</p>

              {group.balance === 0 ? (
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold text-gray-800">R$ 0,00</p>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    zerado
                  </span>
                </div>
              ) : group.balance > 0 ? (
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#5BC5A7]" />
                  <p className="text-2xl font-bold text-[#5BC5A7]">
                    R$ {Number(group.balance).toFixed(2)}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <TrendingDown className="w-5 h-5 text-[#FF6B6B]" />
                  <p className="text-2xl font-bold text-[#FF6B6B]">
                    R$ {Math.abs(Number(group.balance)).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Participants */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Participantes
        </h2>

        <div className="space-y-3">
          {group.participants.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border">
              <p className="text-gray-800 font-medium">{p.name}</p>
              {p.email && (
                <p className="text-xs text-gray-500">{p.email}</p>
              )}
            </div>
          ))}
        </div>

        {/* CTA Add expense */}
        <div className="mt-10 text-center">
          <Link href={`/group/${groupId}/add-expense`}>
            <button className="bg-[#5BC5A7] text-white px-6 py-3 rounded-lg hover:bg-[#4AB396] transition-colors">
              Adicionar gasto
            </button>
          </Link>
        </div>
      </main>

      {/* Floating button */}
      <Link href={`/group/${groupId}/add-expense`}>
        <button className="fixed bottom-20 right-6 w-16 h-16 bg-[#5BC5A7] rounded-full flex items-center justify-center shadow-lg hover:bg-[#4AB396] hover:scale-110 transition-all">
          <Plus className="w-8 h-8 text-white" />
        </button>
      </Link>
    </div>
  )
}
