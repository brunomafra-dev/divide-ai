'use client'

import { TrendingUp, TrendingDown, User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Participant {
  id: string
  name: string
}

interface Group {
  id: string
  name: string
  participants: Participant[]
}

interface Transaction {
  id: string
  group_id: string
  value: number
  payer_id: string
  splits: Record<string, number>
  description: string
}

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const [totalBalance, setTotalBalance] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: g } = await supabase.from('groups').select('*')
      const { data: t } = await supabase.from('transactions').select('*')

      setGroups(g || [])
      setTransactions(t || [])

      calculateBalances(g || [], t || [])
      setLoading(false)
    }

    load()
  }, [])

  function calculateBalances(groups: Group[], transactions: Transaction[]) {
    let globalBalance = 0
    const me = groups[0]?.participants?.[0]?.id

    groups.forEach(group => {
      const groupTx = transactions.filter(t => t.group_id === group.id)
      let groupBalance = 0

      groupTx.forEach(tx => {
        if (tx.payer_id === me) {
          groupBalance += tx.value
        }

        const myShare = tx.splits?.[me] ?? 0
        groupBalance -= myShare
      })

      ;(group as any).calculatedBalance = groupBalance
      globalBalance += groupBalance
    })

    setTotalBalance(globalBalance)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Carregando...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">

      {/* HEADER */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-[#5BC5A7]">
            Bem vindo, Mafra
          </h1>

          <Link href="/profile">
            <div className="w-10 h-10 bg-[#5BC5A7] rounded-full flex items-center justify-center">
              <User className="text-white w-5 h-5" />
            </div>
          </Link>
        </div>
      </header>

      {/* SALDO GERAL */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-500 mb-1">Saldo geral</p>

          {totalBalance === 0 && (
            <p className="text-3xl font-bold text-gray-800">R$ 0,00</p>
          )}

          {totalBalance > 0 && (
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="text-[#5BC5A7]" />
              <p className="text-3xl font-bold text-[#5BC5A7]">
                R$ {totalBalance.toFixed(2)}
              </p>
            </div>
          )}

          {totalBalance < 0 && (
            <div className="flex items-center justify-center gap-2">
              <TrendingDown className="text-[#FF6B6B]" />
              <p className="text-3xl font-bold text-[#FF6B6B]">
                R$ {Math.abs(totalBalance).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* GRUPOS RECENTES */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Grupos recentes
        </h2>

        {groups.length === 0 && (
          <p className="text-gray-500">Nenhum grupo criado ainda.</p>
        )}

        <div className="space-y-3">
          {groups.map(group => {
            const balance = (group as any).calculatedBalance ?? 0

            return (
              <Link key={group.id} href={`/group/${group.id}`}>
                <div className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-all">
                  <div className="flex justify-between items-center">

                    <div>
                      <p className="text-lg font-medium text-gray-800">
                        {group.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {group.participants?.length || 0} pessoas
                      </p>
                    </div>

                    <div className="text-right">
                      {balance === 0 && (
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          zerado
                        </span>
                      )}

                      {balance > 0 && (
                        <>
                          <p className="text-xs text-gray-500">te devem</p>
                          <p className="text-lg font-semibold text-[#5BC5A7]">
                            R$ {balance.toFixed(2)}
                          </p>
                        </>
                      )}

                      {balance < 0 && (
                        <>
                          <p className="text-xs text-gray-500">você deve</p>
                          <p className="text-lg font-semibold text-[#FF6B6B]">
                            R$ {Math.abs(balance).toFixed(2)}
                          </p>
                        </>
                      )}
                    </div>

                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
