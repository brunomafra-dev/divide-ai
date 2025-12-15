'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import ActionModalProvider from '@/components/ActionModalProvider'
import Script from 'next/script'
import { getCurrentUser } from '@/lib/auth'

import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import "../lib/fonts"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata = {
  title: "Divide Aí",
  description: "Divida gastos de forma inteligente",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setLoading(false)
      if (!currentUser) {
        router.push('/auth/login') // Redireciona para login se não houver usuário
      }
    }

    loadUser()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    )
  }

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
            <div className="pb-32">{children}</div>
            <Navbar />
          </ActionModalProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

