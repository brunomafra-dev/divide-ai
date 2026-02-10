'use client'

import { ArrowLeft, Clock, DollarSign, Users } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/ui/bottom-nav'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Activity {
  id: string
  type: 'expense' | 'group' | 'member'
  description: string
  group: string
  date: string
  timestamp: number
}

export default function Activity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const activitiesData: Activity[] = []

      // Buscar grupos do usuário
      const { data: userGroups } = await supabase
        .from('group_members')
        .select('group_id, joined_at')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(10)

      if (userGroups) {
        const groupIds = userGroups.map(g => g.group_id)

        // Buscar nomes dos grupos
        const { data: groups } = await supabase
          .from('groups')
          .select('id, name, created_at')
          .in('id', groupIds)

        // Adicionar atividades de entrada em grupos
        for (const userGroup of userGroups) {
          const group = groups?.find(g => g.id === userGroup.group_id)
          if (group) {
            const joinDate = new Date(userGroup.joined_at)
            activitiesData.push({
              id: `group-${userGroup.group_id}`,
              type: 'group',
              description: `Você entrou no grupo`,
              group: group.name,
              date: getRelativeTime(joinDate),
              timestamp: joinDate.getTime()
            })
          }
        }

        // Buscar despesas recentes dos grupos
        const { data: recentExpenses } = await supabase
          .from('expenses')
          .select(`
            id,
            description,
            amount,
            payer_id,
            date,
            group_id,
            groups (name)
          `)
          .in('group_id', groupIds)
          .order('date', { ascending: false })
          .limit(20)

        if (recentExpenses) {
          for (const expense of recentExpenses) {
            // Buscar nome do pagador
            const { data: payer } = await supabase
              .from('group_members')
              .select('name, user_id')
              .eq('id', expense.payer_id)
              .single()

            const expenseDate = new Date(expense.date)
            const isPayer = payer?.user_id === user.id

            activitiesData.push({
              id: `expense-${expense.id}`,
              type: 'expense',
              description: `${isPayer ? 'Você pagou' : (payer?.name || 'Alguém') + ' pagou'} R$ ${Number(expense.amount).toFixed(2)}`,
              group: (expense.groups as any)?.name || 'Grupo',
              date: getRelativeTime(expenseDate),
              timestamp: expenseDate.getTime()
            })
          }
        }

        // Buscar novos membros nos grupos
        const { data: newMembers } = await supabase
          .from('group_members')
          .select(`
            id,
            name,
            joined_at,
            group_id,
            user_id,
            groups (name)
          `)
          .in('group_id', groupIds)
          .neq('user_id', user.id)
          .order('joined_at', { ascending: false })
          .limit(10)

        if (newMembers) {
          for (const member of newMembers) {
            const memberDate = new Date(member.joined_at)
            activitiesData.push({
              id: `member-${member.id}`,
              type: 'member',
              description: `${member.name} entrou no grupo`,
              group: (member.groups as any)?.name || 'Grupo',
              date: getRelativeTime(memberDate),
              timestamp: memberDate.getTime()
            })
          }
        }
      }

      // Ordenar por data mais recente
      activitiesData.sort((a, b) => b.timestamp - a.timestamp)

      // Limitar a 30 atividades
      setActivities(activitiesData.slice(0, 30))
    } catch (error) {
      console.error('Erro ao carregar atividades:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRelativeTime = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'agora'
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} atrás`
    if (hours < 24) return `${hours} ${hours === 1 ? 'hora' : 'horas'} atrás`
    if (days < 7) return `${days} ${days === 1 ? 'dia' : 'dias'} atrás`
    if (days < 30) return `${Math.floor(days / 7)} ${Math.floor(days / 7) === 1 ? 'semana' : 'semanas'} atrás`
    return date.toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <button className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold text-gray-800">Atividade</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhuma atividade</h3>
            <p className="text-gray-600">Suas atividades recentes aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'expense' ? 'bg-[#5BC5A7]/10' :
                    activity.type === 'group' ? 'bg-blue-50' :
                    'bg-purple-50'
                  }`}>
                    {activity.type === 'expense' ? (
                      <DollarSign className="w-5 h-5 text-[#5BC5A7]" />
                    ) : activity.type === 'group' ? (
                      <Users className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Users className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{activity.description}</p>
                    <p className="text-xs text-gray-600 mt-1">{activity.group}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Ad Space Placeholder */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-gray-100 rounded-xl p-4 text-center border-2 border-dashed border-gray-300">
          <p className="text-xs text-gray-500">Espaço reservado para anúncio</p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
