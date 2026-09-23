'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

type Client = {
  id: string
  nombre: string
  email: string
  telefono?: string | null
  nit?: string | null
  empresa?: string | null
  direccion?: string | null
}

export function NitLookupPanel() {
  const [nit, setNit] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [client, setClient] = useState<Client | null>(null)

  async function search() {
    setLoading(true)
    setError('')
    setClient(null)
    try {
      const res = await fetch('/api/clients?nit=' + encodeURIComponent(nit.trim()))
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No encontrado')
      setClient(data.client)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={nit}
          onChange={(e) => setNit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') search()
          }}
          placeholder="NIT del cliente"
          className="h-12 flex-1 rounded-xl border border-input bg-background px-3 text-base"
        />
        <button
          type="button"
          onClick={search}
          disabled={loading || !nit.trim()}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Search className="size-4" />
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {client ? (
        <div className="space-y-2 rounded-xl border border-border bg-background p-4 text-sm">
          <p>
            <span className="text-muted-foreground">Nombre:</span> {client.nombre}
          </p>
          <p>
            <span className="text-muted-foreground">NIT:</span> {client.nit || '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Teléfono:</span> {client.telefono || '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Empresa:</span> {client.empresa || '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span> {client.email}
          </p>
          <p>
            <span className="text-muted-foreground">Dirección:</span> {client.direccion || '—'}
          </p>
        </div>
      ) : null}
    </div>
  )
}
