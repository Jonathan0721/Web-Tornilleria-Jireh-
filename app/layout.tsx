import type { Metadata, Viewport } from 'next'
import './globals.css'
import { CartProvider } from '@/lib/cart-context'
import GoogleAnalytics from '@/components/google-analytics'
import LiveChat from '@/components/live-chat'
import ConsentBanner from '@/components/consent-banner'
import AnalyticsConsent from '@/components/analytics-consent'

export const metadata: Metadata = {
  title: 'TORNILLOS JEHOVA JIREH | ',
  description: 'Venta de tornillos, tuercas, arandelas y suministros industriales en Guatemala. Catálogo online, precios competitivos, envíos nacionales y atención personalizada.',
  keywords: 'tornillos, tuercas, arandelas, suministros industriales, ferretería, Guatemala, construcción, fijaciones, hardware industrial',
  authors: [{ name: 'TORNILLOS JEHOVA JIREH' }],
  creator: 'TORNILLOS JEHOVA JIREH',
  publisher: 'TORNILLOS JEHOVA JIREH',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'TORNILLOS JEHOVA JIREH | Suministros Industriales en Guatemala',
    description: 'Venta de tornillos, tuercas, arandelas y suministros industriales en Guatemala. Catálogo online y envíos nacionales.',
    url: '/',
    siteName: 'TORNILLOS JEHOVA JIREH',
    locale: 'es_GT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TORNILLOS JEHOVA JIREH | Suministros Industriales en Guatemala',
    description: 'Venta de tornillos, tuercas, arandelas y suministros industriales en Guatemala.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  generator: 'v0.app',
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="bg-background">
      <body className="antialiased">
        <CartProvider>
          {children}
        </CartProvider>
        {process.env.NODE_ENV === 'production' && <GoogleAnalytics />}
        {process.env.NODE_ENV === 'production' && <AnalyticsConsent />}
        <LiveChat />
        <ConsentBanner />
      </body>
    </html>
  )
}
