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
    new URL(url)
    return true
  } catch {
    return false
  }
}

export async function createProduct(formData: FormData) {
  await requireAdmin()
  const name = sanitizeString(String(formData.get('name') || ''))
  const sku = sanitizeString(String(formData.get('sku') || '')).toUpperCase()
  const category = sanitizeString(String(formData.get('category') || 'Tornillos'))
  const tipo = sanitizeString(String(formData.get('tipo') || ''))
  const medidas = sanitizeString(String(formData.get('medidas') || ''))
  const imagen = sanitizeString(String(formData.get('imagen') || ''))
  const descripcion = sanitizeString(String(formData.get('descripcion') || ''))
  const descripcionDetallada = sanitizeString(String(formData.get('descripcionDetallada') || ''))
  const price = Number(formData.get('price'))
  const stock = Number(formData.get('stock'))
  const unidad = sanitizeString(String(formData.get('unidad') || 'unidad'))
  
  // Validaciones mejoradas
  if (!name || name.length < 2 || name.length > 200) throw new Error('Nombre de producto inválido (2-200 caracteres)')
  if (!sku || sku.length < 3 || sku.length > 50) throw new Error('SKU inválido (3-50 caracteres)')
  if (!category || category.length < 2 || category.length > 50) throw new Error('Categoría inválida')
  if (tipo && tipo.length > 30) throw new Error('Tipo inválido')
  if (medidas && medidas.length > 50) throw new Error('Medidas inválidas')
  if (!validateUrl(imagen)) throw new Error('URL de imagen inválida')
  if (descripcion && descripcion.length > 500) throw new Error('Descripción muy larga (máx 500 caracteres)')
  if (descripcionDetallada && descripcionDetallada.length > 2000) throw new Error('Descripción detallada muy larga (máx 2000 caracteres)')
  if (!Number.isFinite(price) || price < 0 || price > 100000) throw new Error('Precio inválido (0-100000)')
  if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) throw new Error('Stock inválido (0-1000000)')
  if (!unidad || unidad.length < 1 || unidad.length > 20) throw new Error('Unidad inválida')
  
  await db.insert(inventario).values({ 
    id: randomUUID(), 
    sku, 
    nombre: name, 
    categoria: category, 
    tipo: tipo || null,
    medidas: medidas || null,
    imagen: imagen || null,
    descripcion: descripcion || null,
    descripcionDetallada: descripcionDetallada || null,
    precio: price.toFixed(2), 
    stock, 
    stockMinimo: 5, 
    unidad, 
    activo: true 
  })
  revalidatePath('/admin'); revalidatePath('/catalogo')
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin()
  const name = sanitizeString(String(formData.get('name') || ''))
  const price = Number(formData.get('price'))
  const stock = Number(formData.get('stock'))
  
  // Validaciones mejoradas
  if (!name || name.length < 2 || name.length > 200) throw new Error('Nombre de producto inválido (2-200 caracteres)')
  if (!Number.isFinite(price) || price < 0 || price > 100000) throw new Error('Precio inválido (0-100000)')
  if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) throw new Error('Stock inválido (0-1000000)')
  
  await db.update(inventario).set({ nombre: name, precio: price.toFixed(2), stock }).where(eq(inventario.id, id))
  revalidatePath('/admin'); revalidatePath('/catalogo')
}

export async function deleteProduct(id: string) {
  await requireAdmin()
  await db.delete(inventario).where(and(eq(inventario.id, id), eq(inventario.activo, true)))
  revalidatePath('/admin'); revalidatePath('/catalogo')
}

export async function getProducts() {
  await requireAdmin()
  return db.select().from(inventario).where(eq(inventario.activo, true))
}
