"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Plus, Wallet, User } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50">
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Home */}
        <Link href="/" className="flex flex-col items-center w-16">
          <Home
            className={`w-6 h-6 ${
              isActive("/") ? "text-[#5BC5A7]" : "text-gray-500"
            }`}
          />
          <span className="text-[11px]">
            Home
          </span>
        </Link>

        {/* Grupos */}
        <Link href="/groups" className="flex flex-col items-center w-16">
          <Users
            className={`w-6 h-6 ${
              isActive("/group") ? "text-[#5BC5A7]" : "text-gray-500"
            }`}
          />
          <span className="text-[11px]">
            Grupos
          </span>
        </Link>

        {/* Botão central */}
        <Link href="/create-group">
          <div className="w-14 h-14 bg-[#5BC5A7] rounded-full flex items-center justify-center text-white shadow-xl -mt-10">
            <Plus className="w-7 h-7" />
          </div>
        </Link>

        {/* Pagamentos */}
        <Link href="/payments" className="flex flex-col items-center w-16">
          <Wallet
            className={`w-6 h-6 ${
              isActive("/payments") ? "text-[#5BC5A7]" : "text-gray-500"
            }`}
          />
          <span className="text-[11px]">
            Pagamentos
          </span>
        </Link>

        {/* Perfil */}
        <Link href="/profile" className="flex flex-col items-center w-16">
          <User
            className={`w-6 h-6 ${
              isActive("/profile") ? "text-[#5BC5A7]" : "text-gray-500"
            }`}
          />
          <span className="text-[11px]">
            Perfil
          </span>
        </Link>

      </div>
    </nav>
  );
}

