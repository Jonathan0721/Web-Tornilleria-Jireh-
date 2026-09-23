import { createOrder } from '@/app/actions/orders'
import { NextResponse } from 'next/server'

// Rate limiting simple en memoria (para producción usar Redis o similar)
const rateLimit = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 10 // 10 pedidos por hora
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

export async function POST(request: Request) {
  try {
    // Obtener IP del cliente
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    // Verificar rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Demasiados pedidos. Por favor intenta más tarde.' },
        { status: 429 }
      )
    }
    
    const formData = await request.formData()
    
    // Validación básica
    const clientName = formData.get('clientName')
    const clientPhone = formData.get('clientPhone')
    const items = formData.get('items')
    
    if (!clientName || !clientPhone || !items) {
      return NextResponse.json(
        { error: 'Datos incompletos. Nombre, teléfono y productos son requeridos.' },
        { status: 400 }
      )
    }
    
    const result = await createOrder(formData)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error processing order:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar el pedido' },
      { status: 500 }
    )
  }
}
