'use server'

import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { clientes, documentoVentaItems, documentosVenta, inventario } from '@/lib/db/schema'
import { and, desc, eq, gte, ilike, or, sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

function clean(value: unknown, maxLength: number) {
  return String(value ?? '').trim().replace(/[<>]/g, '').slice(0, maxLength)
}

export async function searchInventoryForSales(rawQuery: string) {
  await requireAdmin()
  const query = clean(rawQuery, 80)
  if (query.length < 2) return []

  const pattern = `%${query.replace(/[%_\\]/g, '\\$&')}%`
  const products = await db.select({
    id: inventario.id,
    sku: inventario.sku,
    name: inventario.nombre,
    family: inventario.familia,
    measures: inventario.medidas,
    price: inventario.precio,
    stock: inventario.stock,
    unit: inventario.unidad,
    image: inventario.imagen,
  }).from(inventario).where(and(
    eq(inventario.activo, true),
    or(ilike(inventario.sku, pattern), ilike(inventario.nombre, pattern), ilike(inventario.medidas, pattern)),
  )).orderBy(inventario.sku).limit(20)

  return products.map((product) => ({ ...product, price: Number(product.price) }))
}

export async function lookupSalesCustomer(rawNit: string) {
  await requireAdmin()
  const nit = clean(rawNit, 30).replace(/\s+/g, '').toUpperCase()
  if (!nit) return null

  const [client] = await db.select().from(clientes).where(eq(clientes.nit, nit)).limit(1)
  if (!client) return null
  return {
    id: client.id,
    name: client.nombre,
    nit: client.nit || '',
    phone: client.telefono || '',
    email: client.email.endsWith('@ventas.local') ? '' : client.email,
    company: client.empresa || '',
    address: client.direccion || '',
  }
}

export type SalesQuoteInput = {
  customer: {
    name: string
    phone: string
    nit: string
    email?: string
    company?: string
    address?: string
  }
  notes?: string
  items: Array<{ sku: string; quantity: number; unitPrice: number }>
}

export async function createSalesQuote(input: SalesQuoteInput) {
  const adminEmail = await requireAdmin()
  const customer = {
    name: clean(input.customer?.name, 120),
    phone: clean(input.customer?.phone, 30),
    nit: clean(input.customer?.nit, 30).replace(/\s+/g, '').toUpperCase(),
    email: clean(input.customer?.email, 100).toLowerCase(),
    company: clean(input.customer?.company, 120),
    address: clean(input.customer?.address, 300),
  }
  const notes = clean(input.notes, 1000)

  if (!customer.name || !customer.phone || !customer.nit) {
    throw new Error('Nombre, teléfono y NIT son obligatorios.')
  }
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    throw new Error('El correo del cliente no es válido.')
  }
  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > 100) {
    throw new Error('Agrega entre 1 y 100 productos a la cotización.')
  }

  const seenSkus = new Set<string>()
  const lines: Array<{
    product: { id: string; sku: string; name: string }
    quantity: number
    unitPrice: number
    total: number
  }> = []
  let subtotal = 0
  for (const rawItem of input.items) {
    if (!rawItem || typeof rawItem !== 'object') throw new Error('La cotizacion contiene un producto invalido.')
    const sku = clean(rawItem.sku, 50).toUpperCase()
    const quantity = Number(rawItem.quantity)
    const unitPrice = Number(rawItem.unitPrice)
    if (!sku || seenSkus.has(sku)) throw new Error(`Código vacío o repetido: ${sku || 'sin código'}.`)
    seenSkus.add(sku)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1_000_000) {
      throw new Error(`Cantidad inválida para ${sku}.`)
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0 || unitPrice > 100_000) {
      throw new Error(`Ingresa un precio mayor que cero para ${sku}.`)
    }

    const [product] = await db.select({
      id: inventario.id,
      sku: inventario.sku,
      name: inventario.nombre,
      active: inventario.activo,
    }).from(inventario).where(eq(inventario.sku, sku)).limit(1)
    if (!product || !product.active) throw new Error(`El producto ${sku} no existe o no está activo.`)

    const total = Math.round(unitPrice * quantity * 100) / 100
    if (!Number.isFinite(total) || total > 9_999_999_999.99) {
      throw new Error(`El total de la linea ${sku} supera el maximo permitido.`)
    }
    subtotal += total
    if (subtotal > 9_999_999_999.99) throw new Error('El total de la cotizacion supera el maximo permitido.')
    lines.push({ product, quantity, unitPrice, total })
  }
  subtotal = Math.round(subtotal * 100) / 100
  const impuestos = Math.round(subtotal * 0.12 * 100) / 100
  const total = Math.round((subtotal + impuestos) * 100) / 100

  const id = randomUUID()
  const number = await db.transaction(async (tx) => {
    let [existingClient] = await tx.select().from(clientes)
      .where(eq(clientes.nit, customer.nit)).limit(1)
    if (!existingClient) {
      [existingClient] = await tx.select().from(clientes)
        .where(eq(clientes.telefono, customer.phone)).limit(1)
    }
    if (!existingClient && customer.email) {
      [existingClient] = await tx.select().from(clientes)
        .where(eq(clientes.email, customer.email)).limit(1)
    }

    let clientId: string
    if (existingClient) {
      clientId = existingClient.id
      await tx.update(clientes).set({
        nombre: customer.name,
        telefono: customer.phone,
        nit: customer.nit,
        email: customer.email || existingClient.email,
        empresa: customer.company || existingClient.empresa,
        direccion: customer.address || existingClient.direccion,
      }).where(eq(clientes.id, clientId))
    } else {
      clientId = randomUUID()
      const phoneDigits = customer.phone.replace(/\D/g, '')
      await tx.insert(clientes).values({
        id: clientId,
        nombre: customer.name,
        telefono: customer.phone,
        nit: customer.nit,
        email: customer.email || `cliente+${phoneDigits || clientId.slice(0, 8)}@ventas.local`,
        empresa: customer.company || null,
        direccion: customer.address || null,
      })
    }

    const sequence = await tx.execute(sql`SELECT nextval('public.documentos_venta_numero_seq') AS value`)
    const quoteNumber = `COT-${String(sequence.rows[0].value).padStart(6, '0')}`

    await tx.insert(documentosVenta).values({
      id,
      numeroCotizacion: quoteNumber,
      clienteId: clientId,
      estado: 'cotizacion',
      subtotal: subtotal.toFixed(2),
      impuestos: impuestos.toFixed(2),
      total: total.toFixed(2),
      notas: notes || null,
      creadoPor: adminEmail,
    })

    await tx.insert(documentoVentaItems).values(lines.map(({ product, quantity, unitPrice, total: lineTotal }) => ({
      id: randomUUID(),
      documentoId: id,
      inventarioId: product.id,
      sku: product.sku,
      nombre: product.name,
      cantidad: quantity,
      precioUnitario: unitPrice.toFixed(2),
      total: lineTotal.toFixed(2),
    })))
    return quoteNumber
  })

  revalidatePath('/admin/ventas')
  return { id, number, subtotal, impuestos, total }
}

export async function confirmSalesQuote(documentId: string) {
  await requireAdmin()
  const id = clean(documentId, 36)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('Identificador de cotizacion invalido.')
  }
  const nextNumber = await db.transaction(async (tx) => {
    const sequence = await tx.execute(sql`SELECT nextval('public.documentos_venta_numero_seq') AS value`)
    const receiptNumber = `CMP-${String(sequence.rows[0].value).padStart(6, '0')}`
    const [updated] = await tx.update(documentosVenta).set({
      estado: 'comprobante',
      numeroComprobante: receiptNumber,
      confirmadoAt: new Date(),
      updatedAt: new Date(),
    }).where(and(eq(documentosVenta.id, id), eq(documentosVenta.estado, 'cotizacion')))
      .returning({ id: documentosVenta.id })

    if (!updated) throw new Error('La cotización no existe o ya fue convertida en comprobante.')

    const items = await tx.select({
      id: documentoVentaItems.id,
      inventoryId: documentoVentaItems.inventarioId,
      sku: documentoVentaItems.sku,
      quantity: documentoVentaItems.cantidad,
    }).from(documentoVentaItems).where(eq(documentoVentaItems.documentoId, id))
      .orderBy(documentoVentaItems.inventarioId)

    let pendingQuantity = 0
    for (const item of items) {
      if (!item.inventoryId) {
        throw new Error(`El producto ${item.sku} fue eliminado del inventario; no se puede confirmar la venta.`)
      }
      const [current] = await tx.select({ stock: inventario.stock })
        .from(inventario)
        .where(and(eq(inventario.id, item.inventoryId), eq(inventario.activo, true)))
        .for('update')
        .limit(1)
      if (!current) throw new Error(`El producto ${item.sku} ya no esta activo en el inventario.`)

      const deducted = Math.min(item.quantity, Math.max(current.stock, 0))
      const [updatedInventory] = await tx.update(inventario)
        .set({ stock: sql`${inventario.stock} - ${deducted}`, updatedAt: new Date() })
        .where(and(eq(inventario.id, item.inventoryId), gte(inventario.stock, deducted)))
        .returning({ id: inventario.id })
      if (!updatedInventory) throw new Error(`No se pudo actualizar el inventario de ${item.sku}.`)
      await tx.update(documentoVentaItems)
        .set({ cantidadDescontada: deducted })
        .where(eq(documentoVentaItems.id, item.id))
      pendingQuantity += item.quantity - deducted
    }
    return { receiptNumber, pendingQuantity }
  })

  revalidatePath('/admin/ventas')
  revalidatePath('/admin/inventario')
  revalidatePath('/catalogo')
  return { number: nextNumber.receiptNumber, pendingQuantity: nextNumber.pendingQuantity }
}

export async function getSalesDocument(documentId: string) {
  await requireAdmin()
  const id = clean(documentId, 36)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null
  const [document] = await db.select({
    id: documentosVenta.id,
    quoteNumber: documentosVenta.numeroCotizacion,
    receiptNumber: documentosVenta.numeroComprobante,
    status: documentosVenta.estado,
    subtotal: documentosVenta.subtotal,
    taxes: documentosVenta.impuestos,
    total: documentosVenta.total,
    notes: documentosVenta.notas,
    createdAt: documentosVenta.createdAt,
    confirmedAt: documentosVenta.confirmadoAt,
    customerName: clientes.nombre,
    customerPhone: clientes.telefono,
    customerNit: clientes.nit,
    customerEmail: clientes.email,
    customerCompany: clientes.empresa,
    customerAddress: clientes.direccion,
  }).from(documentosVenta)
    .leftJoin(clientes, eq(documentosVenta.clienteId, clientes.id))
    .where(eq(documentosVenta.id, id)).limit(1)
  if (!document) return null

  const items = await db.select({
    sku: documentoVentaItems.sku,
    name: documentoVentaItems.nombre,
    quantity: documentoVentaItems.cantidad,
    quantityDeducted: documentoVentaItems.cantidadDescontada,
    unitPrice: documentoVentaItems.precioUnitario,
    total: documentoVentaItems.total,
  }).from(documentoVentaItems).where(eq(documentoVentaItems.documentoId, id))

  return {
    ...document,
    subtotal: Number(document.subtotal),
    taxes: Number(document.taxes),
    total: Number(document.total),
    createdAt: document.createdAt.toISOString(),
    confirmedAt: document.confirmedAt?.toISOString() || null,
    customerName: document.customerName || 'Cliente',
    customerPhone: document.customerPhone || '',
    customerNit: document.customerNit || '',
    customerEmail: document.customerEmail?.endsWith('@ventas.local') ? '' : document.customerEmail || '',
    customerCompany: document.customerCompany || '',
    customerAddress: document.customerAddress || '',
    items: items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
    })),
  }
}

export async function listSalesDocuments() {
  await requireAdmin()
  const rows = await db.select({
    id: documentosVenta.id,
    quoteNumber: documentosVenta.numeroCotizacion,
    receiptNumber: documentosVenta.numeroComprobante,
    status: documentosVenta.estado,
    total: documentosVenta.total,
    createdAt: documentosVenta.createdAt,
    customerName: clientes.nombre,
  }).from(documentosVenta)
    .leftJoin(clientes, eq(documentosVenta.clienteId, clientes.id))
    .orderBy(desc(documentosVenta.createdAt))
    .limit(50)
  return rows.map((row) => ({
    ...row,
    total: Number(row.total),
    createdAt: row.createdAt.toISOString(),
    customerName: row.customerName || 'Cliente',
  }))
}
