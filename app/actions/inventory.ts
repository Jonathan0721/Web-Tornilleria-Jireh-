'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { inventario } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

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

function validateUrl(url: string): boolean {
  if (!url) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function productFields(formData: FormData) {
  const name = sanitizeString(String(formData.get('name') || ''))
  const sku = sanitizeString(String(formData.get('sku') || '')).toUpperCase()
  const category = sanitizeString(String(formData.get('category') || ''))
  const tipo = sanitizeString(String(formData.get('tipo') || ''))
  const medidas = sanitizeString(String(formData.get('medidas') || ''))
  const imagen = sanitizeString(String(formData.get('imagen') || ''))
  const descripcion = sanitizeString(String(formData.get('descripcion') || ''))
  const descripcionDetallada = sanitizeString(String(formData.get('descripcionDetallada') || ''))
  const priceValue = formData.get('price')
  const stockValue = formData.get('stock')
  const price = priceValue === null || String(priceValue).trim() === '' ? Number.NaN : Number(priceValue)
  const stock = stockValue === null || String(stockValue).trim() === '' ? Number.NaN : Number(stockValue)
  const stockMinimoValue = formData.get('stockMinimo')
  const stockMinimo = stockMinimoValue === null ? 5 : String(stockMinimoValue).trim() === '' ? Number.NaN : Number(stockMinimoValue)
  const unidad = sanitizeString(String(formData.get('unidad') || ''))
  const mostrarSku = formData.get('mostrarSku') === 'on'
  const mostrarCategoria = formData.get('mostrarCategoria') === 'on'
  const mostrarPrecio = formData.get('mostrarPrecio') === 'on'
  const mostrarStock = formData.get('mostrarStock') === 'on'
  const mostrarTipo = formData.get('mostrarTipo') === 'on'
  const mostrarMedidas = formData.get('mostrarMedidas') === 'on'
  const mostrarDescripcion = formData.get('mostrarDescripcion') === 'on'
  const mostrarDescripcionDetallada = formData.get('mostrarDescripcionDetallada') === 'on'
  const mostrarImagen = formData.get('mostrarImagen') === 'on'

  if (!name || name.length < 2 || name.length > 200) throw new Error('Nombre de producto inválido (2-200 caracteres)')
  if (!sku || sku.length < 3 || sku.length > 50) throw new Error('SKU inválido (3-50 caracteres)')
  if (!category || category.length < 2 || category.length > 50) throw new Error('Categoría inválida (2-50 caracteres)')
  if (tipo.length > 30) throw new Error('Tipo inválido')
  if (medidas.length > 50) throw new Error('Medidas inválidas')
  if (!validateUrl(imagen)) throw new Error('La imagen debe usar una URL http o https válida')
  if (descripcion.length > 500) throw new Error('Descripción muy larga (máx 500 caracteres)')
  if (descripcionDetallada.length > 2000) throw new Error('Descripción detallada muy larga (máx 2000 caracteres)')
  if (!Number.isFinite(price) || price < 0 || price > 100000) throw new Error('Precio inválido (0-100000)')
  if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) throw new Error('Stock inválido (0-1000000)')
  if (!Number.isInteger(stockMinimo) || stockMinimo < 0 || stockMinimo > 1000000) throw new Error('Stock mínimo inválido (0-1000000)')
  if (!unidad || unidad.length > 20) throw new Error('Unidad inválida (máximo 20 caracteres)')

  return {
    nombre: name,
    sku,
    categoria: category,
    tipo: tipo || null,
    medidas: medidas || null,
    imagen: imagen || null,
    descripcion: descripcion || null,
    descripcionDetallada: descripcionDetallada || null,
    precio: price.toFixed(2),
    stock,
    stockMinimo,
    unidad,
    mostrarSku,
    mostrarCategoria,
    mostrarPrecio,
    mostrarStock,
    mostrarTipo,
    mostrarMedidas,
    mostrarDescripcion,
    mostrarDescripcionDetallada,
    mostrarImagen,
  }
}

export async function createProduct(formData: FormData) {
  await requireAdmin()
  const fields = productFields(formData)
  await db.insert(inventario).values({
    id: randomUUID(),
    ...fields,
    activo: formData.get('activo') !== 'off',
  })
  revalidatePath('/admin')
  revalidatePath('/admin/inventario')
  revalidatePath('/catalogo')
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin()
  const fields = productFields(formData)
  const active = formData.get('activo') === 'on'
  const [updated] = await db.update(inventario)
    .set({ ...fields, activo: active })
    .where(eq(inventario.id, id))
    .returning({ id: inventario.id, sku: inventario.sku })

  if (!updated) throw new Error('Producto no encontrado')
  revalidatePath('/admin')
  revalidatePath('/admin/inventario')
  revalidatePath('/catalogo')
  revalidatePath(`/producto/${updated.sku}`)
}

export async function deleteProduct(id: string) {
  await setProductActive(id, false)
}

export async function setProductActive(id: string, active: boolean) {
  await requireAdmin()
  const [updated] = await db.update(inventario)
    .set({ activo: active })
    .where(eq(inventario.id, id))
    .returning({ id: inventario.id })
  if (!updated) throw new Error('Producto no encontrado')
  revalidatePath('/admin')
  revalidatePath('/admin/inventario')
  revalidatePath('/catalogo')
}

export async function getProducts() {
  await requireAdmin()
  return db.select().from(inventario).where(eq(inventario.activo, true))
}

export async function getInventoryProducts() {
  await requireAdmin()
  return db.select().from(inventario).orderBy(inventario.nombre)
}
