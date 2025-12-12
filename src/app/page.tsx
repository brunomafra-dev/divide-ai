'use client'

import { ArrowLeft, Plus, Users, Clock } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Participant = { id: string; name: string; email?: string }
type GroupRow = {
  id: string
  name: string
  total_spent?: number
  balance?: number
  participants?: Participant[]  // pode estar em participants ou participantsList dependendo do momento
  participantsList?: Participant[]
  category?: string
}
type TxRow = {
  id: string
  group_id?: string
  groupid?: string
  value?: number
  amount?: number
  description?: string
  payer_id?: string
  payerid?: string
  participants?: string[]
  splits?: Record<string, number>
  created_at?: string
}

export default function HomePremium() {
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [transactions, setTransactions] = useState<TxRow[]>([])
  const [loading, setLoading] = useState(true)

  // Modal de ações rápidas
  const [showActionModal, setShowActionModal] = useState(false)
  const [addExpenseGroup, setAddExpenseGroup] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      // carrega grupos
      const { data: gData, error: gErr } = await supabase.from('groups').select('*')
      if (gErr) {
        console.error('Erro ao buscar grupos', gErr)
      }
      const groupsList: GroupRow[] = (gData || []).map((g: any) => ({
        ...g,
      }))
      setGroups(groupsList)

      // carrega transações recentes
      const { data: tData, error: tErr } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (tErr) {
        console.error('Erro ao buscar transações', tErr)
      }

      setTransactions((tData || []) as TxRow[])
      setLoading(false)
    }

    load()
  }, [])

  // soma do balance total entre grupos
  const totalBalance = groups.reduce((acc, g) => acc + (Number(g.balance ?? 0) || 0), 0)

  // pega os últimos 8 grupos (por atualização) para o carrossel
  const recentGroups = groups.slice(0, 8)

  // últimos movimentos (normaliza os campos)
  const recentActivities = transactions.map(tx => {
    const groupId = (tx.group_id ?? tx.groupid) as string | undefined
    const group = groups.find(g => g.id === groupId)
    const payerId = (tx.payer_id ?? tx.payerid) as string | undefined
    const participantsList = (group?.participants ?? group?.participantsList) ?? []
    const payerName = participantsList.find((p: any) => p.id === payerId)?.name ?? 'Alguém'
    const value = Number(tx.value ?? tx.amount ?? 0)
    return {
      id: tx.id,
      groupId,
      groupName: group?.name ?? 'Grupo',
      payerName,
      value,
      description: tx.description ?? '',
      when: tx.created_at ?? ''
    }
  })

  // helper: abre modal para adicionar gasto em grupo (redireciona à página depois)
  function openAddExpenseFor(groupId?: string) {
    if (groupId) {
      // redireciona direto
      window.location.href = `/group/${groupId}/add-expense`
      return
    }
    setShowActionModal(true)
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-24">
      {/* HEADER com gradiente D — gradiente personalizado do Divide Aí */}
      <header className="pb-6">
        <div
          className="w-full"
          style={{
            background:
              'linear-gradient(135deg, rgba(91,197,167,1) 0%, rgba(78,201,173,0.92) 35%, rgba(72,190,195,0.88) 70%, rgba(106,203,189,0.95) 100%)'
          }}
        >
          <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
                D
              </div>
              <div>
                <p className="text-sm text-white/90">Bom dia,</p>
                <h1 className="text-white text-xl font-bold">Mafra</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/profile" className="hidden sm:flex items-center gap-2 text-white/90">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">😊</div>
              </Link>

              <button
                onClick={() => openAddExpenseFor()}
                className="bg-white/10 text-white px-3 py-2 rounded-lg hover:bg-white/20 transition"
                title="Ações rápidas"
              >
                Ações
              </button>
            </div>
          </div>

          {/* Hub de Ações central — card */}
          <div className="max-w-4xl mx-auto px-4 -mt-8">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg p-4 flex gap-3 items-center">
              <div className="flex-1">
                <p className="text-xs text-gray-500">Saldo total</p>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-bold">
                    {totalBalance === 0 ? 'R$ 0,00' : (totalBalance > 0 ? `R$ ${totalBalance.toFixed(2)}` : `- R$ ${Math.abs(totalBalance).toFixed(2)}`)}
                  </p>
                  <span className="text-sm text-gray-500">{totalBalance === 0 ? 'zerado' : (totalBalance > 0 ? 'te devem' : 'você deve')}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/create-group'}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium shadow-sm"
                >
                  Criar grupo
                </button>

                <button
                  onClick={() => openAddExpenseFor()}
                  className="px-4 py-2 rounded-lg bg-[#5BC5A7] text-white text-sm font-medium shadow"
                >
                  <Plus className="inline w-4 h-4 mr-2" /> Adicionar gasto
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CARROSSEL DE GRUPOS RECENTES */}
      <section className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Grupos recentes</h2>
          <Link href="/groups" className="text-sm text-gray-500">Ver todos</Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {recentGroups.length === 0 ? (
            <div className="bg-white rounded-xl p-4 shadow-sm min-w-[240px]">
              <p className="text-sm text-gray-600">Nenhum grupo ainda</p>
              <Link href="/create-group" className="mt-3 inline-block bg-[#5BC5A7] text-white px-3 py-2 rounded-lg">Criar um</Link>
            </div>
          ) : recentGroups.map(g => {
            const participants = (g.participants ?? g.participantsList) ?? []
            return (
              <Link key={g.id} href={`/group/${g.id}`} className="min-w-[220px] shrink-0">
                <div className="bg-white rounded-xl p-4 shadow hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">{g.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{participants.length} {participants.length === 1 ? 'pessoa' : 'pessoas'}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">R$ {Number(g.total_spent ?? 0).toFixed(2)}</p>
                      <p className={`text-sm font-semibold ${ (g.balance ?? 0) > 0 ? 'text-[#0f766e]' : ( (g.balance ?? 0) < 0 ? 'text-[#c53030]' : 'text-gray-500') }`}>
                        { (g.balance ?? 0) === 0 ? 'zerado' : ((g.balance ?? 0) > 0 ? `R$ ${(g.balance ?? 0).toFixed(2)}` : `- R$ ${Math.abs(g.balance ?? 0).toFixed(2)}`) }
                      </p>
                    </div>
                  </div>

                  {/* mini avatars */}
                  <div className="flex items-center gap-2 mt-4">
                    {participants.slice(0,4).map((p:any) => (
                      <div key={p.id} className="w-8 h-8 rounded-full bg-[#5BC5A7] text-white flex items-center justify-center text-xs font-medium">
                        {p.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                    ))}
                    {participants.length > 4 && <div className="text-xs text-gray-500 ml-2">+{participants.length - 4}</div>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* FEED DE ATIVIDADES RECENTES */}
      <section className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Atividades recentes</h2>
          <button className="text-sm text-gray-500">Filtrar</button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-gray-500">Carregando...</p>
          ) : recentActivities.length === 0 ? (
            <p className="text-gray-500">Sem movimentos recentes.</p>
          ) : recentActivities.slice(0, 10).map(act => (
            <div key={act.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e6fffa] flex items-center justify-center text-[#0f766e]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-800">
                    <strong>{act.payerName}</strong> pagou <strong>R$ {act.value.toFixed(2)}</strong> em <span className="text-gray-600">{act.groupName}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1"> {act.description || '—'} • {act.when ? new Date(act.when).toLocaleString() : <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> agora</span>}</p>
                </div>
              </div>

              <div className="text-right text-xs text-gray-500">
                <p>{/* placeholder para estados */}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal simples de ações rápidas */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowActionModal(false)} />
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-4 w-full sm:max-w-md z-50">
            <h3 className="text-lg font-semibold mb-3">Ações rápidas</h3>

            <div className="space-y-3">
              <button
                onClick={() => { setShowActionModal(false); window.location.href = '/create-group' }}
                className="w-full py-3 rounded-lg border"
              >
                Criar grupo
              </button>

              <div>
                <p className="text-sm text-gray-600 mb-2">Adicionar gasto em:</p>
                <div className="grid grid-cols-2 gap-2">
                  {groups.slice(0,6).map(g => (
                    <button key={g.id} onClick={() => openAddExpenseFor(g.id)} className="py-2 rounded-lg border text-left px-3">
                      <div className="text-sm font-medium">{g.name}</div>
                      <div className="text-xs text-gray-500">R$ {Number(g.total_spent ?? 0).toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setShowActionModal(false)} className="w-full py-2 rounded-lg text-sm text-gray-600">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

