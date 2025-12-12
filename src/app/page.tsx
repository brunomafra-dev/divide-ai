"use client";

import { TrendingUp, TrendingDown, Plus, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Group {
  id: string;
  name: string;
  participants: any[];
}

interface Transaction {
  id: string;
  value: number;
  payer_id: string;
  group_id: string;
  description: string;
  splits: Record<string, number>;
  created_at: string;
}

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Carrega grupos
      const { data: g } = await supabase.from("groups").select("*");
      setGroups(g || []);

      // Carrega transações
      const { data: t } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      const tx = t || [];
      setTransactions(tx);

      // Recentes (últimos 5)
      setRecentExpenses(tx.slice(0, 5));

      // Cálculo de saldo global (considera VOCÊ como participante[0])
      let balance = 0;

      g?.forEach(group => {
        const me = group.participants[0]?.id;
        if (!me) return;

        tx.forEach(tr => {
          if (tr.group_id !== group.id) return;

          if (tr.payer_id === me) balance += tr.value;
          balance -= tr.splits[me] ?? 0;
        });
      });

      setTotalBalance(balance);

      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-24">

      {/* HEADER */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#5BC5A7]">Divide Aí</h1>
          <Link href="/profile">
            <div className="w-10 h-10 bg-[#5BC5A7] rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </Link>
        </div>
      </header>

      {/* SALDO TOTAL */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-500 mb-1">Saldo geral</p>

          {totalBalance === 0 ? (
            <p className="text-3xl font-bold text-gray-800">R$ 0,00</p>
          ) : totalBalance > 0 ? (
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#5BC5A7]" />
              <p className="text-3xl font-bold text-[#5BC5A7]">
                R$ {totalBalance.toFixed(2)}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <TrendingDown className="w-6 h-6 text-[#FF6B6B]" />
              <p className="text-3xl font-bold text-[#FF6B6B]">
                R$ {Math.abs(totalBalance).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ÚLTIMOS GASTOS */}
      <main className="max-w-4xl mx-auto px-4 py-6">

        <h2 className="text-lg font-semibold text-gray-800 mb-3">Últimos gastos</h2>

        {recentExpenses.length === 0 ? (
          <p className="text-gray-600 text-sm">Nenhum gasto registrado ainda.</p>
        ) : (
          <div className="space-y-3">
            {recentExpenses.map(tx => {
              const group = groups.find(g => g.id === tx.group_id);

              return (
                <Link key={tx.id} href={`/group/${tx.group_id}`}>
                  <div className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition cursor-pointer">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-gray-800">{tx.description}</p>
                      <p className="font-semibold">R$ {tx.value.toFixed(2)}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Grupo: {group?.name || "grupo removido"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* BOTÃO FLUTUANTE */}
        <Link href="/create-group">
          <button className="fixed bottom-20 right-6 w-16 h-16 bg-[#5BC5A7] rounded-full flex items-center justify-center shadow-lg">
            <Plus className="text-white w-8 h-8" />
          </button>
        </Link>

      </main>
    </div>
  );
}
