'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { inventario, pedidos, pedidoItems, clientes } from '@/lib/db/schema'
import { eq, desc, count, sql, gte, lte, and } from 'drizzle-orm'
import { headers } from 'next/headers'

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('No autorizado')
}

export async function getDashboardStats() {
  await requireAdmin()
  
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  // Ventas del mes actual
  const currentMonthSales = await db
    .select({ total: sql<number>`COALESCE(SUM(${pedidos.total}), 0)` })
    .from(pedidos)
    .where(and(
      gte(pedidos.createdAt, firstDayOfMonth),
      eq(pedidos.estado, 'entregado')
    ))
  
  // Ventas del mes anterior
  const lastMonthSales = await db
    .select({ total: sql<number>`COALESCE(SUM(${pedidos.total}), 0)` })
    .from(pedidos)
    .where(and(
      gte(pedidos.createdAt, firstDayOfLastMonth),
      lte(pedidos.createdAt, lastDayOfLastMonth),
      eq(pedidos.estado, 'entregado')
    ))
  
  // Pedidos recibidos este mes
  const currentMonthOrders = await db
    .select({ count: count() })
    .from(pedidos)
    .where(gte(pedidos.createdAt, firstDayOfMonth))
  
  // Productos activos
  const activeProducts = await db
    .select({ count: count() })
    .from(inventario)
    .where(eq(inventario.activo, true))
  
  // Clientes nuevos este mes
  const newClients = await db
    .select({ count: count() })
    .from(clientes)
    .where(gte(clientes.createdAt, firstDayOfMonth))
  
  const currentSales = Number(currentMonthSales[0]?.total || 0)
  const lastSales = Number(lastMonthSales[0]?.total || 0)
  const salesChange = lastSales > 0 ? ((currentSales - lastSales) / lastSales * 100).toFixed(1) : '0.0'
  
  return {
    sales: {
      value: currentSales,
      change: salesChange.startsWith('-') ? salesChange : `+${salesChange}`
    },
    orders: {
      value: Number(currentMonthOrders[0]?.count || 0),
      change: '+8.2' // Placeholder - calcularía comparación con mes anterior
    },
    products: {
      value: Number(activeProducts[0]?.count || 0),
      change: '+0' // Placeholder - calcularía cambio
    },
    clients: {
      value: Number(newClients[0]?.count || 0),
      change: '+0' // Placeholder - calcularía cambio
    }
  }
}

export async function getRecentOrders(limit: number = 10) {
  await requireAdmin()
  
  const orders = await db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      estado: pedidos.estado,
      total: pedidos.total,
      createdAt: pedidos.createdAt,
      clienteNombre: clientes.nombre
    })
    .from(pedidos)
    .leftJoin(clientes, eq(pedidos.clienteId, clientes.id))
    .orderBy(desc(pedidos.createdAt))
    .limit(limit)
  
  return orders.map(order => ({
    id: `#${order.numero}`,
    client: order.clienteNombre || 'Cliente',
    date: formatDate(order.createdAt),
    amount: formatCurrency(Number(order.total)),
    status: translateStatus(order.estado)
  }))
}

export async function getLowStockProducts() {
  await requireAdmin()
  
  const products = await db
    .select()
    .from(inventario)
    .where(and(
      eq(inventario.activo, true),
      sql`${inventario.stock} <= ${inventario.stockMinimo}`
    ))
    .limit(10)
  
  return products.map(p => ({
    name: p.nombre,
    sku: p.sku,
    stock: p.stock,
    price: formatCurrency(Number(p.precio))
  }))
}

export async function getPendingOrders() {
  await requireAdmin()
  
  const pending = await db
    .select({ count: count() })
    .from(pedidos)
    .where(eq(pedidos.estado, 'pendiente'))
  
  const preparing = await db
    .select({ count: count() })
    .from(pedidos)
    .where(eq(pedidos.estado, 'preparando'))
  
  return {
    total: Number(pending[0]?.count || 0) + Number(preparing[0]?.count || 0),
    pending: Number(pending[0]?.count || 0),
    preparing: Number(preparing[0]?.count || 0)
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-GT', { 
    style: 'currency', 
    currency: 'GTQ',
    minimumFractionDigits: 2
  }).format(value)
}

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return `Hoy, ${date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}`
  } else if (days === 1) {
    return `Ayer, ${date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}`
  } else {
    return date.toLocaleDateString('es-GT', { day: '2-digit', month: 'short' })
  }
}

function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pendiente': 'Pendiente',
    'confirmado': 'Confirmado',
    'preparando': 'Preparando',
    'enviado': 'Enviado',
    'entregado': 'Entregado',
    'cancelado': 'Cancelado'
  }
  return statusMap[status] || status
}
