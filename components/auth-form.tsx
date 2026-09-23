'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/auth-client'

export default function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const result = mode === 'sign-in'
      ? await signIn.email({ email, password })
      : await signUp.email({ email, password, name })
    setLoading(false)
    if (result.error) { setError('No se pudo iniciar sesión. Revisa tus datos e inténtalo de nuevo.'); return }
    router.push('/')
    router.refresh()
  }

  return <main className="flex min-h-screen items-center justify-center bg-background px-6"><div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm"><div className="mb-8 flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground font-mono font-bold">TJ</div><div><p className="font-semibold">Tornilleria Jehova Jireh</p><p className="text-xs text-muted-foreground">Acceso de administración</p></div></div><h1 className="text-2xl font-semibold tracking-tight">{mode === 'sign-in' ? 'Bienvenido de nuevo' : 'Crear cuenta admin'}</h1><p className="mt-2 text-sm text-muted-foreground">Gestiona pedidos, catálogo e inventario desde un solo lugar.</p><form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">{mode === 'sign-up' && <label className="flex flex-col gap-2 text-sm font-medium">Nombre<input value={name} onChange={(e) => setName(e.target.value)} required className="h-11 rounded-lg border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary" /></label>}<label className="flex flex-col gap-2 text-sm font-medium">Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-lg border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary" /></label><label className="flex flex-col gap-2 text-sm font-medium">Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="h-11 rounded-lg border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary" /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<button disabled={loading} className="h-11 rounded-lg bg-primary font-medium text-primary-foreground disabled:opacity-60">{loading ? 'Procesando...' : mode === 'sign-in' ? 'Entrar al dashboard' : 'Crear cuenta'}</button></form><button onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')} className="mt-6 w-full text-sm text-muted-foreground hover:text-foreground">{mode === 'sign-in' ? '¿Primera vez? Crear cuenta' : 'Ya tengo una cuenta'}</button></div></main>
}
