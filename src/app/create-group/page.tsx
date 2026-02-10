'use client'

import { ArrowLeft, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Participant {
  id: string
  name: string
  email?: string
}

export default function CreateGroup() {
  const router = useRouter()
  const [groupName, setGroupName] = useState('')
  const [category, setCategory] = useState<'apartment' | 'house' | 'trip' | 'other'>('other')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [newParticipantName, setNewParticipantName] = useState('')
  const [newParticipantEmail, setNewParticipantEmail] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        // Adicionar o usuário atual como primeiro participante
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        setParticipants([{
          id: user.id,
          name: profile?.full_name || user.email || 'Você',
          email: user.email
        }])
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  const categories = [
    { id: 'apartment', label: 'Apartamento', icon: '🏢' },
    { id: 'house', label: 'Casa', icon: '🏠' },
    { id: 'trip', label: 'Viagem', icon: '✈️' },
    { id: 'other', label: 'Outro', icon: '📋' },
  ]

  const addParticipant = () => {
    if (newParticipantName.trim()) {
      const newParticipant: Participant = {
        id: Date.now().toString(),
        name: newParticipantName.trim(),
        email: newParticipantEmail.trim() || undefined,
      }
      setParticipants([...participants, newParticipant])
      setNewParticipantName('')
      setNewParticipantEmail('')
    }
  }

  const removeParticipant = (id: string) => {
    if (id === currentUser?.id) return // Não pode remover o usuário atual
    setParticipants(participants.filter(p => p.id !== id))
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || participants.length < 2) {
      alert('Adicione um nome e pelo menos 2 participantes')
      return
    }

    if (!currentUser) {
      alert('Você precisa estar logado')
      return
    }

    try {
      // Criar grupo no Supabase
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName,
          category,
          created_by: currentUser.id
        })
        .select()
        .single()

      if (groupError) throw groupError

      // Adicionar membros ao grupo
      const membersToInsert = participants.map(p => ({
        group_id: group.id,
        user_id: p.id === currentUser.id ? currentUser.id : null,
        name: p.name,
        email: p.email,
        is_registered: p.id === currentUser.id
      }))

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(membersToInsert)

      if (membersError) throw membersError

      router.push(`/group/${group.id}`)
    } catch (error: any) {
      console.error('Erro ao criar grupo:', error)
      alert('Erro ao criar grupo: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
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
            className="text-[#5BC5A7] font-medium hover:text-[#4AB396]"
          >
            Criar
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
            placeholder="Ex: Viagem para Praia"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5BC5A7] focus:border-transparent"
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
                    ? 'border-[#5BC5A7] bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
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
          
          {/* Lista de Participantes */}
          <div className="space-y-2 mb-4">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#5BC5A7] rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {participant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{participant.name}</p>
                    {participant.email && (
                      <p className="text-xs text-gray-500">{participant.email}</p>
                    )}
                  </div>
                </div>
                {participant.id !== currentUser?.id && (
                  <button
                    onClick={() => removeParticipant(participant.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Adicionar Participante */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <input
              type="text"
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
              placeholder="Nome do participante"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5BC5A7] focus:border-transparent text-sm"
            />
            <input
              type="email"
              value={newParticipantEmail}
              onChange={(e) => setNewParticipantEmail(e.target.value)}
              placeholder="Email (opcional)"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5BC5A7] focus:border-transparent text-sm"
            />
            <button
              onClick={addParticipant}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#5BC5A7] text-white rounded-lg hover:bg-[#4AB396] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Adicionar participante</span>
            </button>
          </div>
        </div>

        {/* Botão Criar */}
        <button
          onClick={handleCreateGroup}
          className="w-full py-4 bg-[#5BC5A7] text-white rounded-xl font-medium hover:bg-[#4AB396] transition-colors shadow-sm"
        >
          Criar grupo
        </button>
      </main>
    </div>
  )
}
