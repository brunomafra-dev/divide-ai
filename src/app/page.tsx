'use client'

import { User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

interface Participant {
  id: string
  name: string
}

interface Group {
  id: string
  name: string
  participants: Participant[]
  calculatedBalance?: number
}

interface Transaction {
  id: string
  group_id: string
  value: number
  payer_id: string
  description: string
  splits: Record<string, number>
  created_at: string
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const currentUser = await getCurrentUser()
      if (!currentUser) return

      setUser(currentUser)

      const { data: g } = await supabase.from('groups').select('*')
      const { data: t } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      const groupsWithBalance = calculateBalances(
        g || [],
        t || [],
        currentUser.id
      )

      setGroups(groupsWithBalance)
      setTransactions(t || [])
      setLoading(false)
    }

    load()
  }, [])

  function calculateBalances(
    groups: Group[],
    transactions: Transaction[],
    me: string
  ) {
    let global = 0

    const updated = groups.map(group => {
      const groupTx = transactions.filter(tx => tx.group_id === group.id)
      let balance = 0

      groupTx.forEach(tx => {
        if (tx.payer_id === me) balance += tx.value
        balance -= tx.splits?.[me] ?? 0
      })

      global += balance
      return { ...group, calculatedBalance: balance }
    })

    setTotalBalance(global)
    return updated
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#5BC5A7] to-[#6FD1BE]">
        <div className="max-w-4xl mx-auto px-6 py-6 text-white">

          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm opacity-90">Bem-vindo,</p>
                <p className="text-lg font-semibold">
                  {user.email?.split('@')[0]}
                </p>
              </div>
            </div>

            <Link href="/profile">
              <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            </Link>
          </div>

          {/* SALDO */}
          <div className="mt-8 text-center">
            <p className="text-sm opacity-90">Saldo total</p>

            {totalBalance === 0 && (
              <>
                <p className="text-3xl font-bold">R$ 0,00</p>
                <p className="text-sm opacity-90">zerado</p>
              </>
            )}

            {totalBalance > 0 && (
              <>
                <p className="text-3xl font-bold">
                  R$ {totalBalance.toFixed(2)}
                </p>
                <p className="text-sm opacity-90">te devem</p>
              </>
            )}

            {totalBalance < 0 && (
              <>
                <p className="text-3xl font-bold">
                  R$ {Math.abs(totalBalance).toFixed(2)}
                </p>
                <p className="text-sm opacity-90">você deve</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <main className="max-w-4xl mx-auto px-6 py-6 space-y-8">

        {/* GRUPOS */}
        <section>
          <div className="flex justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Grupos recentes</h2>
            <Link href="/groups" className="text-sm text-gray-500">
              Ver todos
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map(group => {
              const balance = group.calculatedBalance ?? 0

              return (
                <Link key={group.id} href={`/group/${group.id}`}>
                  <div className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-sm text-gray-500">
                          {group.participants.length} pessoas
                        </p>

                        <div className="flex -space-x-2 mt-3">
                          {group.participants.slice(0, 4).map(p => (
                            <div
                              key={p.id}
                              className="w-8 h-8 rounded-full bg-[#5BC5A7] text-white flex items-center justify-center text-xs font-semibold border-2 border-white"
                            >
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-right">
                        {balance > 0 && (
                          <p className="text-sm text-[#5BC5A7]">
                            R$ {balance.toFixed(2)}
                            <br />te devem
                          </p>
                        )}
                        {balance < 0 && (
                          <p className="text-sm text-[#FF6B6B]">
                            R$ {Math.abs(balance).toFixed(2)}
                            <br />você deve
                          </p>
                        )}
                        {balance === 0 && (
                          <p className="text-sm text-gray-500">zerado</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ATIVIDADES */}
        <section>
          <h2 className="font-semibold text-gray-800 mb-3">
            Atividades recentes
          </h2>

          <div className="space-y-3">
            {transactions.map(tx => {
              const group = groups.find(g => g.id === tx.group_id)
              const payer =
                tx.payer_id === user.id
                  ? 'Você'
                  : group?.participants.find(p => p.id === tx.payer_id)?.name ||
                    'Alguém'

              return (
                <div
                  key={tx.id}
                  className="bg-white p-4 rounded-xl shadow-sm border"
                >
                  <p className="font-medium text-gray-800">
                    {payer} pagou R$ {tx.value.toFixed(2)} em {group?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(tx.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

      </main>
    </div>
  )
}
