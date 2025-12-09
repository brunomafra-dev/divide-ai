"use client";

import { ArrowLeft, Plus, TrendingUp, TrendingDown, Settings, Check } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

interface Participant {
  id: string;
  name: string;
  email?: string;
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

interface Payment {
  id: string;
  group_id: string;
  from_id: string; // quem pagou
  to_id: string;   // quem recebeu
  amount: number;
  created_at: string;
}

interface GroupData {
  id: string;
  name: string;
  participants: Participant[];
}

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------

export default function GroupPage() {
  const { id: groupId } = useParams();

  const [group, setGroup] = useState<GroupData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true);

  const [totalSpent, setTotalSpent] = useState(0);
  const [balance, setBalance] = useState(0);

  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  // --------------------------------------------------
  // LOAD GROUP + TRANSACTIONS + PAYMENTS
  // --------------------------------------------------

  useEffect(() => {
    async function load() {
      // grupo
      const { data: g } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (!g) return;
      setGroup(g);

      // transações
      const { data: t } = await supabase
        .from("transactions")
        .select("*")
        .eq("group_id", groupId);

      setTransactions(t || []);

      // pagamentos
      const { data: p } = await supabase
        .from("payments")
        .select("*")
        .eq("group_id", groupId);

      setPayments(p || []);

      // calcular
      calculate(g, t || [], p || []);

      setLoading(false);
    }

    load();
  }, [groupId]);

  // --------------------------------------------------
  // CALCULAR SALDO COMPLETO
  // --------------------------------------------------

  function calculate(group: GroupData, txs: Transaction[], pays: Payment[]) {
    let total = 0;
    let myBalance = 0;

    const me = group.participants[0].id; // "Você"

    // --- GASTOS ---------------------------------------------------
    txs.forEach((tx) => {
      total += tx.value;

      if (tx.payer_id === me) {
        myBalance += tx.value;
      }

      const myPart = tx.splits[me] ?? 0;
      myBalance -= myPart;
    });

    // --- PAGAMENTOS ----------------------------------------------
    pays.forEach((pay) => {
      if (pay.from_id === me) {
        myBalance -= pay.amount;
      }
      if (pay.to_id === me) {
        myBalance += pay.amount;
      }
    });

    setTotalSpent(total);
    setBalance(myBalance);
  }

  // --------------------------------------------------
  // ADICIONAR PAGAMENTO
  // --------------------------------------------------

  async function registerPayment() {
    if (!payAmount || !selectedUser) return;

    const me = group!.participants[0].id;

    const { error } = await supabase.from("payments").insert({
      id: crypto.randomUUID(),
      group_id: groupId,
      from_id: me,
      to_id: selectedUser,
      amount: parseFloat(payAmount),
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error(error);
      alert("Erro ao registrar pagamento");
      return;
    }

    setShowPayModal(false);
    setPayAmount("");
    setSelectedUser("");

    // recarregar tudo
    const { data: g } = await supabase.from("groups").select("*").eq("id", groupId).single();
    const { data: t } = await supabase.from("transactions").select("*").eq("group_id", groupId);
    const { data: p } = await supabase.from("payments").select("*").eq("group_id", groupId);

    setGroup(g);
    setTransactions(t || []);
    setPayments(p || []);

    calculate(g, t || [], p || []);
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading || !group)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    );

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-20">

      {/* Header */}
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

      {/* SALDOS */}
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

          {/* Botão Pagar */}
          {balance !== 0 && (
            <button
              onClick={() => setShowPayModal(true)}
              className="mt-4 mx-auto block bg-[#5BC5A7] text-white px-6 py-2 rounded-lg hover:bg-[#4AB396]"
            >
              Registrar pagamento
            </button>
          )}

        </div>
      </div>

      {/* LISTA DE GASTOS */}
      <main className="max-w-4xl mx-auto px-4 py-6">

        <h2 className="text-lg font-semibold text-gray-700 mb-4">Gastos</h2>

        {transactions.length === 0 && (
          <p className="text-gray-500">Nenhum gasto adicionado.</p>
        )}

        <div className="space-y-3">
          {transactions.map((tx) => {
            const payer =
              group.participants.find((p) => p.id === tx.payer_id)?.name || "Alguém";

            return (
              <div key={tx.id} className="bg-white p-4 rounded-xl shadow-sm border">
                <div className="flex justify-between">
                  <p className="font-medium text-gray-800">{tx.description}</p>
                  <p className="font-semibold">R$ {tx.value.toFixed(2)}</p>
                </div>

                <p className="text-sm text-gray-500 mt-1">
                  Pago por <strong>{payer}</strong>
                </p>

                <div className="mt-2 text-sm text-gray-600">
                  <p>Divisão:</p>

                  {Object.entries(tx.splits).map(([pid, v]) => {
                    const name =
                      group.participants.find((p) => p.id === pid)?.name || pid;
                    return (
                      <p key={pid} className="ml-2">
                        {name}: R$ {v.toFixed(2)}
                      </p>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Botão flutuante */}
        <Link href={`/group/${groupId}/add-expense`}>
          <button className="fixed bottom-20 right-6 w-16 h-16 bg-[#5BC5A7] rounded-full flex items-center justify-center shadow-lg hover:bg-[#4AB396]">
            <Plus className="text-white w-8 h-8" />
          </button>
        </Link>

      </main>

      {/* MODAL DE PAGAMENTO */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-lg w-80">

            <h2 className="text-lg font-semibold mb-4">Registrar pagamento</h2>

            <label className="text-sm text-gray-600">Para quem você pagou?</label>
            <select
              className="w-full p-2 border rounded mb-4"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Selecione</option>
              {group.participants.slice(1).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <label className="text-sm text-gray-600">Valor</label>
            <input
              type="number"
              className="w-full p-2 border rounded mb-4"
              placeholder="0.00"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />

            <button
              onClick={registerPayment}
              className="w-full bg-[#5BC5A7] text-white py-2 rounded-lg flex items-center justify-center gap-2"
            >
              <Check size={18} /> Registrar
            </button>

            <button
              onClick={() => setShowPayModal(false)}
              className="mt-2 w-full text-gray-600 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
