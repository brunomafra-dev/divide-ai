'use client'

import { ArrowLeft, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Participant {
  id: string
  name: string
  email?: string
}

export default function CreateGroup() {
  const router = useRouter()

  const [groupName, setGroupName] = useState('')
  const [category, setCategory] = useState<'apartment' | 'house' | 'trip' | 'other'>('other')
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'Você', email: '' }
  ])

  const [newParticipantName, setNewParticipantName] = useState('')
  const [newParticipantEmail, setNewParticipantEmail] = useState('')

  const [loading, setLoading] = useState(false)

  const categories = [
    { id: 'apartment', label: 'Apartamento', icon: '🏢' },
    { id: 'house', label: 'Casa', icon: '🏠' },
    { id: 'trip', label: 'Viagem', icon: '✈️' },
    { id: 'other', label: 'Outro', icon: '📋' },
  ]

  const addParticipant = () => {
    if (!newParticipantName.trim()) return

    const newP: Participant = {
      id: Date.now().toString(),
      name: newParticipantName.trim(),
      email: newParticipantEmail.trim() || undefined
    }

    setParticipants([...participants, newP])
    setNewParticipantName('')
    setNewParticipantEmail('')
  }

  const removeParticipant = (id: string) => {
    if (id === '1') return
    setParticipants(participants.filter(p => p.id !== id))
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert("⚠️ O grupo precisa de um nome")
      return
    }

    if (participants.length < 2) {
      alert("⚠️ O grupo precisa de pelo menos 2 participantes")
      return
    }

    setLoading(true)

    const groupId = crypto.randomUUID()

    const { error } = await supabase.from("groups").insert({
      id: groupId,
      name: groupName,
      category: category,
      total_spent: 0,
      balance: 0,
      participants: participants, // JSONB
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error(error)
      alert("Erro ao criar grupo!")
      setLoading(false)
      return
    }

    router.push(`/group/${groupId}`)
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <button className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">Criar grupo</h1>

          <button
            onClick={handleCreateGroup}
            disabled={loading}
            className="text-[#5BC5A7] font-medium hover:text-[#4AB396]"
          >
            {loading ? "Criando..." : "Criar"}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Nome do Grupo */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do grupo
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Ex: Viagem de Férias"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5BC5A7] focus:outline-none"
          />
        </div>

        {/* Categoria */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Categoria
          </label>
          <div className="grid grid-cols-4 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as any)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  category === cat.id
                    ? "border-[#5BC5A7] bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-gray-700">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Participantes */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Participantes ({participants.length})
          </label>

          <div className="space-y-2 mb-4">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#5BC5A7] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">{p.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    {p.email && <p className="text-xs text-gray-500">{p.email}</p>}
                  </div>
                </div>

                {p.id !== "1" && (
                  <button onClick={() => removeParticipant(p.id)} className="text-gray-400 hover:text-red-500">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add participant */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <input
              type="text"
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
              placeholder="Nome do participante"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5BC5A7]"
            />

            <input
              type="email"
              value={newParticipantEmail}
              onChange={(e) => setNewParticipantEmail(e.target.value)}
              placeholder="Email (opcional)"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5BC5A7]"
            />

            <button
              onClick={addParticipant}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#5BC5A7] text-white rounded-lg hover:bg-[#4AB396]"
            >
              <Plus className="w-4 h-4" />
              Adicionar participante
            </button>
          </div>
        </div>

        <button
          onClick={handleCreateGroup}
          disabled={loading}
          className="w-full py-4 bg-[#5BC5A7] text-white rounded-xl font-medium hover:bg-[#4AB396]"
        >
          {loading ? "Criando grupo..." : "Criar grupo"}
        </button>
      </main>
    </div>
  )
}

