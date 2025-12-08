'use client'

import { ArrowLeft, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Participant {
  id: string
  name: string
  email?: string
}

interface Transaction {
  id: string
  description: string
  value: number
  payer_id: string
  participants: string[]
  splits: Record<string, number>
  created_at: string
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
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [yourBalance, setYourBalance] = useState(0)

  useEffect(() => {
    loadData()
  }, [groupId])

  async function loadData() {
    // 1 — Carrega o grupo
    const { data: groupData } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()

    if (!groupData) return

    setGroup(groupData)

    // 2 — Carrega transações
    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('groupid', groupId)
      .order('created_at', { ascending: false })

    setTransactions(txData || [])

    // 3 — Recalcula saldo do usuário "self"
    const me = groupData.participants.find(p => p.id === 'self')
    if (me) {
      const bal = calcBalance(me.id, txData || [])
      setYourBalance(bal)
    }

    setLoading(false)
  }

  function calcBalance(userId: string, all: Transaction[]) {
    let balance = 0

    all.forEach(tx => {
      const paid = tx.payer_id === userId ? tx.value : 0
      const owes = tx.splits[userId] ?? 0
      balance += paid - owes
    })

    return balance
  }

  if (loading || !group) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>

          <h1 className="text-lg font-semibold text-gray-800">{group.name}</h1>

          <div className="w-6" />
        </div>
      </header>

      {/* Balance Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          
          {/* Total gasto */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">Total gasto</p>
            <p className="text-2xl font-bold text-gray-800">
              R$ {Number(group.total_spent).toFixed(2)}
            </p>
          </div>

          {/* Seu saldo */}
          <div className="text-center">
            <p className="text-sm text-gray-600">Seu saldo</p>

            {yourBalance === 0 && (
              <p className="text-lg font-semibold text-gray-700">R$ 0,00</p>
            )}

            {yourBalance > 0 && (
              <div className="flex justify-center gap-2 items-center">
                <TrendingUp className="text-[#5BC5A7]" />
                <p className="text-xl font-bold text-[#5BC5A7]">
                  R$ {yourBalance.toFixed(2)}
                </p>
              </div>
            )}

            {yourBalance < 0 && (
              <div className="flex justify-center gap-2 items-center">
                <TrendingDown className="text-[#FF6B6B]" />
                <p className="text-xl font-bold text-[#FF6B6B]">
                  – R$ {Math.abs(yourBalance).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <main className="max-w-4xl mx-auto px-4 py-6">

        <h2 className="text-lg font-semibold text-gray-800 mb-4">Gastos</h2>

        {transactions.length === 0 && (
          <p className="text-gray-500 text-center mt-10">
            Nenhum gasto registrado ainda.
          </p>
        )}

        <div className="space-y-3">
          {transactions.map(tx => {
            const payer = group.participants.find(p => p.id === tx.payer_id)
            return (
              <div 
                key={tx.id} 
                className="bg-white p-4 rounded-xl shadow-sm border"
              >
                <div className="flex justify-between">
                  <p className="font-semibold text-gray-800">
                    {tx.description}
                  </p>
                  <p className="font-bold text-gray-800">
                    R$ {tx.value.toFixed(2)}
                  </p>
                </div>

                <p className="text-sm text-gray-500 mt-1">
                  Pago por <strong>{payer?.name || 'Desconhecido'}</strong>
                </p>
              </div>
            )
          })}
        </div>

        {/* Add Expense Button */}
        <div className="mt-10 text-center">
          <Link href={`/group/${groupId}/add-expense`}>
            <button className="bg-[#5BC5A7] text-white px-6 py-3 rounded-lg shadow hover:bg-[#4AB396]">
              Adicionar gasto
            </button>
          </Link>
        </div>

      </main>

      {/* Floating Add Button */}
      <Link href={`/group/${groupId}/add-expense`}>
        <button className="fixed bottom-20 right-6 w-16 h-16 bg-[#5BC5A7] rounded-full flex items-center justify-center shadow-lg hover:bg-[#4AB396] hover:scale-110 transition-all">
          <Plus className="text-white w-8 h-8" />
        </button>
      </Link>
    </div>
  )
}
