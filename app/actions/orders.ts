'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pedidos, pedidoItems, clientes, inventario } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { sendOrderConfirmationEmail, sendNewOrderNotificationToAdmin } from '@/lib/email'

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('No autorizado')
  if (!session.user.email) throw new Error('Email de usuario no válido')
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export async function createOrder(formData: FormData) {
  // Pedidos públicos desde el catálogo: no requieren login
  const clientName = sanitizeString(String(formData.get('clientName') || ''))
  const clientEmailRaw = sanitizeString(String(formData.get('clientEmail') || ''))
  const clientPhone = sanitizeString(String(formData.get('clientPhone') || ''))
  const clientNit = sanitizeString(String(formData.get('clientNit') || '')).replace(/\s+/g, '').toUpperCase()
  const clientCompany = sanitizeString(String(formData.get('clientCompany') || ''))
  const clientAddress = sanitizeString(String(formData.get('clientAddress') || ''))
  const notes = sanitizeString(String(formData.get('notes') || ''))

  const itemsJson = String(formData.get('items') || '[]')
  const items = JSON.parse(itemsJson)

  if (!clientName || !clientPhone || items.length === 0) {
    throw new Error('Datos de pedido incompletos o inválidos')
  }

  if (clientName.length > 100 || clientPhone.length > 30) {
    throw new Error('Datos exceden longitud permitida')
  }

  const phoneDigits = clientPhone.replace(/\D/g, '')
  const clientEmail =
    clientEmailRaw && validateEmail(clientEmailRaw)
      ? clientEmailRaw
      : `pedido+${phoneDigits || randomUUID().slice(0, 8)}@cliente.local`

  if (clientEmail.length > 100) {
    throw new Error('Datos exceden longitud permitida')
  }

  // Crear o buscar cliente (prioridad: NIT -> email -> teléfono)
  let clientId: string
  let existingClient = clientNit
    ? await db.select().from(clientes).where(eq(clientes.nit, clientNit)).limit(1)
    : []

  if (!existingClient.length) {
    existingClient = await db.select().from(clientes).where(eq(clientes.email, clientEmail)).limit(1)
  }
  if (!existingClient.length) {
    existingClient = await db.select().from(clientes).where(eq(clientes.telefono, clientPhone)).limit(1)
  }

  if (existingClient.length > 0) {
    clientId = existingClient[0].id
    await db.update(clientes)
      .set({
        nombre: clientName,
        telefono: clientPhone,
        nit: clientNit || existingClient[0].nit || null,
        empresa: clientCompany || existingClient[0].empresa || null,
        direccion: clientAddress || existingClient[0].direccion || null,
        email: clientEmailRaw && validateEmail(clientEmailRaw) ? clientEmail : existingClient[0].email,
      })
      .where(eq(clientes.id, clientId))
  } else {
    clientId = randomUUID()
    await db.insert(clientes).values({
      id: clientId,
      nombre: clientName,
      email: clientEmail,
      telefono: clientPhone,
      nit: clientNit || null,
      empresa: clientCompany || null,
      direccion: clientAddress || null,
    })
  }

  // Calcular totales (usa inventario si existe; si no, acepta precio del carrito)
  let subtotal = 0
  const orderItems = []

  for (const item of items) {
    const sku = String(item.sku || item.id || '')
    if (!sku) throw new Error('Producto sin SKU')

    const product = await db
      .select()
      .from(inventario)
      .where(eq(inventario.sku, sku))
      .limit(1)

    const quantity = Number(item.quantity) || 0
    if (quantity <= 0) throw new Error(`Cantidad inválida para ${sku}`)

    const unitPrice = product.length
      ? Number(product[0].precio)
      : Number(item.price)
    const nombre = product.length
      ? product[0].nombre
      : String(item.name || sku)

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error(`Precio inválido para ${sku}`)
    }

    const itemTotal = unitPrice * quantity
    subtotal += itemTotal

    orderItems.push({
      id: randomUUID(),
      pedidoId: '',
      inventarioId: product.length ? product[0].id : null,
      sku,
      nombre,
      cantidad: quantity,
      precioUnitario: unitPrice,
      total: itemTotal,
    })

    if (product.length) {
      await db
        .update(inventario)
        .set({ stock: Math.max(0, product[0].stock - quantity) })
        .where(eq(inventario.id, product[0].id))
    }
  }

  const impuestos = subtotal * 0.12 // 12% IVA Guatemala
  const total = subtotal + impuestos

  // Generar número de pedido
  const orderCount = await db.select({ count: sql<number>`count(*)` }).from(pedidos)
  const orderNumber = `ORD-${String((orderCount[0]?.count || 0) + 1).padStart(4, '0')}`

  // Crear pedido
  const orderId = randomUUID()
  await db.insert(pedidos).values({
    id: orderId,
    numero: orderNumber,
    clienteId: clientId,
    estado: 'pendiente',
    subtotal: subtotal.toFixed(2),
    impuestos: impuestos.toFixed(2),
    total: total.toFixed(2),
    notas: notes
  })

  // Crear items del pedido
  for (const item of orderItems) {
    item.pedidoId = orderId
    await db.insert(pedidoItems).values(item)
  }

  revalidatePath('/admin')
  revalidatePath('/catalogo')

  // Enviar notificaciones por email
  try {
    // Email de confirmación al cliente
    await sendOrderConfirmationEmail(
      clientEmail,
      orderNumber,
      clientName,
      total,
      orderItems.map(item => ({
        name: item.nombre,
        quantity: item.cantidad,
        price: item.precioUnitario
      }))
    )

    // Notificación al admin
    await sendNewOrderNotificationToAdmin(
      orderNumber,
      clientName,
      clientEmail,
      total
    )
  } catch (emailError) {
    console.error('Error enviando emails:', emailError)
    // No fallar el pedido si los emails fallan
  }

  return { success: true, orderId, orderNumber }
}

export async function updateOrderStatus(orderId: string, status: string) {
  await requireAdmin()
  
  const validStatuses = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado']
  if (!validStatuses.includes(status)) {
    throw new Error('Estado inválido')
  }

  await db.update(pedidos)
    .set({ estado: status })
    .where(eq(pedidos.id, orderId))

  revalidatePath('/admin')
}

export async function getOrders() {
  await requireAdmin()
  
  const orders = await db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      estado: pedidos.estado,
      subtotal: pedidos.subtotal,
      impuestos: pedidos.impuestos,
      total: pedidos.total,
      notas: pedidos.notas,
      createdAt: pedidos.createdAt,
      clienteNombre: clientes.nombre,
      clienteEmail: clientes.email,
      clienteTelefono: clientes.telefono
    })
    .from(pedidos)
    .leftJoin(clientes, eq(pedidos.clienteId, clientes.id))
    .orderBy(pedidos.createdAt)

  return orders.map(order => ({
    ...order,
    subtotal: Number(order.subtotal),
    impuestos: Number(order.impuestos),
    total: Number(order.total)
  }))
}

export async function getOrderById(orderId: string) {
  await requireAdmin()
  
  const order = await db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      estado: pedidos.estado,
      subtotal: pedidos.subtotal,
      impuestos: pedidos.impuestos,
      total: pedidos.total,
      notas: pedidos.notas,
      createdAt: pedidos.createdAt,
      clienteId: pedidos.clienteId,
      clienteNombre: clientes.nombre,
      clienteEmail: clientes.email,
      clienteTelefono: clientes.telefono,
      clienteEmpresa: clientes.empresa,
      clienteDireccion: clientes.direccion
    })
    .from(pedidos)
    .leftJoin(clientes, eq(pedidos.clienteId, clientes.id))
    .where(eq(pedidos.id, orderId))
    .limit(1)

  if (!order.length) return null

  const items = await db
    .select()
    .from(pedidoItems)
    .where(eq(pedidoItems.pedidoId, orderId))

  return {
    ...order[0],
    subtotal: Number(order[0].subtotal),
    impuestos: Number(order[0].impuestos),
    total: Number(order[0].total),
    items: items.map(item => ({
      ...item,
      precioUnitario: Number(item.precioUnitario),
      total: Number(item.total)
    }))
  }
}

export async function getClients() {
  await requireAdmin()
  
  return db.select().from(clientes).orderBy(clientes.createdAt)
}

export async function getClientByEmail(email: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('No autorizado')

  const client = await db
    .select()
    .from(clientes)
    .where(eq(clientes.email, email))
    .limit(1)

  return client[0] || null
}
