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
  created_at: string
  transaction_splits: {
    user_id: string
    amount: number
  }[]
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        setLoading(false)
        return
      }

      setUser(currentUser)

      const { data: g } = await supabase.from('groups').select('*')

      const { data: t } = await supabase
        .from('transactions')
        .select(`
          id,
          group_id,
          payer_id,
          value,
          created_at,
          transaction_splits (
            user_id,
            amount
          )
        `)
        .order('created_at', { ascending: false })

      const safeGroups = g || []
      const safeTx = t || []

      let global = 0

      const groupsWithBalance = safeGroups.map(group => {
        const groupTx = safeTx.filter(tx => tx.group_id === group.id)

        let balance = 0

        groupTx.forEach(tx => {
          const mySplit = tx.transaction_splits?.find(
            s => s.user_id === currentUser.id
          )
          const myShare = mySplit ? Number(mySplit.amount) : 0

          if (tx.payer_id === currentUser.id) {
            balance += Number(tx.value) - myShare
          } else {
            balance -= myShare
          }
        })

        global += balance
        return { ...group, calculatedBalance: balance }
      })

      setGroups(groupsWithBalance)
      setTransactions(safeTx.slice(0, 5))
      setTotalBalance(global)
      setLoading(false)
    }

    loadAll()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Você não está logado</div>
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
                <p className="text-lg font-semibold">{user.email?.split('@')[0]}</p>
              </div>
            </div>

            <Link href="/profile">
              <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            </Link>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm opacity-90">Saldo total</p>

            {totalBalance === 0 && <p className="text-3xl font-bold">R$ 0,00</p>}
            {totalBalance > 0 && (
              <>
                <p className="text-3xl font-bold">R$ {totalBalance.toFixed(2)}</p>
                <p className="text-sm opacity-90">te devem</p>
              </>
            )}
            {totalBalance < 0 && (
              <>
                <p className="text-3xl font-bold">R$ {Math.abs(totalBalance).toFixed(2)}</p>
                <p className="text-sm opacity-90">você deve</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* GRUPOS */}
      <main className="max-w-4xl mx-auto px-6 py-6 space-y-8">
        <section>
          <h2 className="font-semibold text-gray-800 mb-3">Grupos recentes</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map(group => (
              <Link key={group.id} href={`/group/${group.id}`}>
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{group.name}</p>
                      <div className="flex -space-x-2 mt-3">
                        {group.participants.map(p => (
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
                      {group.calculatedBalance! > 0 && (
                        <p className="text-[#5BC5A7]">R$ {group.calculatedBalance!.toFixed(2)}</p>
                      )}
                      {group.calculatedBalance! < 0 && (
                        <p className="text-[#FF6B6B]">R$ {Math.abs(group.calculatedBalance!).toFixed(2)}</p>
                      )}
                      {group.calculatedBalance === 0 && <p className="text-gray-500">zerado</p>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
