"use client";

import { ArrowLeft, Plus, TrendingUp, TrendingDown, Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Participant {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  group_id: string;
  value: number;
  payer_id: string;
  participants: string[];
  splits: Record<string, number>;
  description: string;
}

interface GroupData {
  id: string;
  name: string;
  participants: Participant[];
}

export default function GroupPage() {
  const { id: groupId } = useParams();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [totalSpent, setTotalSpent] = useState(0);
  const [balance, setBalance] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ------------------------------------------------------------
  // 1) Carregar grupo + transações
  // ------------------------------------------------------------
  useEffect(() => {
    async function load() {
      const { data: g } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (!g) return;

      setGroup(g);

      const { data: t } = await supabase
        .from("transactions")
        .select("*")
        .eq("group_id", groupId);

      setTransactions(t || []);
      calculate(g, t || []);
      setLoading(false);
    }

    load();
  }, [groupId]);

  // ------------------------------------------------------------
  // 2) Cálculo do total e saldo
  // ------------------------------------------------------------
  function calculate(group: GroupData, transactions: Transaction[]) {
    let total = 0;
    let myBalance = 0;

    const me = group.participants[0].id;

    transactions.forEach(tx => {
      total += tx.value;

      if (tx.payer_id === me) myBalance += tx.value;

      const myShare = tx.splits[me] ?? 0;
      myBalance -= myShare;
    });

    setTotalSpent(total);
    setBalance(myBalance);
  }

  // ------------------------------------------------------------
  // 3) Modal excluir gasto
  // ------------------------------------------------------------
  function openDeleteModal(tx: Transaction) {
    setDeleteTarget(tx);
    setShowDeleteModal(true);
  }

  async function deleteExpense() {
    if (!deleteTarget) return;

    await supabase.from("transactions")
      .delete()
      .eq("id", deleteTarget.id);

    const newList = transactions.filter(t => t.id !== deleteTarget.id);
    setTransactions(newList);

    if (group) calculate(group, newList);

    setShowDeleteModal(false);
  }

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  if (loading || !group)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-24">

      {/* HEADER */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>

          <h1 className="text-lg font-semibold text-gray-800">{group.name}</h1>

          <Link href={`/group/${groupId}/settings`}>
            <Settings className="w-6 h-6 text-gray-600" />
          </Link>
        </div>
      </header>

      {/* TOTAL + SALDO */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 text-center">

            <div>
              <p className="text-sm text-gray-500">Total gasto</p>
              <p className="text-2xl font-bold">R$ {totalSpent.toFixed(2)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Seu saldo</p>

              {balance === 0 && <p className="text-2xl font-bold">R$ 0,00</p>}

              {balance > 0 && (
                <p className="text-2xl font-bold text-[#5BC5A7] flex items-center justify-center gap-1">
                  <TrendingUp className="w-5 h-5" /> R$ {balance.toFixed(2)}
                </p>
              )}

              {balance < 0 && (
                <p className="text-2xl font-bold text-[#FF6B6B] flex items-center justify-center gap-1">
                  <TrendingDown className="w-5 h-5" /> R$ {Math.abs(balance).toFixed(2)}
                </p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* LISTA DE GASTOS */}
      <main className="max-w-4xl mx-auto px-4 py-6">

        <h2 className="text-lg font-semibold text-gray-700 mb-4">Gastos</h2>

        {transactions.length === 0 && (
          <p className="text-gray-500">Nenhum gasto adicionado.</p>
        )}

        <div className="space-y-3">
          {transactions.map(tx => {
            const payer = group.participants.find(p => p.id === tx.payer_id)?.name || "Alguém";

            return (
              <div
                key={tx.id}
                onClick={() => (window.location.href = `/group/${groupId}/edit-expense/${tx.id}`)}
                className="bg-white p-4 rounded-xl shadow-sm border cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="flex justify-between items-start">

                  {/* ESQUERDA */}
                  <div className="w-full">
                    <p className="font-medium text-gray-800">{tx.description}</p>

                    <p className="text-xs text-gray-400 mt-1">Toque para editar</p>

                    <p className="text-sm text-gray-500 mt-2">
                      Pago por <strong>{payer}</strong>
                    </p>

                    <div className="mt-2 text-sm text-gray-600">
                      <p>Divisão:</p>

                      {Object.entries(tx.splits).map(([pid, v]) => {
                        const name = group.participants.find(p => p.id === pid)?.name || pid;
                        return (
                          <p key={pid} className="ml-2">
                            {name}: R$ {v.toFixed(2)}
                          </p>
                        );
                      })}
                    </div>
                  </div>

                  {/* DIREITA - VALOR + LIXO */}
                  <div
                    className="flex flex-col items-end gap-2 min-w-[70px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="font-semibold text-right">R$ {tx.value.toFixed(2)}</p>

                    <button
                      onClick={() => openDeleteModal(tx)}
                      className="p-1.5 rounded-full hover:bg-red-50"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* BOTÃO FLUTUANTE */}
        <Link href={`/group/${groupId}/add-expense`}>
          <button className="fixed bottom-20 right-6 w-16 h-16 bg-[#5BC5A7] rounded-full flex items-center justify-center shadow-lg">
            <Plus className="text-white w-8 h-8" />
          </button>
        </Link>

      </main>

      {/* MODAL DELETAR */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-80">
            <h2 className="text-lg font-semibold text-gray-800">
              Apagar gasto?
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Tem certeza que deseja remover "{deleteTarget.description}"?
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg border"
              >
                Cancelar
              </button>

              <button
                onClick={deleteExpense}
                className="px-4 py-2 rounded-lg bg-red-500 text-white"
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
