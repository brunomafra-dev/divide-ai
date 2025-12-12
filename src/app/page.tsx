"use client";

import { TrendingUp, TrendingDown, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Group {
  id: string;
  name: string;
  participants: any[];
  total_spent: number;
  balance: number;
}

interface Activity {
  id: string;
  group_id: string;
  description: string;
  value: number;
  created_at: string;
  group_name: string;
}

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------
  // 1) Carrega grupos com valores atualizados
  // ----------------------------------------------
  useEffect(() => {
    async function load() {
      const { data: groupsData } = await supabase
        .from("groups")
        .select("*");

      const { data: tx } = await supabase
        .from("transactions")
        .select("*");

      if (!groupsData) return;

      // Recalcula total_spent e balance de cada grupo
      const updatedGroups = groupsData.map(group => {
        const groupTx = tx?.filter(t => t.group_id === group.id) || [];

        const totalSpent = groupTx.reduce((sum, t) => sum + t.value, 0);

        const me = group.participants?.[0]?.id || "self";

        let balance = 0;
        groupTx.forEach(t => {
          if (t.payer_id === me) balance += t.value;
          const myShare = t.splits?.[me] ?? 0;
          balance -= myShare;
        });

        return {
          ...group,
          total_spent: totalSpent,
          balance: balance,
        };
      });

      setGroups(updatedGroups);

      // Saldo total geral
      const total = updatedGroups.reduce((acc, g) => acc + g.balance, 0);
      setTotalBalance(total);

      // Atividades recentes (últimos 10)
      const activities = tx
        ?.map(t => ({
          ...t,
          group_name: updatedGroups.find(g => g.id === t.group_id)?.name || "",
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setRecentActivities(activities || []);
      setLoading(false);
    }

    load();
  }, []);

  // ----------------------------------------------
  // 2) Render
  // ----------------------------------------------

  return (
    <div className="min-h-screen bg-[#F7F7F7]">

      {/* HEADER BONITO */}
      <header className="bg-gradient-to-r from-[#5BC5A7] to-[#4AB396] text-white py-6 px-6 shadow-md">
        <div className="max-w-4xl mx-auto">

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
              M
            </div>

            <div>
              <p className="text-sm opacity-90">Bem-vindo,</p>
              <p className="text-xl font-semibold">Mafra</p>
            </div>
          </div>

          {/* SALDO TOTAL CENTRALIZADO */}
          <div className="mt-6 text-center">
            <p className="text-sm opacity-90">Saldo total</p>

            {totalBalance === 0 ? (
              <p className="text-3xl font-bold">R$ 0,00</p>
            ) : totalBalance > 0 ? (
              <p className="text-3xl font-bold flex justify-center items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                R$ {totalBalance.toFixed(2)}
              </p>
            ) : (
              <p className="text-3xl font-bold flex justify-center items-center gap-2">
                <TrendingDown className="w-6 h-6" />
                R$ {Math.abs(totalBalance).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="max-w-4xl mx-auto px-6 py-6 space-y-10">

        {/* --- GRUPOS RECENTES --- */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-gray-800">Grupos recentes</h2>
            <Link href="/groups" className="text-sm text-gray-500 hover:underline">
              Ver todos
            </Link>
          </div>

          <div className="space-y-3">
            {groups.map(g => (
              <Link key={g.id} href={`/group/${g.id}`}>
                <div className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition cursor-pointer flex justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">{g.name}</h3>
                    <p className="text-sm text-gray-500">{g.participants.length} pessoas</p>
                  </div>

                  <div className="text-right">
                    {g.balance === 0 ? (
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">zerado</span>
                    ) : g.balance > 0 ? (
                      <p className="text-[#5BC5A7] font-semibold">
                        + R$ {g.balance.toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-[#FF6B6B] font-semibold">
                        - R$ {Math.abs(g.balance).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* --- ATIVIDADES RECENTES --- */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Atividades recentes</h2>

          <div className="space-y-3">
            {recentActivities.map(a => (
              <div key={a.id} className="bg-white rounded-xl p-4 shadow-sm border">
                <p className="font-medium">
                  Você pagou <strong>R$ {a.value.toFixed(2)}</strong> em {a.group_name}
                </p>
                <p className="text-sm text-gray-500">
                  {a.description} • {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
