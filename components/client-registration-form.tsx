'use client'

import { FormEvent, useState } from 'react'
import { CheckCircle2, Building2, User } from 'lucide-react'

export function ClientRegistrationForm() {
  const [nombre, setNombre] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [nit, setNit] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, empresa, nit, telefono, email, direccion }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-7 text-primary" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Datos guardados</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ya quedaste registrado. En la próxima compra o factura, con tu NIT cargamos tus datos.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <a
            href="/catalogo"
            className="flex h-12 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            Ir al catálogo
          </a>
          <a
            href="/"
            className="flex h-12 flex-1 items-center justify-center rounded-xl border border-border text-sm font-medium"
          >
            Inicio
          </a>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 sm:col-span-2">
          <span className="flex items-center gap-2 text-sm font-medium">
            <User className="size-4" /> Nombre completo *
          </span>
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base"
            autoComplete="name"
          />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="size-4" /> Empresa (opcional)
          </span>
          <input
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base"
            autoComplete="organization"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">NIT *</span>
          <input
            required
            value={nit}
            onChange={(e) => setNit(e.target.value)}
            placeholder="Ej. 1234567-8"
            className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Teléfono *</span>
          <input
            required
            type="tel"
            inputMode="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base"
            autoComplete="tel"
          />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Email (opcional)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base"
            autoComplete="email"
          />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Dirección (opcional)</span>
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base"
            autoComplete="street-address"
          />
        </label>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Registrarme'}
      </button>
      <p className="text-xs text-muted-foreground">
        Al registrarte guardamos tus datos solo para pedidos, contacto y facturación de Tornilleria
        Jehova Jireh.
      </p>
    </form>
  )
}
