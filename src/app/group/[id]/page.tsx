'use client'

import { ArrowLeft, Plus, TrendingUp, TrendingDown, Settings } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Participant {
  id: string
  name: string
  email?: string
}

interface Transaction {
  id: string
  description: string
  amount: number
  payerId: string
  payerName: string
  date: string
  participants: string[]
}

interface Group {
  id: string
  name: string
  category: string
  totalSpent: number
  balance: number
  participants: number
  participantsList: Participant[]
  transactions: Transaction[]
}

export default function GroupPage() {
  const params = useParams()
  const groupId = params.id as string
  const [group, setGroup] = useState<Group | null>(null)

  useEffect(() => {
    // Carregar grupo do localStorage
    const savedGroup = localStorage.getItem(`divideai_group_${groupId}`)
    if (savedGroup) {
      setGroup(JSON.parse(savedGroup))
    }
  }, [groupId])

  if (!group) {
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

      {/* Balance Card */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total gasto</p>
              <p className="text-2xl font-bold text-gray-800">R$ {group.totalSpent.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Seu saldo</p>
              {group.balance === 0 ? (
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold text-gray-800">R$ 0,00</p>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">zerado</span>
                </div>
              ) : group.balance > 0 ? (
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#5BC5A7]" />
                  <p className="text-2xl font-bold text-[#5BC5A7]">R$ {group.balance.toFixed(2)}</p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <TrendingDown className="w-5 h-5 text-[#FF6B6B]" />
                  <p className="text-2xl font-bold text-[#FF6B6B]">R$ {Math.abs(group.balance).toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {group.transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum gasto ainda</h3>
            <p className="text-gray-600 mb-6">Adicione o primeiro gasto do grupo</p>
            <Link href={`/group/${groupId}/add-expense`}>
              <button className="bg-[#5BC5A7] text-white px-6 py-3 rounded-lg hover:bg-[#4AB396] transition-colors">
                Adicionar gasto
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Gastos</h2>
              <span className="text-sm text-gray-600">{group.transactions.length} {group.transactions.length === 1 ? 'gasto' : 'gastos'}</span>
            </div>
            <div className="space-y-3">
              {group.transactions.map((transaction) => (
                <div key={transaction.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-base font-medium text-gray-800">{transaction.description}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {transaction.payerName} pagou
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">R$ {transaction.amount.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span>{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                    <span>{transaction.participants.length} {transaction.participants.length === 1 ? 'pessoa' : 'pessoas'}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Floating Action Button */}
      <Link href={`/group/${groupId}/add-expense`}>
        <button className="fixed bottom-20 right-6 w-16 h-16 bg-[#5BC5A7] rounded-full flex items-center justify-center shadow-lg hover:bg-[#4AB396] transition-all hover:scale-110">
          <Plus className="w-8 h-8 text-white" />
        </button>
      </Link>
    </div>
  )
}
