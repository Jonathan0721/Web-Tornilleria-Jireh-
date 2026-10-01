'use server'

import { requireAdmin, getAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { pedidos, pedidoItems, pedidoHistorial, clientes, inventario } from '@/lib/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { sendOrderConfirmationEmail, sendNewOrderNotificationToAdmin } from '@/lib/email'

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

  if (!clientName || !clientPhone || !Array.isArray(items) || items.length === 0) {
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

  // Calcular totales usando únicamente precio y stock confirmados en inventario.
  let subtotal = 0
  const orderItems: Array<{
    id: string
    inventarioId: string
    sku: string
    nombre: string
    cantidad: number
    cantidadReservada: number
    precioUnitario: number
    total: number
  }> = []
  let needsConfirmation = false
  const confirmationItems = new Map<string, string>()

  for (const item of items) {
    const sku = String(item.sku || item.id || '')
    if (!sku) throw new Error('Producto sin SKU')

    const [product] = await db
      .select()
      .from(inventario)
      .where(eq(inventario.sku, sku))
      .limit(1)

    const quantity = Number(item.quantity)
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 1_000_000) {
      throw new Error(`Cantidad inválida para ${sku}`)
    }
    if (!product || !product.activo) throw new Error(`El producto ${sku} ya no está disponible`)
    if (product.stock < quantity || Number(product.precio) <= 0) {
      const reason = [
        Number(product.precio) <= 0 ? 'precio pendiente' : '',
        product.stock < quantity ? `solicita ${quantity}, disponibilidad por confirmar` : '',
      ].filter(Boolean).join('; ')
      confirmationItems.set(sku, `${sku} (${reason})`)
      needsConfirmation = true
    }

    const unitPrice = Number(product.precio)
    const nombre = product.nombre

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error(`Precio inválido para ${sku}`)
    }

    const itemTotal = unitPrice * quantity
    subtotal += itemTotal

    orderItems.push({
      id: randomUUID(),
      inventarioId: product.id,
      sku,
      nombre,
      cantidad: quantity,
      cantidadReservada: 0,
      precioUnitario: unitPrice,
      total: itemTotal,
    })

  }

  const impuestos = subtotal * 0.12 // 12% IVA Guatemala
  const total = subtotal + impuestos

  // Generar número de pedido
  const orderCount = await db.select({ count: sql<number>`count(*)` }).from(pedidos)
  const orderNumber = `ORD-${String((orderCount[0]?.count || 0) + 1).padStart(4, '0')}`

  // Reservar inventario y crear el pedido en una sola transacción.
  const orderId = randomUUID()
  await db.transaction(async (tx) => {
    for (const item of orderItems) {
      const [reserved] = await tx.update(inventario)
        .set({ stock: sql`${inventario.stock} - ${item.cantidad}` })
        .where(and(
          eq(inventario.id, item.inventarioId),
          eq(inventario.activo, true),
          sql`${inventario.stock} >= ${item.cantidad}`,
        ))
        .returning({ id: inventario.id })
      if (reserved) {
        item.cantidadReservada = item.cantidad
      } else {
        const [currentProduct] = await tx.select({ activo: inventario.activo, stock: inventario.stock })
          .from(inventario)
          .where(eq(inventario.id, item.inventarioId))
          .limit(1)
        if (!currentProduct?.activo) throw new Error(`El producto ${item.sku} ya no está disponible`)
        confirmationItems.set(item.sku, `${item.sku} (solicita ${item.cantidad}, disponibilidad por confirmar)`)
        needsConfirmation = true
      }
    }

    const orderNotes = [
      notes,
      confirmationItems.size
        ? `PENDIENTE DE CONFIRMAR PRECIO/DISPONIBILIDAD: ${[...confirmationItems.values()].join(', ')}`
        : '',
    ].filter(Boolean).join('\n')

    await tx.insert(pedidos).values({
      id: orderId,
      numero: orderNumber,
      clienteId: clientId,
      estado: 'pendiente',
      subtotal: subtotal.toFixed(2),
      impuestos: impuestos.toFixed(2),
      total: total.toFixed(2),
      notas: orderNotes || null
    })
    await tx.insert(pedidoHistorial).values({
      id: randomUUID(),
      pedidoId: orderId,
      estadoAnterior: null,
      estadoNuevo: 'pendiente',
      cambiadoPor: 'Sistema',
    })

    for (const item of orderItems) {
      await tx.insert(pedidoItems).values({
        ...item,
        pedidoId: orderId,
        precioUnitario: item.precioUnitario.toFixed(2),
        total: item.total.toFixed(2),
      })
    }
  })

  revalidatePath('/admin')
  revalidatePath('/catalogo')

  // Enviar notificaciones por email
  try {
    // Email de confirmación al cliente
    if (clientEmailRaw && validateEmail(clientEmailRaw)) {
      await sendOrderConfirmationEmail(
        clientEmail,
        orderNumber,
        clientName,
        total,
        orderItems.map(item => ({
          name: item.nombre,
          quantity: item.cantidad,
          price: item.precioUnitario
        })),
        needsConfirmation
      )
    }

    // Notificación al admin
    await sendNewOrderNotificationToAdmin(
      orderNumber,
      clientName,
      clientEmail,
      total,
      needsConfirmation
    )
  } catch (emailError) {
    console.error('Error enviando emails:', emailError)
    // No fallar el pedido si los emails fallan
  }

  return { success: true, orderId, orderNumber, needsConfirmation }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const adminEmail = await requireAdmin()
  
  const validStatuses = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado']
  if (!validStatuses.includes(status)) {
    throw new Error('Estado inválido')
  }

  const order = await db.transaction(async (tx) => {
    const [currentOrder] = await tx
      .select({
        numero: pedidos.numero,
        estado: pedidos.estado,
        clienteNombre: clientes.nombre,
        clienteEmail: clientes.email,
        total: pedidos.total,
      })
      .from(pedidos)
      .leftJoin(clientes, eq(pedidos.clienteId, clientes.id))
      .where(eq(pedidos.id, orderId))
      .limit(1)

    if (!currentOrder) throw new Error('Pedido no encontrado')
    if (currentOrder.estado === status) return { ...currentOrder, changed: false }

    await tx.update(pedidos)
      .set({ estado: status })
      .where(eq(pedidos.id, orderId))
    await tx.insert(pedidoHistorial).values({
      id: randomUUID(),
      pedidoId: orderId,
      estadoAnterior: currentOrder.estado,
      estadoNuevo: status,
      cambiadoPor: adminEmail,
    })

    return { ...currentOrder, changed: true }
  })

  if (!order.changed) {
    revalidatePath('/admin')
    revalidatePath('/admin/pedidos')
    return { emailStatus: 'unchanged' as const }
  }

  let emailStatus: 'sent' | 'no-email' | 'not-configured' | 'failed' = 'no-email'
  const email = order.clienteEmail || ''
  if (email && !email.endsWith('@cliente.local')) {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      emailStatus = 'not-configured'
    } else {
    try {
      const { resend } = await import('@/lib/email')
      const escapeHtml = (value: string) =>
        value.replace(/[&<>"']/g, (character) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[character] || character)
      const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `Actualización del pedido ${order.numero} - TORNILLOS JEHOVA JIREH`,
        html: `<p>Hola ${escapeHtml(order.clienteNombre || 'cliente')},</p><p>El estado de tu pedido <strong>${escapeHtml(order.numero)}</strong> cambió a <strong>${escapeHtml(orderStatusLabels[status])}</strong>.</p><p>Total: Q ${Number(order.total).toFixed(2)}</p><p>Gracias por comprar con TORNILLOS JEHOVA JIREH.</p>`,
      })
      if (error) {
        emailStatus = 'failed'
        console.error('No se pudo enviar la actualización del pedido por correo:', error)
      } else emailStatus = 'sent'
    } catch (error) {
      emailStatus = 'failed'
      console.error('No se pudo enviar la actualización del pedido por correo:', error)
    }
    }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/pedidos')
  return { emailStatus }
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
    .orderBy(desc(pedidos.createdAt))

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
      clienteDireccion: clientes.direccion,
      clienteNit: clientes.nit,
      clienteCreatedAt: clientes.createdAt
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

  const history = await db
    .select({
      id: pedidoHistorial.id,
      estadoAnterior: pedidoHistorial.estadoAnterior,
      estadoNuevo: pedidoHistorial.estadoNuevo,
      cambiadoPor: pedidoHistorial.cambiadoPor,
      createdAt: pedidoHistorial.createdAt,
    })
    .from(pedidoHistorial)
    .where(eq(pedidoHistorial.pedidoId, orderId))
    .orderBy(desc(pedidoHistorial.createdAt))

  return {
    ...order[0],
    subtotal: Number(order[0].subtotal),
    impuestos: Number(order[0].impuestos),
    total: Number(order[0].total),
    items: items.map(item => ({
      ...item,
      precioUnitario: Number(item.precioUnitario),
      total: Number(item.total)
    })),
    history,
  }
}

export async function getClients() {
  await requireAdmin()

  return db.select().from(clientes).orderBy(desc(clientes.createdAt))
}

export async function deleteCancelledOrder(orderId: string) {
  await requireAdmin()

  await db.transaction(async (tx) => {
    const [order] = await tx
      .select({ id: pedidos.id, numero: pedidos.numero, estado: pedidos.estado })
      .from(pedidos)
      .where(eq(pedidos.id, orderId))
      .limit(1)

    if (!order) throw new Error('Pedido no encontrado')
    if (order.estado !== 'cancelado') throw new Error('Solo se pueden borrar pedidos cancelados')

    const items = await tx
      .select({
        inventarioId: pedidoItems.inventarioId,
        cantidadReservada: pedidoItems.cantidadReservada,
      })
      .from(pedidoItems)
      .where(eq(pedidoItems.pedidoId, orderId))

    for (const item of items) {
      if (!item.inventarioId) continue
      if (item.cantidadReservada === 0) continue
      await tx.update(inventario)
        .set({ stock: sql`${inventario.stock} + ${item.cantidadReservada}` })
        .where(eq(inventario.id, item.inventarioId))
    }

    await tx.delete(pedidoItems).where(eq(pedidoItems.pedidoId, orderId))
    await tx.delete(pedidoHistorial).where(eq(pedidoHistorial.pedidoId, orderId))
    await tx.delete(pedidos).where(eq(pedidos.id, orderId))
  })

  revalidatePath('/admin')
  revalidatePath('/admin/pedidos')
  revalidatePath('/admin/inventario')
  return { success: true }
}

const orderStatusLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export async function getClientByEmail(email: string) {
  const session = await getAdminSession()
  if (!session?.user) throw new Error('No autorizado')

  const client = await db
    .select()
    .from(clientes)
    .where(eq(clientes.email, email))
    .limit(1)

  return client[0] || null
}
