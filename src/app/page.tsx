"use client";

import Link from "next/link";
import {
  User,
  TrendingUp,
  TrendingDown,
  Users,
  Receipt,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Group {
  id: string;
  name: string;
  participants: any[];
  category?: string;
}

interface Transaction {
  id: string;
  group_id: string;
  value: number;
  description: string;
  created_at: string;
}

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [recentActivity, setRecentActivity] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Carregar grupos
      const { data: groupsData } = await supabase.from("groups").select("*");

      // Carregar transações recentes
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      setGroups(groupsData || []);
      setRecentActivity(txData || []);

      // Calcular saldo total somado de todos os grupos
      let finalBalance = 0;

      if (groupsData?.length) {
        for (const group of groupsData) {
          const { data: t } = await supabase
            .from("transactions")
            .select("*")
            .eq("group_id", group.id);

          if (!t) continue;

          const me = group.participants?.[0]?.id;
          if (!me) continue;

          let balance = 0;

          t.forEach((tx) => {
            if (tx.payer_id === me) balance += tx.value;
            const myPart = tx.splits?.[me] ?? 0;
            balance -= myPart;
          });

          finalBalance += balance;
        }
      }

      setTotalBalance(finalBalance);
      setLoading(false);
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-20">

      {/* HEADER IGUAL À PRINT */}
      <header className="bg-gradient-to-r from-[#7CD7C2] to-[#5BC5A7] text-white py-6 px-6 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-start">

          {/* Avatar + Nome */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
              D
            </div>

            <div>
              <p className="text-sm opacity-90">Bom dia,</p>
              <p className="text-xl font-semibold">Mafra</p>
            </div>
          </div>

          {/* Avatar Perfil */}
          <Link href="/profile">
            <div className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center cursor-pointer">
              <User className="text-white w-6 h-6" />
            </div>
          </Link>
        </div>

        {/* CARD DO SALDO - CENTRALIZADO */}
        <div className="flex justify-center mt-6">
          <div className="bg-white text-gray-800 rounded-xl shadow-md px-6 py-4 w-fit">

            <p className="text-sm text-gray-500">Saldo total</p>

            {totalBalance === 0 ? (
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">R$ 0,00</p>
                <span className="text-sm text-gray-400">zerado</span>
              </div>
            ) : totalBalance > 0 ? (
              <div className="flex items-baseline gap-2 text-[#5BC5A7]">
                <TrendingUp className="w-6 h-6" />
                <p className="text-3xl font-bold">
                  R$ {totalBalance.toFixed(2)}
                </p>
                <span className="text-sm">te devem</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2 text-[#FF6B6B]">
                <TrendingDown className="w-6 h-6" />
                <p className="text-3xl font-bold">
                  R$ {Math.abs(totalBalance).toFixed(2)}
                </p>
                <span className="text-sm">você deve</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-10">

        {/* GRUPOS RECENTES */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Grupos recentes</h2>
          <Link href="/groups" className="text-sm text-[#5BC5A7] font-medium">
            Ver todos
          </Link>
        </div>

        <div className="flex gap-4">
          {groups.slice(0, 3).map((group) => (
            <Link
              key={group.id}
              href={`/group/${group.id}`}
              className="block bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-all w-64"
            >
              <p className="font-medium text-gray-800">{group.name}</p>
              <p className="text-sm text-gray-500">{group.participants.length} pessoas</p>

              <p className="mt-2 text-sm text-gray-400">R$ 0,00</p>
              <p className="text-sm text-gray-400">zerado</p>

              {/* bolinhas dos participantes */}
              <div className="flex gap-2 mt-3">
                {group.participants.map((p: any) => (
                  <div
                    key={p.id}
                    className="w-8 h-8 bg-[#5BC5A7] text-white rounded-full flex items-center justify-center"
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* ATIVIDADES RECENTES */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Atividades recentes</h2>
          <span className="text-sm text-gray-500 cursor-pointer">Filtrar</span>
        </div>

        <div className="space-y-3">
          {recentActivity.map((tx) => (
            <div
              key={tx.id}
              className="bg-white p-4 rounded-xl shadow-sm border flex gap-4 items-center"
            >
              <div className="w-10 h-10 bg-[#5BC5A7]/20 text-[#5BC5A7] rounded-full flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>

              <div>
                <p className="text-gray-700">
                  Você pagou <strong>R$ {tx.value.toFixed(2)}</strong>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(tx.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
