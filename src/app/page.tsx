'use client'

import { User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

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
  splits: Record<string, number>
  created_at: string
}

export default function Home() {
  const { user, loading: authLoading } = useAuth()

  const [groups, setGroups] = useState<Group[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalBalance, setTotalBalance] = useState(0)

  // 🔐 1. AUTENTICAÇÃO MANDA
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Você não está logado</p>
      </div>
    )
  }

  // 🔄 2. BUSCA DE DADOS SÓ DEPOIS DO USER EXISTIR
  useEffect(() => {
    async function load() {
      const { data: allGroups } = await supabase
        .from('groups')
        .select('*')

      const userGroups =
        (allGroups || []).filter(group =>
          group.participants?.some((p: any) => p.id === user.id)
        )

      const { data: allTx } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })

      const groupsWithBalance = calculateBalances(
        userGroups,
        allTx || [],
        user.id
      )

      setGroups(groupsWithBalance)
      setTransactions((allTx || []).slice(0, 5))
    }

    load()
  }, [user.id])

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
        if (tx.payer_id === me) balance += Number(tx.value)
        balance -= tx.splits?.[me] ?? 0
      })

      global += balance
      return { ...group, calculatedBalance: balance }
    })

    setTotalBalance(global)
    return updated
  }

  // 🎨 UI (NÃO MEXI NO DESIGN)
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

          <div className="mt-8 text-center">
            <p className="text-sm opacity-90">Saldo total</p>
            <p className="text-3xl font-bold">
              R$ {totalBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
