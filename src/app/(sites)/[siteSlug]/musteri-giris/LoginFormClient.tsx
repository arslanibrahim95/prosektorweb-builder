'use client'

import { useState } from 'react'
import type React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Lock, Mail } from 'lucide-react'

import { useAuth } from '@/features/auth/AuthContext'

export function LoginForm({ siteSlug }: { siteSlug: string }) {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('loading')
    setError('')

    try {
      const response = await fetch('/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok && data.user) {
        login(data.token, {
          id: data.user.id,
          email: data.user.email,
          collection: 'customers',
          companyName: data.user.companyName,
        })

        router.push(`/${siteSlug}/musteri-paneli`)
        router.refresh()
        return
      }

      throw new Error(data.errors?.[0]?.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.')
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'Bir hata oluştu'
      console.error(unknownError)
      setStatus('error')
      setError(message)
    }
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-md shadow-sm -space-y-px">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email-address"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-neutral-300 placeholder-neutral-500 text-neutral-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="E-posta adresi"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-neutral-300 placeholder-neutral-500 text-neutral-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Şifre"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
      </div>

      {status === 'error' && (
        <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</div>
      )}

      <div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
        >
          {status === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Giriş Yap'}
        </button>
      </div>

      <div className="text-center">
        <a href="#" className="font-medium text-blue-600 hover:text-blue-500 text-sm">
          Şifremi unuttum?
        </a>
      </div>
    </form>
  )
}
