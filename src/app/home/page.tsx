"use client";

import { Plus, User, TrendingUp, TrendingDown, CreditCard, Clock } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Nota: este arquivo é pensado pra Next.js no modo app dir
 * e usa client-side fetching com supabase. Se você prefere
 * fazer server-side ou edge, a lógica precisa ser adaptada.
 */

/* -------------------- Tipagens -------------------- */
interface Participant {
  id: string;
  name: string;
  email?: string;
}

interface Group {
  id: string;
  name: string;
  total_spent?: number;
  balance?: number;
  participants?: Participant[]; // campo JSONB
}

interface Transaction {
  id: string;
  groupid: string;      // conforme seu banco
  value: number;
  description: string;
  payerid: string;
  participants: string[];      // array de ids
  splits: Record<string, number>;
  created_at?: string;
}

/* -------------------- Component -------------------- */
export default function HomePage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  // Carrega grupos e transações
  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      setLoading(true);

      const { data: groupsData, error: errG } = await supabase
        .from<Group>("groups")
        .select("*");

      if (errG) {
        console.error("Erro grupos:", errG);
      }

      const { data: txData, error: errT } = await supabase
        .from<Transaction>("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (errT) {
        console.error("Erro transactions:", errT);
      }

      if (!mounted) return;
      setGroups(groupsData || []);
      setTransactions(txData || []);
      setLoading(false);
    }

    loadAll();

    // opcional: subscribe a mudanças (realtime)
    const groupSub = supabase
      .channel("public:groups")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "groups" },
        () => loadAll()
      )
      .subscribe();

    const txSub = supabase
      .channel("public:transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => loadAll()
      )
      .subscribe();

    return () => {
      mounted = false;
      // cleanup channels
      try {
        supabase.removeChannel(groupSub);
        supabase.removeChannel(txSub);
      } catch (e) {}
    };
  }, []);

  /* -------------------- Aggregações -------------------- */

  // total gasto entre todos os grupos (somar cada transaction.value)
  const totalSpent = useMemo(() => {
    let s = 0;
    for (const tx of transactions) {
      // somar valor numérico
      s = s + Number(tx.value || 0);
    }
    return s;
  }, [transactions]);

  // calcular saldos por pessoa (map: personId -> balance)
  // definição: balance positivo = te devem; negativo = você deve
  // assumimos que cada group.participants tem ordem onde 1º é "Você" local do grupo.
  const perPersonBalances = useMemo(() => {
    const map = new Map<string, { name: string; balance: number }>();
    // helper pra garantir participante com nome no map
    function ensure(id: string, name = id) {
      if (!map.has(id)) map.set(id, { name, balance: 0 });
      return map.get(id)!;
    }

    // preencher nomes a partir dos grupos
    for (const g of groups) {
      const list = (g.participants as Participant[]) || [];
      for (const p of list) {
        ensure(p.id, p.name);
      }
    }

    // para cada transação:
    for (const tx of transactions) {
      const value = Number(tx.value || 0);
      // quem pagou recebe crédito (valor total)
      const payer = ensure(tx.payerid);
      payer.balance = payer.balance + value;

      // subtrair a parte de cada participante
      // splits: objeto com id->valor (já calculado ao salvar)
      const splits = tx.splits || {};
      for (const pid of Object.keys(splits)) {
        const part = Number(splits[pid] || 0);
        const person = ensure(pid);
        person.balance = person.balance - part;
      }
    }

    // transformar em array ordenado por valor absoluto decrescente
    const arr = Array.from(map.entries()).map(([id, v]) => ({
      id,
      name: v.name,
      balance: v.balance,
    }));

    // ordenar para exibir primeiros quem mais deve / é devido
    arr.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
    return arr;
  }, [transactions, groups]);

  // últimos gastos (limit 8)
  const recent = useMemo(() => {
    return transactions.slice(0, 8);
  }, [transactions]);

  /* -------------------- UI helpers -------------------- */
  const positiveNet = totalSpent === 0 ? 0 : perPersonBalances.reduce((acc, p) => acc + (p.balance || 0), 0);
  // positiveNet is just a check; main display uses totalSpent and per person balances

  /* -------------------- Render -------------------- */
  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-28">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#5BC5A7]">Divide Aí</h1>
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <div className="w-10 h-10 bg-[#5BC5A7] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Painel resumo */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-600 mb-1">Saldo total</p>

          <div className="flex items-center justify-center gap-3">
            {totalSpent === 0 ? (
              <>
                <p className="text-3xl font-bold text-gray-800">R$ 0,00</p>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">zerado</span>
              </>
            ) : totalSpent > 0 ? (
              <>
                <TrendingUp className="w-6 h-6 text-[#5BC5A7]" />
                <p className="text-3xl font-bold text-[#5BC5A7]">R$ {totalSpent.toFixed(2)}</p>
                <span className="text-sm text-[#5BC5A7] bg-green-50 px-3 py-1 rounded-full">movimentação</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-6 h-6 text-[#FF6B6B]" />
                <p className="text-3xl font-bold text-[#FF6B6B]">R$ {Math.abs(totalSpent).toFixed(2)}</p>
                <span className="text-sm text-[#FF6B6B] bg-red-50 px-3 py-1 rounded-full">negativo</span>
              </>
            )}
          </div>

          {/* resumo rápido: você pagou / sua parte / diferença */}
          <div className="mt-4 grid grid-cols-3 gap-3 text-left">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Você pagou</p>
              {/* soma das transações onde payerid === YOU (por enquanto detecta o primeiro participante "self" nos grupos) */}
              <p className="font-semibold mt-1">
                R$ {calcYouPaid(groups, transactions).toFixed(2)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Sua parte</p>
              <p className="font-semibold mt-1">R$ {calcYouShare(groups, transactions).toFixed(2)}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Diferença</p>
              <p className="font-semibold mt-1">
                R$ {(calcYouPaid(groups, transactions) - calcYouShare(groups, transactions)).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Pessoas que te devem / você deve */}
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Pessoas</h2>
            <p className="text-xs text-gray-500">Ordenado por impacto</p>
          </div>

          <div className="space-y-2">
            {perPersonBalances.length === 0 && <p className="text-sm text-gray-500">Sem movimentação</p>}
            {perPersonBalances.map(person => (
              <div key={person.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium">{person.name}</p>
                  <p className="text-xs text-gray-500">Total (todos grupos)</p>
                </div>
                <div className="text-right">
                  {person.balance === 0 ? (
                    <span className="text-sm text-gray-500">zerado</span>
                  ) : person.balance > 0 ? (
                    <p className="text-sm font-semibold text-[#5BC5A7]">R$ {person.balance.toFixed(2)}</p>
                  ) : (
                    <p className="text-sm font-semibold text-[#FF6B6B]">R$ {Math.abs(person.balance).toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Últimos gastos */}
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Últimos gastos</h2>
            <Link href="/transactions" className="text-sm text-[#5BC5A7]">Ver todos</Link>
          </div>

          <div className="space-y-2">
            {recent.length === 0 && <p className="text-sm text-gray-500">Nenhum gasto registrado</p>}
            {recent.map(tx => {
              const payerName = findPayerName(tx.payerid, groups) || "Alguém";
              const originGroup = groups.find(g => g.id === tx.groupid)?.name || "Sem grupo";
              return (
                <div key={tx.id} className="flex justify-between items-start p-2 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-xs text-gray-500">{payerName} • {originGroup}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">R$ {Number(tx.value).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* floating + menu */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="w-16 h-16 rounded-full bg-[#5BC5A7] flex items-center justify-center shadow-lg"
            aria-label="menu rapido"
          >
            <Plus className="w-8 h-8 text-white" />
          </button>

          {showMenu && (
            <div className="absolute right-0 bottom-20 w-56 bg-white rounded-lg shadow-md p-3 space-y-2">
              <Link href="/add-expense" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span>Adicionar gasto</span>
              </Link>
              <Link href="/register-payment" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <Clock className="w-5 h-5 text-gray-600" />
                <span>Registrar pagamento</span>
              </Link>
              <Link href="/create-group" className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <User className="w-5 h-5 text-gray-600" />
                <span>Criar grupo</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------- Funções utilitárias -------------------- */

function findPayerName(payerid: string, groups: Group[]) {
  for (const g of groups) {
    const list = (g.participants as Participant[]) || [];
    const p = list.find(x => x.id === payerid);
    if (p) return p.name;
  }
  return null;
}

/* Calcula "Você pagou" assumindo que em cada grupo o primeiro participante é "Você".
   Se você tiver um identificador global de usuário, substitui isso pela lógica correta. */
function calcYouPaid(groups: Group[], transactions: Transaction[]) {
  let total = 0;
  // pegar todos os ids que representam "Você" (primeiro participante de cada grupo)
  const youIds = new Set<string>();
  for (const g of groups) {
    const list = (g.participants as Participant[]) || [];
    if (list[0]) youIds.add(list[0].id);
  }
  for (const tx of transactions) {
    if (youIds.has(tx.payerid)) total += Number(tx.value || 0);
  }
  return total;
}

/* Calcula "Sua parte" somando os splits onde seu id aparece (novamente usando primeiro participante por grupo) */
function calcYouShare(groups: Group[], transactions: Transaction[]) {
  let total = 0;
  const youIds = new Set<string>();
  for (const g of groups) {
    const list = (g.participants as Participant[]) || [];
    if (list[0]) youIds.add(list[0].id);
  }
  for (const tx of transactions) {
    const splits = tx.splits || {};
    for (const y of youIds) {
      const v = Number(splits[y] || 0);
      total += v;
    }
  }
  return total;
}
