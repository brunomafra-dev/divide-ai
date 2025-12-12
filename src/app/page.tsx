"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User, TrendingUp, TrendingDown } from "lucide-react";

interface Participant {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  participants: Participant[];
  totalSpent?: number;
  balance?: number;
}

export default function HomePage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------
  // Load groups + calcular saldo real de cada grupo
  // ------------------------------------------------------------
  useEffect(() => {
    async function load() {
      const { data: groupsData } = await supabase.from("groups").select("*");

      const updatedGroups: Group[] = [];

      for (const group of groupsData ?? []) {
        const { data: txList } = await supabase
          .from("transactions")
          .select("*")
          .eq("group_id", group.id);

        const me = group.participants?.[0]?.id;
        let totalSpent = 0;
        let balance = 0;

        txList?.forEach((tx) => {
          totalSpent += tx.value;

          if (tx.payer_id === me) balance += tx.value;

          const myShare = tx.splits?.[me] ?? 0;
          balance -= myShare;
        });

        updatedGroups.push({
          ...group,
          totalSpent,
          balance,
        });
      }

      setGroups(updatedGroups);

      // saldo geral = soma dos saldos individuais
      const total = updatedGroups.reduce((acc, g) => acc + (g.balance ?? 0), 0);
      setTotalBalance(total);

      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F7F8]">

      {/* ------------------------------------------------------ */}
      {/* HEADER + SALDO GERAL */}
      {/* ------------------------------------------------------ */}
      <div className="w-full bg-gradient-to-r from-[#5BC5A7] to-[#4AB396] text-white pb-8 pt-6 shadow-lg">
        <div className="max-w-4xl mx-auto px-6">

          {/* Top bar */}
          <div className="flex justify-between items-center mb-4">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center">
              <span className="font-semibold">M</span>
            </div>

            {/* Botão ações */}
            <Link
              href="/profile"
              className="px-4 py-2 bg-white/20 rounded-lg font-medium backdrop-blur-sm hover:bg-white/30 transition"
            >
              Ações
            </Link>
          </div>

          {/* Saudação */}
          <h2 className="text-lg font-medium opacity-90">Bem-vindo, Mafra</h2>

          {/* SALDO CENTRALIZADO */}
          <div className="text-center mt-6">
            <p className="text-sm opacity-80">Saldo total</p>

            {totalBalance === 0 ? (
              <p className="text-4xl font-bold mt-1">R$ 0,00</p>
            ) : totalBalance > 0 ? (
              <p className="text-4xl font-bold mt-1 text-green-100">
                R$ {totalBalance.toFixed(2)}
              </p>
            ) : (
              <p className="text-4xl font-bold mt-1 text-red-200">
                R$ {Math.abs(totalBalance).toFixed(2)}
              </p>
            )}

            <p className="opacity-80 text-sm mt-1">
              {totalBalance === 0
                ? "zerado"
                : totalBalance > 0
                ? "te devem"
                : "você deve"}
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------ */}
      {/* GRUPOS RECENTES */}
      {/* ------------------------------------------------------ */}
      <div className="max-w-4xl mx-auto px-6 mt-10">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Grupos recentes</h3>
          <Link href="/groups" className="text-sm text-gray-500 hover:underline">
            Ver todos
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : groups.length === 0 ? (
          <p className="text-gray-500">Nenhum grupo criado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/group/${group.id}`}
                className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{group.name}</p>
                    <p className="text-sm text-gray-500">
                      {group.participants?.length || 0} pessoas
                    </p>
                  </div>

                  {/* SALDO DO GRUPO */}
                  <div className="text-right">
                    {group.balance === 0 ? (
                      <>
                        <p className="text-sm text-gray-500">
                          R$ {group.totalSpent?.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">zerado</p>
                      </>
                    ) : group.balance! > 0 ? (
                      <div>
                        <p className="text-sm font-semibold text-[#5BC5A7]">
                          R$ {group.balance?.toFixed(2)}
                        </p>
                        <p className="text-xs text-[#5BC5A7]">te devem</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-[#FF6B6B]">
                          R$ {Math.abs(group.balance!).toFixed(2)}
                        </p>
                        <p className="text-xs text-[#FF6B6B]">você deve</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOLINHAS DE PARTICIPANTES */}
                <div className="flex mt-3 gap-1">
                  {group.participants?.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className="w-7 h-7 rounded-full bg-[#5BC5A7] text-white flex items-center justify-center text-xs font-semibold"
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------ */}
      {/* ATIVIDADES RECENTES (placeholder até criarmos) */}
      {/* ------------------------------------------------------ */}
      <div className="max-w-4xl mx-auto px-6 mt-10 mb-20">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Atividades recentes
        </h3>

        <p className="text-gray-500 text-sm">
          Em breve vamos puxar isso automaticamente de todas as transações 🔥
        </p>
      </div>
    </div>
  );
}
