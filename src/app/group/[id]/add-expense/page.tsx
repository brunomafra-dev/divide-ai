'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'

interface Participant {
  id: string
  name: string
  email?: string
}

interface Group {
  id: string
  name: string
  participants: Participant[]
  total_spent: number
  balance: number
}

export default function AddExpense() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [payerId, setPayerId] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // -------------------------------------------
  // 🔥 CARREGAR GRUPO DO SUPABASE
  // -------------------------------------------
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
      setPayerId(data.participants[0]?.id)
      setSelectedParticipants(data.participants.map((p: Participant) => p.id))
    }

    loadGroup()
  }, [groupId])

  // -------------------------------------------
  // 🔥 SELECIONAR PARTICIPANTE
  // -------------------------------------------
  const toggleParticipant = (id: string) => {
    if (selectedParticipants.includes(id)) {
      setSelectedParticipants(selectedParticipants.filter(i => i !== id))
    } else {
      setSelectedParticipants([...selectedParticipants, id])
    }
  }

  // -------------------------------------------
  // 🔥 SALVAR GASTO
  // -------------------------------------------
  const handleSave = async () => {
    if (!amount || !description || !payerId) {
      alert("Preencha todos os campos")
      return
    }

    setLoading(true)

    const value = Number(amount)
    const payer = group?.participants.find(p => p.id === payerId)

    // SALVAR TRANSAÇÃO
    const { error: tError } = await supabase.from("transactions").insert({
      id: crypto.randomUUID(),
      groupid: groupId,
      value,
      description,
      payerid: payerId,
      participants: selectedParticipants,
      splits: {}, // por agora vazio, pronto para modo manual depois
    })

    if (tError) {
      console.error(tError)
      alert("Erro ao adicionar gasto")
      setLoading(false)
      return
    }

    // ATUALIZAR TOTAL DO GRUPO
    const newTotal = (group?.total_spent || 0) + value

    const { error: gError } = await supabase
      .from("groups")
      .update({
        total_spent: newTotal
      })
      .eq("id", groupId)

    if (gError) {
      console.error(gError)
    }

    router.push(`/group/${groupId}`)
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-20">
      {/* HEADER */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href={`/group/${groupId}`}>
            <button className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">Adicionar gasto</h1>
          <button
            onClick={handleSave}
            disabled={loading}
            className="text-[#5BC5A7] font-medium hover:text-[#4AB396]"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* VALOR */}
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <label className="block text-sm text-gray-600 mb-2">Valor</label>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-bold">R$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              step="0.01"
              className="text-3xl font-bold w-40 text-center border-b-2 border-[#5BC5A7] focus:outline-none"
            />
          </div>
        </div>

        {/* DESCRIÇÃO */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm text-gray-700 mb-2">Descrição</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Mercado, Uber, Pizza..."
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#5BC5A7]"
          />
        </div>

        {/* QUEM PAGOU */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm text-gray-700 mb-3">Quem pagou?</label>
          <div className="space-y-2">
            {group.participants.map((p) => (
              <button
                key={p.id}
                onClick={() => setPayerId(p.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 ${
                  payerId === p.id ? "border-[#5BC5A7] bg-green-50" : "border-gray-200"
                }`}
              >
                <div className="w-10 h-10 bg-[#5BC5A7] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{p.name[0]}</span>
                </div>
                <p className="text-sm font-medium">{p.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* PARTICIPANTES ENVOLVIDOS */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm text-gray-700 mb-3">
            Quem participou ({selectedParticipants.length})
          </label>

          <div className="space-y-2">
            {group.participants.map((p) => {
              const selected = selectedParticipants.includes(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => toggleParticipant(p.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 ${
                    selected ? "border-[#5BC5A7] bg-green-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selected ? "bg-[#5BC5A7]" : "bg-gray-300"
                    }`}>
                      <span className="text-white font-bold">{p.name[0]}</span>
                    </div>
                    <p className="text-sm font-medium">{p.name}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* SALVAR */}
        <button
          onClick={handleSave}
          className="w-full py-4 bg-[#5BC5A7] text-white rounded-xl font-medium hover:bg-[#4AB396]"
        >
          Salvar gasto
        </button>
      </main>
    </div>
  )
}
