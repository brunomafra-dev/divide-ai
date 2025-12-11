'use client'

import { User, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Group {
  id: string
  name: string
  total_spent: number
  balance: number
  participants: any[]
}

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadGroups() {
      const { data, error } = await supabase
        .from('groups')
        .select('*')

      if (error) {
        console.error('Erro ao carregar grupos:', error)
        setLoading(false)
        return
      }

      setGroups(data || [])

      const total = (data || []).reduce((acc, group) => acc + (group.balance || 0), 0)
      setTotalBalance(total)

      setLoading(false)
    }

    loadGroups()
  }, [])

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-24">
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#5BC5A7]">Divide Aí</h1>

          <Link href="/profile">
            <div className="w-10 h-10 bg-[#5BC5A7] rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </Link>
        </div>
      </header>

      {/* Balance Summary */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">

          <p className="text-sm text-gray-600 mb-1">Saldo total</p>

          <div className="flex items-center justify-center gap-2">
            {totalBalance === 0 ? (
              <>
                <p className="text-3xl font-bold text-gray-800">R$ 0,00</p>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">zerado</span>
              </>
            ) : totalBalance > 0 ? (
              <>
                <TrendingUp className="w-6 h-6 text-[#5BC5A7]" />
                <p className="text-3xl font-bold text-[#5BC5A7]">
                  R$ {totalBalance.toFixed(2)}
                </p>
                <span className="text-sm text-[#5BC5A7] bg-green-50 px-3 py-1 rounded-full">te devem</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-6 h-6 text-[#FF6B6B]" />
                <p className="text-3xl font-bold text-[#FF6B6B]">
                  R$ {Math.abs(totalBalance).toFixed(2)}
                </p>
                <span className="text-sm text-[#FF6B6B] bg-red-50 px-3 py-1 rounded-full">você deve</span>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Lista de grupos */}
      <main className="max-w-4xl mx-auto px-4 py-6">

        {loading ? (
          <p className="text-center text-gray-500">Carregando...</p>
        ) : groups.length === 0 ? (
          
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-10 h-10 text-gray-400" />
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum grupo ainda</h3>
            <p className="text-gray-600 mb-6">Crie seu primeiro grupo para começar</p>

            {/* ESTE BOTÃO PERMANECE se quiser manter opção também */}
            {/* Pode remover se quiser usar só o modal */}
            <Link href="/create-group">
              <button className="bg-[#5BC5A7] text-white px-6 py-3 rounded-lg hover:bg-[#4AB396] transition-colors">
                Criar grupo
              </button>
            </Link>
          </div>

        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Seus grupos</h2>
              <span className="text-sm text-gray-600">
                {groups.length} {groups.length === 1 ? "grupo" : "grupos"}
              </span>
            </div>

            <div className="space-y-3">
              {groups.map(group => (
                <Link key={group.id} href={`/group/${group.id}`}>
                  <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100">
                    <div className="flex justify-between items-start">
                      
                      <div>
                        <h3 className="text-lg font-medium">{group.name}</h3>
                        <p className="text-sm text-gray-600">{group.participants?.length || 0} pessoas</p>
                      </div>

                      <div className="text-right">
                        {group.balance > 0 && (
                          <p className="text-[#5BC5A7] font-semibold">
                            R$ {group.balance.toFixed(2)}
                          </p>
                        )}
                        {group.balance < 0 && (
                          <p className="text-[#FF6B6B] font-semibold">
                            - R$ {Math.abs(group.balance).toFixed(2)}
                          </p>
                        )}
                        {group.balance === 0 && (
                          <p className="text-gray-500">zerado</p>
                        )}
                      </div>

                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      {/* O BOTÃO FLUTUANTE FOI REMOVIDO 👇 */}
      {/* 🔥 REMOVIDO AQUI */}

    </div>
  )
}
