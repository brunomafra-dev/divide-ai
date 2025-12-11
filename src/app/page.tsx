'use client'

import { Plus, User, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Participant {
  id: string
  name: string
}

interface Transaction {
  id: string
  group_id: string
  value: number
  payer_id: string
  participants: string[]
  splits: Record<string, number>
  description: string
}

interface Group {
  id: string
  name: string
  participants: Participant[]
}

export default function Home() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalBalance, setTotalBalance] = useState(0)

  useEffect(() => {
    async function loadGroups() {
      const { data: groupsData } = await supabase
        .from('groups')
        .select('*')

      if (!groupsData) {
        setLoading(false)
        return
      }

      let finalGroups: any[] = []
      let globalBalance = 0

      for (const group of groupsData) {
        // Carrega as transações do grupo
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('group_id', group.id)

        const participants = group.participants ?? []
        const me = participants[0]?.id // "Você"

        let totalSpent = 0
        let myBalance = 0

        transactions?.forEach(tx => {
          totalSpent += tx.value

          if (tx.payer_id === me) myBalance += tx.value

          const myShare = tx.splits[me] ?? 0
          myBalance -= myShare
        })

        globalBalance += myBalance

        finalGroups.push({
          ...group,
          total_spent: totalSpent,
          balance: myBalance
        })
      }

      setGroups(finalGroups)
      setTotalBalance(globalBalance)
      setLoading(false)
    }

    loadGroups()
  }, [])

  return (
    <div className="min-h-screen bg-[#F7F7F7]">

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#5BC5A7]">Divide Aí</h1>

          <Link href="/profile">
            <div className="w-10 h-10 bg-[#5BC5A7] rounded-full flex items-center justify-center hover:bg-[#4AB396] transition-colors">
              <User className="w-6 h-6 text-white" />
            </div>
          </Link>
        </div>
      </header>

      {/* SALDO GERAL */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-600 mb-1">Saldo total</p>

          {totalBalance === 0 ? (
            <div className="flex items-center justify-center gap-2">
              <p className="text-3xl font-bold text-gray-800">R$ 0,00</p>
              <span className="px-3 py-1 text-sm bg-gray-100 text-gray-500 rounded-full">zerado</span>
            </div>
          ) : totalBalance > 0 ? (
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#5BC5A7]" />
              <p className="text-3xl font-bold text-[#5BC5A7]">R$ {totalBalance.toFixed(2)}</p>
              <span className="px-3 py-1 text-sm bg-green-50 text-[#5BC5A7] rounded-full">te devem</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <TrendingDown className="w-6 h-6 text-[#FF6B6B]" />
              <p className="text-3xl font-bold text-[#FF6B6B]">R$ {Math.abs(totalBalance).toFixed(2)}</p>
              <span className="px-3 py-1 text-sm bg-red-50 text-[#FF6B6B] rounded-full">você deve</span>
            </div>
          )}
        </div>
      </div>

      {/* LISTA DE GRUPOS */}
      <main className="max-w-4xl mx-auto px-4 py-6">

        {loading ? (
          <p className="text-center text-gray-500">Carregando...</p>
        ) : groups.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-10 h-10 text-gray-400" />
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Nenhum grupo ainda
            </h3>

            <p className="text-gray-600 mb-6">
              Crie seu primeiro grupo para começar a dividir gastos.
            </p>

            <Link href="/create-group">
              <button className="bg-[#5BC5A7] text-white px-6 py-3 rounded-lg hover:bg-[#4AB396] transition-colors">
                Criar primeiro grupo
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Seus grupos</h2>
              <span className="text-sm text-gray-600">{groups.length} grupos</span>
            </div>

            <div className="space-y-3">
              {groups.map(group => (
                <Link key={group.id} href={`/group/${group.id}`}>
                  <div className="bg-white rounded-xl p-4 shadow-sm border cursor-pointer hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      
                      {/* ESQUERDA */}
                      <div>
                        <h3 className="text-lg font-semibold">{group.name}</h3>
                        <p className="text-sm text-gray-500">
                          {group.participants?.length || 0} pessoas • R$ {group.total_spent.toFixed(2)} gasto
                        </p>
                      </div>

                      {/* DIREITA: SALDO */}
                      {group.balance === 0 ? (
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          zerado
                        </span>
                      ) : group.balance > 0 ? (
                        <div className="text-right">
                          <p className="text-xs text-gray-600 mb-1">te devem</p>
                          <p className="text-lg font-semibold text-[#5BC5A7]">
                            R$ {group.balance.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <div className="text-right">
                          <p className="text-xs text-gray-600 mb-1">você deve</p>
                          <p className="text-lg font-semibold text-[#FF6B6B]">
                            R$ {Math.abs(group.balance).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

      </main>

      {/* Botão flutuante */}
      <Link href="/create-group">
        <button className="fixed bottom-6 right-6 w-16 h-16 bg-[#5BC5A7] rounded-full flex items-center justify-center shadow-lg hover:bg-[#4AB396] hover:scale-110 transition-all">
          <Plus className="w-8 h-8 text-white" />
        </button>
      </Link>

    </div>
  )
}
