'use client'

import { ArrowLeft, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Participant {
  id: string
  name: string
  email?: string
}

interface Group {
  id: string
  name: string
  category: string
  participants: Participant[]
}

export default function GroupSettings() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)

  // ================================
  // Carrega grupo do SUPABASE
  // ================================
  useEffect(() => {
    async function loadGroup() {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (error) {
        console.error(error)
        return
      }

      setGroup(data)
      setLoading(false)
    }

    loadGroup()
  }, [groupId])


  async function deleteGroup() {
    if (!confirm('Tem certeza que deseja apagar este grupo e todos os gastos?')) {
      return
    }

    // Apagar transações do grupo
    await supabase
      .from('transactions')
      .delete()
      .eq('groupid', groupId)

    // Apagar o grupo
    await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)

    alert('Grupo apagado com sucesso!')
    router.push('/')
  }

  if (loading || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    )
  }

  const categories = {
    apartment: { label: 'Apartamento', icon: '🏢' },
    house: { label: 'Casa', icon: '🏠' },
    trip: { label: 'Viagem', icon: '✈️' },
    other: { label: 'Outro', icon: '📋' },
  }

  const currentCategory = categories[group.category as keyof typeof categories] || categories.other

  return (
    <div className="min-h-screen bg-[#F7F7F7]">

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href={`/group/${groupId}`}>
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">Configurações</h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Grupo */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-600">Nome do grupo</p>
          <p className="text-lg font-semibold text-gray-800">{group.name}</p>

          <div className="mt-4">
            <p className="text-sm text-gray-600">Categoria</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl">{currentCategory.icon}</span>
              <span className="text-gray-800">{currentCategory.label}</span>
            </div>
          </div>
        </div>

        {/* Participantes */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" />
            Participantes ({group.participants.length})
          </p>

          <div className="space-y-2">
            {group.participants.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-[#5BC5A7] flex items-center justify-center rounded-full">
                  <span className="text-white font-semibold">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.name}</p>
                  {p.email && <p className="text-xs text-gray-500">{p.email}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zona de Perigo */}
        <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-red-200">
          <p className="text-sm font-medium text-red-600 mb-3">Zona de perigo</p>

          <button
            onClick={deleteGroup}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-300"
          >
            <Trash2 className="w-5 h-5" />
            Apagar grupo
          </button>

          <p className="text-xs text-gray-500 text-center mt-2">
            Esta ação não pode ser desfeita.
          </p>
        </div>

      </main>
    </div>
  )
}

