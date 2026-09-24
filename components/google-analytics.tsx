'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function GoogleAnalyticsInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID

  useEffect(() => {
    if (typeof window !== 'undefined' && GA_ID) {
      // Load Google Analytics script
      const script = document.createElement('script')
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
      script.async = true
      document.head.appendChild(script)

      // Initialize gtag
      window.dataLayer = window.dataLayer || []
      window.gtag = function gtag() {
        window.dataLayer.push(arguments)
      }
      window.gtag('js', new Date())
      window.gtag('config', GA_ID)
    }
  }, [GA_ID])

  useEffect(() => {
    if (GA_ID && typeof window !== 'undefined' && window.gtag) {
      // Track page views
      const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
      window.gtag('event', 'page_view', {
        page_path: url,
      })
    }
  }, [pathname, searchParams, GA_ID])

  return null
}

export default function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsInner />
    </Suspense>
  )
}
