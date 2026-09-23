import { NextResponse } from 'next/server'
import { getClientByNit, upsertClient } from '@/app/actions/clients'

// Rate limiting simple en memoria
const rateLimit = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 30 // 30 consultas por hora
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hora

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimit.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }
  
  record.count++
  return true
}

export async function GET(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Demasiadas consultas. Por favor intenta más tarde.' },
        { status: 429 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const nit = searchParams.get('nit') || ''
    if (!nit.trim()) {
      return NextResponse.json({ error: 'NIT requerido' }, { status: 400 })
    }
    const client = await getClientByNit(nit)
    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ client })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al buscar cliente' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Demasiados registros. Por favor intenta más tarde.' },
        { status: 429 }
      )
    }
    
    const body = await request.json()
    
    // Validación básica
    if (!body.nombre || !body.telefono || !body.nit) {
      return NextResponse.json(
        { error: 'Nombre, teléfono y NIT son requeridos' },
        { status: 400 }
      )
    }
    
    // Sanitización básica
    const nombre = String(body.nombre).trim().slice(0, 100)
    const telefono = String(body.telefono).trim().slice(0, 20)
    const nit = String(body.nit).trim().slice(0, 20)
    const email = body.email ? String(body.email).trim().slice(0, 100) : ''
    const empresa = body.empresa ? String(body.empresa).trim().slice(0, 100) : ''
    const direccion = body.direccion ? String(body.direccion).trim().slice(0, 255) : ''
    
    const result = await upsertClient({
      nombre,
      telefono,
      nit,
      email,
      empresa,
      direccion,
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al registrar cliente' },
      { status: 400 },
    )
  }
}
