'use client'

import { Plus, User, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Participant { id: string; name: string }
interface Group { id: string; name: string; participants?: Participant[]; }
interface Transaction {
  id: string;
  group_id: string;
  value: number;
  payer_id: string;
  participants: string[];
  splits: Record<string, number>;
  description: string;
  created_at?: string;
}

export default function HomePage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)

  // create-group fields
  const [newName, setNewName] = useState('')
  const [newParticipantsText, setNewParticipantsText] = useState('Você') // comma separated

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadAll() {
    setLoading(true)
    const { data: g } = await supabase.from('groups').select('*')
    const { data: t } = await supabase.from('transactions').select('*')

    setGroups(g || [])
    setTransactions((t || []).map(tx => ({
      ...tx,
      value: Number(tx.value)
    })))
    setLoading(false)
  }

  // calcula total spent (soma de todas as transações) e saldo total "você" (soma por grupo usando 'você' como primeiro participante)
  function computeTotals() {
    let totalSpent = 0
    let totalBalance = 0

    groups.forEach(group => {
      const groupTx = transactions.filter(tx => tx.group_id === group.id)
      const gTotal = groupTx.reduce((s, tx) => s + (Number(tx.value) || 0), 0)
      totalSpent += gTotal

      // se não tiver participants, pula
      const me = group.participants && group.participants[0] ? group.participants[0].id : null
      if (me) {
        let myBalance = 0
        groupTx.forEach(tx => {
          if (tx.payer_id === me) myBalance += Number(tx.value) || 0
          const myShare = (tx.splits && tx.splits[me]) ? Number(tx.splits[me]) : 0
          myBalance -= myShare
        })
        totalBalance += myBalance
      }
    })

    return { totalSpent, totalBalance }
  }

  const { totalSpent, totalBalance } = computeTotals()

  // últimos gastos globais (ordenados desc por created_at)
  const latest = transactions
    .slice()
    .sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0
      return tb - ta
    })
    .slice(0, 6)

  async function handleCreateGroup() {
    if (!newName.trim()) return alert('Nome do grupo é obrigatório')
    setCreating(true)
    const participants = newParticipantsText.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ id: crypto.randomUUID(), name }))
    const id = crypto.randomUUID()
    const { error } = await supabase.from('groups').insert({
      id,
      name: newName.trim(),
      category: 'other',
      total_spent: 0,
      balance: 0,
      participants: participants,
      created_at: new Date().toISOString()
    })
    setCreating(false)
    if (error) {
      console.error(error)
      alert('Erro ao criar grupo')
      return
    }
    setShowCreateModal(false)
    setNewName('')
    setNewParticipantsText('Você')
    await loadAll()
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#5BC5A7]">Divide Aí</h1>
          <div className="flex items-center gap-3">
            <Link href="/groups" className="text-gray-700 hover:text-gray-900">Grupos</Link>
            <Link href="/profile">
              <div className="w-10 h-10 bg-[#5BC5A7] rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Totals */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
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

          <p className="text-sm text-gray-500 mt-2">Total gasto geral: R$ {totalSpent.toFixed(2)}</p>
        </div>
      </div>

      {/* Body */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Shortcuts */}
        <div className="flex gap-3 mb-6">
          <button onClick={() => setShowCreateModal(true)} className="flex-1 py-3 rounded-lg bg-[#5BC5A7] text-white font-medium">Criar grupo</button>
          <Link href="/group/create" className="flex-1 py-3 rounded-lg bg-gray-100 text-gray-800 text-center">Adicionar gasto</Link>
        </div>

        {/* Latest transactions */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Últimos gastos</h2>
          {latest.length === 0 ? (
            <p className="text-gray-500">Nenhum gasto adicionado ainda.</p>
          ) : (
            <div className="space-y-3">
              {latest.map(tx => {
                const group = groups.find(g => g.id === tx.group_id)
                const payer = group?.participants?.find(p => p.id === tx.payer_id)?.name || tx.payer_id
                return (
                  <div key={tx.id} className="bg-white p-3 rounded-lg flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-gray-500">Grupo: {group?.name ?? '—'} • Pago por: {payer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">R$ {(Number(tx.value) || 0).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{tx.created_at ? new Date(tx.created_at).toLocaleDateString('pt-BR') : ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Groups preview */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Seus grupos</h2>
          {groups.length === 0 ? (
            <p className="text-gray-500">Nenhum grupo criado.</p>
          ) : (
            <div className="space-y-3">
              {groups.map(group => {
                const groupTx = transactions.filter(tx => tx.group_id === group.id)
                const gTotal = groupTx.reduce((s, tx) => s + (Number(tx.value) || 0), 0)
                const me = group.participants && group.participants[0] ? group.participants[0].id : null
                let myBalance = 0
                if (me) {
                  groupTx.forEach(tx => {
                    if (tx.payer_id === me) myBalance += Number(tx.value) || 0
                    const myShare = (tx.splits && tx.splits[me]) ? Number(tx.splits[me]) : 0
                    myBalance -= myShare
                  })
                }

                return (
                  <Link key={group.id} href={`/group/${group.id}`}>
                    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-800 mb-1">{group.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{group.participants?.length || 0} pessoas</span>
                            <span>•</span>
                            <span>R$ {gTotal.toFixed(2)} gasto</span>
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          {myBalance === 0 ? (
                            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">zerado</span>
                          ) : myBalance > 0 ? (
                            <div className="text-right">
                              <p className="text-xs text-gray-600 mb-1">te devem</p>
                              <p className="text-lg font-semibold text-[#5BC5A7]">R$ {myBalance.toFixed(2)}</p>
                            </div>
                          ) : (
                            <div className="text-right">
                              <p className="text-xs text-gray-600 mb-1">você deve</p>
                              <p className="text-lg font-semibold text-[#FF6B6B]">R$ {Math.abs(myBalance).toFixed(2)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* Floating create button (navbar modal) */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 left-6 w-14 h-14 rounded-full bg-[#5BC5A7] flex items-center justify-center shadow-lg text-white"
        title="Criar grupo"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-[92%] max-w-md">
            <h3 className="text-lg font-semibold mb-3">Criar grupo</h3>

            <label className="text-sm text-gray-600">Nome</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full p-2 border rounded mt-1 mb-3" />

            <label className="text-sm text-gray-600">Participantes (separe por vírgula)</label>
            <input value={newParticipantsText} onChange={(e) => setNewParticipantsText(e.target.value)} className="w-full p-2 border rounded mt-1 mb-4" />

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded">Cancelar</button>
              <button onClick={handleCreateGroup} disabled={creating} className="px-4 py-2 rounded bg-[#5BC5A7] text-white">
                {creating ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

