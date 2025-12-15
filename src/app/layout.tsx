import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "../lib/fonts";

import Navbar from "@/components/Navbar";
import ActionModalProvider from "@/components/ActionModalProvider";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Divide Aí",
  description: "Divida gastos de forma inteligente",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <Script src="/lasy-bridge.js" strategy="beforeInteractive" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F7F7F7]`}
      >
        <AuthProvider>
          <ActionModalProvider>
            {/* Conteúdo das páginas */}
            <div className="pb-32">{children}</div>

            {/* Navbar fixa */}
            <Navbar />
          </ActionModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
