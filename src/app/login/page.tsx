'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User } from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    // Verificar se usuário já está logado
    const isLoggedIn = localStorage.getItem('divideai_logged_in')
    const keepLoggedIn = localStorage.getItem('divideai_keep_logged_in')
    
    if (isLoggedIn === 'true' && keepLoggedIn === 'true') {
      router.push('/')
    }
  }, [router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isLogin) {
      // Login
      if (!email || !password) {
        alert('Preencha todos os campos')
        return
      }

      // Simular login
      localStorage.setItem('divideai_logged_in', 'true')
      localStorage.setItem('divideai_user_email', email)
      
      if (rememberMe) {
        localStorage.setItem('divideai_keep_logged_in', 'true')
      } else {
        localStorage.removeItem('divideai_keep_logged_in')
      }

      router.push('/')
    } else {
      // Cadastro
      if (!name || !email || !password) {
        alert('Preencha todos os campos')
        return
      }

      // Simular cadastro
      localStorage.setItem('divideai_logged_in', 'true')
      localStorage.setItem('divideai_user_email', email)
      localStorage.setItem('divideai_user_name', name)
      
      if (rememberMe) {
        localStorage.setItem('divideai_keep_logged_in', 'true')
      }

      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5BC5A7] to-[#4AB396] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Divide Aí</h1>
          <p className="text-white/80">Divida gastos com facilidade</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                isLogin
                  ? 'bg-[#5BC5A7] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                !isLogin
                  ? 'bg-[#5BC5A7] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5BC5A7] focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5BC5A7] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5BC5A7] focus:border-transparent"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#5BC5A7] border-gray-300 rounded focus:ring-[#5BC5A7]"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                Manter conectado
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#5BC5A7] text-white py-3 rounded-lg font-semibold hover:bg-[#4AB396] transition-colors"
            >
              {isLogin ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          {/* Footer */}
          {isLogin && (
            <div className="mt-4 text-center">
              <button className="text-sm text-[#5BC5A7] hover:text-[#4AB396]">
                Esqueceu a senha?
              </button>
            </div>
          )}
        </div>

        {/* Terms */}
        <p className="text-center text-white/70 text-xs mt-6">
          Ao continuar, você concorda com nossos{' '}
          <button className="underline">Termos de Uso</button> e{' '}
          <button className="underline">Política de Privacidade</button>
        </p>
      </div>
    </div>
  )
}
