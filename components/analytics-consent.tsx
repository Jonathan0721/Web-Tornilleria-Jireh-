'use client'

import { Analytics } from '@vercel/analytics/next'
import { useEffect, useState } from 'react'
import { CONSENT_STORAGE_KEY } from './consent-banner'

export default function AnalyticsConsent() {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const update = () => setAllowed(localStorage.getItem(CONSENT_STORAGE_KEY) === 'accepted')
    update()
    window.addEventListener('tj-consent-change', update)
    return () => window.removeEventListener('tj-consent-change', update)
  }, [])

  return allowed ? <Analytics /> : null
}
