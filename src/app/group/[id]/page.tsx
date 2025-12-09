"use client";

import {
  ArrowLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  Settings,
  Check,
} from "lucide-react";
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

interface Payment {
  id: string;
  group_id: string;
  from_id: string;
  to_id: string;
  amount: number;
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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [totalSpent, setTotalSpent] = useState(0);
  const [balance, setBalance] = useState(0);

  // ================================
  // MODAL DE PAGAMENTO
  // ================================
  const [showPayModal, setShowPayModal] = useState(false);
  const [payerId, setPayerId] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [payAmount, setPayAmount] = useState("");

  // ================================
  // CARREGA DADOS DO GRUPO + TRANSAÇÕES + PAGAMENTOS
  // ================================
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

      const { data: p } = await supabase
        .from("payments")
        .select("*")
        .eq("group_id", groupId);

      setTransactions(t || []);
      setPayments(p || []);

      calculate(g, t || [], p || []);
      setLoading(false);
    }

    load();
  }, [groupId]);

  // ================================
  // CALCULA SALDO E TOTAL
  // ================================
  function calculate(
    group: GroupData,
    transactions: Transaction[],
    payments: Payment[]
  ) {
    let total = 0;
    let myBalance = 0;

    const me = group.participants[0].id; // "Você" sempre será o primeiro

    // ---- Transações (gastos)
    transactions.forEach((tx) => {
      total += tx.value;

      if (tx.payer_id === me) myBalance += tx.value;

      const myPart = tx.splits[me] ?? 0;
      myBalance -= myPart;
    });

    // ---- Pagamentos realizados
    payments.forEach((p) => {
      if (p.from_id === me) myBalance -= p.amount; // eu paguei → saldo diminui
      if (p.to_id === me) myBalance += p.amount; // eu recebi → saldo aumenta
    });

    setTotalSpent(total);
    setBalance(myBalance);
  }

  // ================================
  // REGISTRAR PAGAMENTO
  // ================================
  async function registerPayment() {
    if (!payerId || !selectedUser || !payAmount) {
      alert("Preencha todos os campos!");
      return;
    }

    const payment = {
      id: crypto.randomUUID(),
      group_id: groupId,
      from_id: payerId,
      to_id: selectedUser,
      amount: parseFloat(payAmount),
    };

    const { error } = await supabase.from("payments").insert(payment);

    if (error) {
      console.error(error);
      alert("Erro ao registrar pagamento!");
      return;
    }

    setShowPayModal(false);
    setPayAmount("");
    setPayerId("");
    setSelectedUser("");

    location.reload(); // recarrega dados
  }

  if (loading || !group)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    );

  // =====================================
  // RENDERIZAÇÃO
  // =====================================

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-20">

      {/* MODAL DE PAGAMENTO */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-lg w-80">

            <h2 className="text-lg font-semibold mb-4">Registrar pagamento</h2>

            {/* QUEM PAGOU */}
            <label className="text-sm text-gray-600">Quem pagou?</label>
            <select
              className="w-full p-2 border rounded mb-4"
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
            >
              <option value="">Selecione</option>
              {group.participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* QUEM RECEBEU */}
            <label className="text-sm text-gray-600">Quem recebeu?</label>
            <select
              className="w-full p-2 border rounded mb-4"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Selecione</option>
              {group.participants
                .filter((p) => p.id !== payerId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>

            {/* VALOR */}
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

      {/* TOTAL E SALDO */}
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
                  <TrendingUp className="w-5 h-5" />
                  R$ {balance.toFixed(2)}
                </p>
              )}

              {balance < 0 && (
                <p className="text-2xl font-bold text-[#FF6B6B] flex items-center justify-center gap-1">
                  <TrendingDown className="w-5 h-5" />
                  R$ {Math.abs(balance).toFixed(2)}
                </p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* LISTA DE TRANSAÇÕES */}
      <main className="max-w-4xl mx-auto px-4 py-6">

        <h2 className="text-lg font-semibold text-gray-700 mb-4">Gastos</h2>

        {transactions.length === 0 && (
          <p className="text-gray-500">Nenhum gasto adicionado.</p>
        )}

        <div className="space-y-3">
          {transactions.map((tx) => {
            const payer =
              group.participants.find((p) => p.id === tx.payer_id)?.name ||
              "Alguém";

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
                      group.participants.find((p) => p.id === pid)?.name ||
                      pid;
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

        {/* BOTÃO DE REGISTRAR PAGAMENTO */}
        <button
          onClick={() => setShowPayModal(true)}
          className="fixed bottom-32 right-6 w-56 py-3 bg-blue-500 rounded-full shadow-lg text-white font-semibold"
        >
          Registrar pagamento
        </button>

        {/* BOTÃO FLUTUANTE DE ADICIONAR GASTO */}
        <Link href={`/group/${groupId}/add-expense`}>
          <button className="fixed bottom-20 right-6 w-16 h-16 bg-[#5BC5A7] rounded-full flex items-center justify-center shadow-lg">
            <Plus className="text-white w-8 h-8" />
          </button>
        </Link>

      </main>
    </div>
  );
}
