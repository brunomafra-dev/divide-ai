'use client'

import { ArrowLeft } from 'lucide-react'
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
  participantsList: Participant[]
}

export default function AddExpense() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [value, setValue] = useState('')
  const [description, setDescription] = useState('')
  const [payerId, setPayerId] = useState('')
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal')
  const [weights, setWeights] = useState<Record<string, number>>({})
  const [calculatedSplits, setCalculatedSplits] = useState<Record<string, number>>({})

  useEffect(() => {
    async function loadGroup() {
      const { data } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (data) {
        setGroup(data)

        const defaultWeights: Record<string, number> = {}
        data.participantsList.forEach(p => (defaultWeights[p.id] = 1))

        setWeights(defaultWeights)
        setPayerId(data.participantsList[0]?.id || '')
      }
    }

    loadGroup()
  }, [groupId])

  function calculateCustomSplits() {
    const total = parseFloat(value)
    if (!total || total <= 0 || !group) return {}

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)

    const result: Record<string, number> = {}
    group.participantsList.forEach(p => {
      const w = weights[p.id]
      result[p.id] = parseFloat(((total * w) / totalWeight).toFixed(2))
    })

    setCalculatedSplits(result)
    return result
  }

  async function handleSave() {
    if (!value || !description || !payerId) {
      alert('Preencha todos os campos')
      return
    }

    let splitsToSave: Record<string, number> = {}

    if (splitType === 'equal') {
      const equalValue = parseFloat(value) / (group!.participantsList.length)
      group?.participantsList.forEach(p => {
        splitsToSave[p.id] = parseFloat(equalValue.toFixed(2))
      })
    } else {
      splitsToSave = calculateCustomSplits()
    }

    const newTransaction = {
      id: crypto.randomUUID(),
      groupid: groupId,
      value: parseFloat(value),
      description,
      payerid: payerId,
      participants: group!.participantsList.map(p => p.id),
      splits: splitsToSave,
      created_at: new Date().toISOString()
    }

    const { error } = await supabase.from('transactions').insert(newTransaction)

    if (error) {
      console.error(error)
      alert("Erro ao salvar gasto!")
      return
    }

    router.push(`/group/${groupId}`)
  }

  if (!group) return <p>Carregando...</p>

  return (
    <div className="min-h-screen bg-[#F7F7F7]">

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href={`/group/${groupId}`}>
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">Adicionar gasto</h1>
          <button 
            onClick={handleSave}
            className="text-[#5BC5A7] font-medium"
          >
            Salvar
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Valor */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <label className="text-gray-600 font-medium">Valor</label>
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="text-3xl w-full text-center border-b mt-2"
            placeholder="0,00"
          />
        </div>

        {/* Descrição */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <label className="block font-medium text-gray-600">Descrição</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Churrasco, Mercado..."
            className="w-full px-4 py-2 border mt-2 rounded-lg"
          />
        </div>

        {/* Quem pagou */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <label className="font-medium text-gray-600">Quem pagou?</label>

          {group.participantsList.map(p => (
            <button 
              key={p.id}
              onClick={() => setPayerId(p.id)}
              className={`w-full text-left p-3 border rounded-lg mt-2 ${
                payerId === p.id ? "border-[#5BC5A7] bg-green-50" : ""
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Tipo de divisão */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <label className="font-medium text-gray-600">Como dividir?</label>

          <div className="flex gap-3 mt-3">
            <button 
              onClick={() => setSplitType("equal")}
              className={`flex-1 p-2 rounded-lg ${
                splitType === "equal" ? "bg-[#5BC5A7] text-white" : "bg-gray-200"
              }`}
            >
              Igual
            </button>

            <button 
              onClick={() => setSplitType("custom")}
              className={`flex-1 p-2 rounded-lg ${
                splitType === "custom" ? "bg-[#5BC5A7] text-white" : "bg-gray-200"
              }`}
            >
              Personalizada
            </button>
          </div>

          {splitType === "custom" && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-600">Defina o peso de cada pessoa:</p>

              {group.participantsList.map(p => (
                <div key={p.id} className="flex justify-between items-center border p-2 rounded-lg">
                  <span>{p.name}</span>
                  <input 
                    type="number"
                    min={0}
                    value={weights[p.id]}
                    onChange={(e) => setWeights({ ...weights, [p.id]: Number(e.target.value) })}
                    className="w-20 border rounded p-1 text-center"
                  />
                </div>
              ))}

              <button 
                onClick={calculateCustomSplits}
                className="mt-3 bg-[#5BC5A7] text-white px-4 py-2 rounded-lg"
              >
                Calcular divisão
              </button>

              {Object.keys(calculatedSplits).length > 0 && (
                <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                  {group.participantsList.map(p => (
                    <p key={p.id}>
                      <strong>{p.name}:</strong> R$ {calculatedSplits[p.id]?.toFixed(2)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </main>
    </div>
  )
}
