'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export const CONSENT_STORAGE_KEY = 'tj-analytics-consent'

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(localStorage.getItem(CONSENT_STORAGE_KEY) === null)
  }, [])

  const choose = (value: 'accepted' | 'rejected') => {
    localStorage.setItem(CONSENT_STORAGE_KEY, value)
    window.dispatchEvent(new CustomEvent('tj-consent-change'))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <aside
      role="dialog"
      aria-label="Preferencias de privacidad"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-xl sm:inset-x-6"
    >
      <h2 className="font-semibold">Tu privacidad importa</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Usamos almacenamiento esencial para recordar tu carrito. Con tu permiso,
        también usamos Analytics para entender cómo se usa la web. Puedes aceptar o
        rechazar el análisis; consulta nuestra{' '}
        <Link href="/privacidad" className="font-medium text-foreground underline">
          política de privacidad
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => choose('accepted')}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Aceptar análisis
        </button>
        <button
          onClick={() => choose('rejected')}
          className="rounded-lg border border-input px-4 py-2 text-sm font-medium"
        >
          Rechazar análisis
        </button>
      </div>
    </aside>
  )
}
