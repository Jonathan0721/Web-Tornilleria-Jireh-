import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting básico en memoria (para producción usar Redis)
const rateLimit = new Map()
const RATE_LIMIT_MAX = 30 // intentos por hora
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hora

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userRequests = rateLimit.get(ip) || []
  
  // Limpiar requests antiguos
  const validRequests = userRequests.filter((time: number) => now - time < RATE_LIMIT_WINDOW)
  
  if (validRequests.length >= RATE_LIMIT_MAX) {
    return false
  }
  
  validRequests.push(now)
  rateLimit.set(ip, validRequests)
  return true
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  // Proteger ruta /admin y sus subrutas
  if (pathname.startsWith('/admin')) {
    // Rate limiting para intentos de acceso a admin
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta más tarde.' },
        { status: 429 }
      )
    }

    const session = request.cookies.get('better-auth.session_token')
    
    if (!session) {
      // Redirigir a login si no hay sesión
      const loginUrl = new URL('/sign-in', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}
