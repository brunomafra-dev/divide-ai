'use client'

import { ArrowRightLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

interface Payment {
  id: string
  group_id: string
  from_user: string
  to_user: string
  amount: number
  created_at: string
}

interface Group {
  id: string
  name: string
  participants: {
    id: string
    name: string
  }[]
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [myId, setMyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser()
      if (!user) return

      setMyId(user.id)

      const { data: g } = await supabase.from('groups').select('*')
      const { data: p } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })

      setGroups(g || [])
      setPayments(p || [])
      setLoading(false)
    }

    load()
  }, [])

  if (loading || !myId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] px-6 py-6 max-w-4xl mx-auto">

      <h1 className="text-xl font-semibold text-gray-800 mb-6">
        Pagamentos
      </h1>

      {payments.length === 0 && (
        <p className="text-gray-500">
          Nenhum pagamento registrado ainda.
        </p>
      )}

      <div className="space-y-3">
        {payments.map(p => {
          const group = groups.find(g => g.id === p.group_id)
          const from =
            group?.participants.find(u => u.id === p.from_user)?.name ||
            'Alguém'
          const to =
            group?.participants.find(u => u.id === p.to_user)?.name ||
            'Alguém'

          const isMePaying = p.from_user === myId

          return (
            <div
              key={p.id}
              className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {isMePaying ? 'Você' : from} pagou {isMePaying ? to : 'você'}
                </p>
                <p className="text-sm text-gray-500">
                  Grupo: {group?.name}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(p.created_at).toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-semibold text-[#5BC5A7]">
                  R$ {p.amount.toFixed(2)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Botão flutuante */}
      <button
        className="fixed bottom-24 right-6 w-16 h-16 bg-[#5BC5A7] rounded-full flex items-center justify-center shadow-lg"
      >
        <ArrowRightLeft className="w-7 h-7 text-white" />
      </button>
    </div>
  )
}

