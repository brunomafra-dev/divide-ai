'use client'

import { User, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Group {
  id: string
  name: string
  balance: number
}

interface Activity {
  id: string
  value: number
  payer_id: string
  created_at: string
  groups: {
    name: string
  } | null
}

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      // --------- GRUPOS ----------
      const { data: groupsData } = await supabase
        .from('groups')
        .select('id, name, balance')

      const groupsList = groupsData || []
      setGroups(groupsList)

      const total = groupsList.reduce(
        (acc, g) => acc + (g.balance || 0),
        0
      )
      setTotalBalance(total)

      // --------- ATIVIDADES ----------
      const { data: activitiesData } = await supabase
        .from('transactions')
        .select(`
          id,
          value,
          payer_id,
          created_at,
          groups (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      setActivities(activitiesData || [])
      setLoading(false)
    }

    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-[#F7F7F7]">

      {/* HEADER */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">
            Bem-vindo, Mafra
          </h1>

          {/* Avatar */}
          <Link href="/profile">
            <div className="w-10 h-10 bg-[#5BC5A7] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#4AB396] transition-colors">
              <User className="w-6 h-6 text-white" />
            </div>
          </Link>
        </div>
      </header>

      {/* SALDO GERAL */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-sm text-gray-600 mb-2">Saldo geral</p>

          {totalBalance === 0 ? (
            <p className="text-3xl font-bold text-gray-800">R$ 0,00</p>
          ) : totalBalance > 0 ? (
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#5BC5A7]" />
              <p className="text-3xl font-bold text-[#5BC5A7]">
                R$ {totalBalance.toFixed(2)}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <TrendingDown className="w-6 h-6 text-[#FF6B6B]" />
              <p className="text-3xl font-bold text-[#FF6B6B]">
                R$ {Math.abs(totalBalance).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CONTEÚDO */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-10">

        {/* GRUPOS RECENTES */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Grupos recentes
          </h2>

          {loading ? (
            <p className="text-gray-500">Carregando...</p>
          ) : groups.length === 0 ? (
            <p className="text-gray-500">Nenhum grupo ainda.</p>
          ) : (
            <div className="space-y-3">
              {groups.map(group => (
                <Link key={group.id} href={`/group/${group.id}`}>
                  <div className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-all">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-gray-800">
                        {group.name}
                      </p>

                      {group.balance === 0 ? (
                        <span className="text-sm text-gray-500">zerado</span>
                      ) : group.balance > 0 ? (
                        <span className="text-sm font-semibold text-[#5BC5A7]">
                          R$ {group.balance.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-[#FF6B6B]">
                          R$ {Math.abs(group.balance).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ATIVIDADES RECENTES */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Atividades recentes
          </h2>

          {activities.length === 0 ? (
            <p className="text-gray-500">Nenhuma atividade ainda.</p>
          ) : (
            <div className="space-y-3">
              {activities.map(act => (
                <div
                  key={act.id}
                  className="bg-white p-4 rounded-xl shadow-sm border"
                >
                  <p className="text-sm text-gray-700">
                    <strong>
                      {act.payer_id === 'self' ? 'Você' : 'Alguém'}
                    </strong>{' '}
                    pagou{' '}
                    <strong>R$ {act.value.toFixed(2)}</strong>{' '}
                    em{' '}
                    <strong>
                      {act.groups?.name || 'Grupo'}
                    </strong>
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(act.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}

