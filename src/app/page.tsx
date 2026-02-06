'use client'

import { Plus, User, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/ui/bottom-nav'

interface Member {
  id: string
  name: string
  avatar?: string
}

interface Group {
  id: string
  name: string
  totalSpent: number
  balance: number
  participants: number
  members?: Member[]
}

export default function Home() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão ao carregar a página
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.replace('/login')
        return
      }

      setLoading(false)
    }

    checkSession()
  }, [router])

  useEffect(() => {
    if (loading) return

    // Carregar grupos do localStorage
    const savedGroups = localStorage.getItem('divideai_groups')
    if (savedGroups) {
      const parsedGroups = JSON.parse(savedGroups)
      setGroups(parsedGroups)
      
      // Calcular saldo total
      const total = parsedGroups.reduce((acc: number, group: Group) => acc + group.balance, 0)
      setTotalBalance(total)
    } else {
      // Dados de exemplo com membros
      const mockGroups = [
        {
          id: '1',
          name: 'Viagem para Praia',
          totalSpent: 1200,
          balance: -150,
          participants: 4,
          members: [
            { id: '1', name: 'João Silva' },
            { id: '2', name: 'Maria Santos' },
            { id: '3', name: 'Pedro Costa' },
            { id: '4', name: 'Ana Lima' },
          ],
        },
        {
          id: '2',
          name: 'Casa dos Pais',
          totalSpent: 800,
          balance: 200,
          participants: 3,
          members: [
            { id: '1', name: 'Carlos Mendes' },
            { id: '2', name: 'Beatriz Souza' },
            { id: '3', name: 'Rafael Alves' },
          ],
        },
        {
          id: '3',
          name: 'Churrasco Domingo',
          totalSpent: 300,
          balance: 0,
          participants: 5,
          members: [
            { id: '1', name: 'Lucas Ferreira' },
            { id: '2', name: 'Juliana Rocha' },
            { id: '3', name: 'Thiago Martins' },
            { id: '4', name: 'Camila Dias' },
            { id: '5', name: 'Felipe Gomes' },
          ],
        },
      ]
      setGroups(mockGroups)
      localStorage.setItem('divideai_groups', JSON.stringify(mockGroups))
      
      const total = mockGroups.reduce((acc, group) => acc + group.balance, 0)
      setTotalBalance(total)
    }
  }, [loading])

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0]
    }
    return name.substring(0, 2)
  }

  const renderMemberAvatars = (members?: Member[], maxDisplay: number = 4) => {
    if (!members || members.length === 0) return null

    const displayMembers = members.slice(0, maxDisplay)
    const remaining = members.length - maxDisplay

    return (
      <div className="flex items-center -space-x-2">
        {displayMembers.map((member, index) => (
          <div
            key={member.id}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5BC5A7] to-[#4AB396] flex items-center justify-center text-white text-xs font-medium border-2 border-white"
            style={{ zIndex: displayMembers.length - index }}
          >
            {member.avatar ? (
              <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(member.name)
            )}
          </div>
        ))}
        {remaining > 0 && (
          <div
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white"
            style={{ zIndex: 0 }}
          >
            +{remaining}
          </div>
        )}
      </div>
    )
  }

  // Mostrar loading enquanto verifica sessão
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-gray-600 text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-20">
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

      {/* Ad Space Placeholder */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="bg-gray-100 rounded-lg p-3 text-center border-2 border-dashed border-gray-300">
            <p className="text-xs text-gray-500">Espaço reservado para anúncio</p>
          </div>
        </div>
      </div>

      {/* Groups List */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {groups.length === 0 ? (
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
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-800 mb-1">{group.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{group.participants} {group.participants === 1 ? 'pessoa' : 'pessoas'}</span>
                          <span>•</span>
                          <span>R$ {group.totalSpent.toFixed(2)} gasto</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        {group.balance === 0 ? (
                          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">zerado</span>
                        ) : group.balance > 0 ? (
                          <div className="text-right">
                            <p className="text-xs text-gray-600 mb-1">te devem</p>
                            <p className="text-lg font-semibold text-[#5BC5A7]">R$ {group.balance.toFixed(2)}</p>
                          </div>
                        ) : (
                          <div className="text-right">
                            <p className="text-xs text-gray-600 mb-1">você deve</p>
                            <p className="text-lg font-semibold text-[#FF6B6B]">R$ {Math.abs(group.balance).toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Prévia de Membros */}
                    <div className="pt-3 border-t border-gray-100">
                      {renderMemberAvatars(group.members)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Floating Action Button */}
      <Link href="/create-group">
        <button className="fixed bottom-20 right-6 w-16 h-16 bg-[#5BC5A7] rounded-full flex items-center justify-center shadow-lg hover:bg-[#4AB396] transition-all hover:scale-110">
          <Plus className="w-8 h-8 text-white" />
        </button>
      </Link>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
