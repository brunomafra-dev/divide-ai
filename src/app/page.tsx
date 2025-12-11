'use client'

import { Plus, User, TrendingUp, TrendingDown } from 'lucide-react'
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
  participants?: Participant[]
  // campos calculados localmente
  total_spent?: number
  balance?: number
}

interface Transaction {
  id: string
  group_id: string
  value: number
  payer_id: string
  participants: string[]
  splits: Record<string, number>
  description?: string
}

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      setLoading(true)

      // 1) pega todos os grupos
      const { data: groupsData, error: groupsError } = await supabase
        .from<Group>('groups')
        .select('*')

      if (groupsError) {
        console.error('Erro ao carregar grupos:', groupsError)
        setLoading(false)
        return
      }

      const groupsList = groupsData || []
      if (groupsList.length === 0) {
        setGroups([])
        setTotalBalance(0)
        setLoading(false)
        return
      }

      // 2) pega transações de todos os grupos retornados
      const groupIds = groupsList.map(g => g.id)
      const { data: txData, error: txError } = await supabase
        .from<Transaction>('transactions')
        .select('*')
        .in('group_id', groupIds)

      if (txError) {
        console.error('Erro ao carregar transações:', txError)
      }

      const transactions = txData || []

      // 3) calcula total_spent e balance por grupo (balance do ponto de vista do "Você" = primeiro participante)
      const groupsWithCalc: Group[] = groupsList.map(g => {
        const groupTx = transactions.filter(t => t.group_id === g.id)

        // total gasto no grupo = soma dos values
        const total_spent = groupTx.reduce((acc, t) => acc + (t.value ?? 0), 0)

        // calcula saldo para "Você" (assumimos participants[0] = "Você")
        const me = g.participants && g.participants[0] ? g.participants[0].id : null
        let balance = 0

        if (me) {
          groupTx.forEach(t => {
            // crédito quando eu paguei (recebo o total pago)
            if (t.payer_id === me) {
              balance += (t.value ?? 0)
            }
            // subtraio minha parte na divisão
            const myShare = (t.splits && t.splits[me]) ? t.splits[me] : 0
            balance -= myShare
          })
        } else {
          // se não tem 'me', balance fica 0
          balance = 0
        }

        return {
          ...g,
          total_spent,
          balance
        }
      })

      // 4) totalBalance somando os balances de cada grupo
      const total = groupsWithCalc.reduce((acc, g) => acc + (g.balance ?? 0), 0)

      setGroups(groupsWithCalc)
      setTotalBalance(total)
      setLoading(false)
    }

    loadAll()
  }, [])

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#5BC5A7]">Divide Aí</h1>
          <Link href="/profile">
            <div className="w-10 h-10 bg-[#5BC5A7] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#4AB396] transition-colors">
              <User className="w-6 h-6 text-white" />
            </div>
          </Link>
        </div>
      </header>

      {/* Balance Summary */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
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
                  <p className="text-3xl font-bold text-[#5BC5A7]">R$ {totalBalance.toFixed(2)}</p>
                  <span className="text-sm text-[#5BC5A7] bg-green-50 px-3 py-1 rounded-full">te devem</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-6 h-6 text-[#FF6B6B]" />
                  <p className="text-3xl font-bold text-[#FF6B6B]">R$ {Math.abs(totalBalance).toFixed(2)}</p>
                  <span className="text-sm text-[#FF6B6B] bg-red-50 px-3 py-1 rounded-full">você deve</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Groups List */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-center text-gray-500">Carregando...</p>
        ) : groups.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum grupo ainda</h3>
            <p className="text-gray-600 mb-6">Crie seu primeiro grupo para começar a dividir gastos</p>
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
              <span className="text-sm text-gray-600">{groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}</span>
            </div>
            <div className="space-y-3">
              {groups.map((group) => (
                <Link key={group.id} href={`/group/${group.id}`}>
                  <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-800 mb-1">{group.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{group.participants?.length || 0} {group.participants?.length === 1 ? 'pessoa' : 'pessoas'}</span>
                          <span>•</span>
                          <span>R$ {(group.total_spent ?? 0).toFixed(2)} gasto</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        {group.balance === 0 ? (
                          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">zerado</span>
                        ) : group.balance! > 0 ? (
                          <div className="text-right">
                            <p className="text-xs text-gray-600 mb-1">te devem</p>
                            <p className="text-lg font-semibold text-[#5BC5A7]">R$ {(group.balance ?? 0).toFixed(2)}</p>
                          </div>
                        ) : (
                          <div className="text-right">
                            <p className="text-xs text-gray-600 mb-1">você deve</p>
                            <p className="text-lg font-semibold text-[#FF6B6B]">R$ {Math.abs(group.balance ?? 0).toFixed(2)}</p>
                          </div>
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

      {/* Observação: não colocamos botão flutuante aqui (agora no navbar) */}
    </div>
  )
}
