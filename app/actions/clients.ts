'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { clientes } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

function normalizeNit(nit: string): string {
  return sanitizeString(nit).replace(/\s+/g, '').toUpperCase()
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export type ClientInput = {
  nombre: string
  telefono: string
  nit?: string
  email?: string
  empresa?: string
  direccion?: string
}

export async function upsertClient(input: ClientInput) {
  const nombre = sanitizeString(input.nombre || '')
  const telefono = sanitizeString(input.telefono || '')
  const nit = input.nit ? normalizeNit(input.nit) : ''
  const empresa = sanitizeString(input.empresa || '')
  const direccion = sanitizeString(input.direccion || '')
  const emailRaw = sanitizeString(input.email || '')

  if (!nombre || !telefono) {
    throw new Error('Nombre y teléfono son obligatorios')
  }
  if (nombre.length > 120 || telefono.length > 30) {
    throw new Error('Datos exceden longitud permitida')
  }
  if (nit && nit.length > 30) {
    throw new Error('NIT inválido')
  }

  const phoneDigits = telefono.replace(/\D/g, '')
  const email =
    emailRaw && validateEmail(emailRaw)
      ? emailRaw.toLowerCase()
      : `cliente+${nit || phoneDigits || randomUUID().slice(0, 8)}@registro.local`

  let existing: typeof clientes.$inferSelect[] = []

  if (nit) {
    existing = await db
      .select()
      .from(clientes)
      .where(eq(clientes.nit, nit))
      .limit(1)
  }

  if (!existing.length && emailRaw && validateEmail(emailRaw)) {
    existing = await db.select().from(clientes).where(eq(clientes.email, email)).limit(1)
  }

  if (!existing.length) {
    existing = await db
      .select()
      .from(clientes)
      .where(eq(clientes.telefono, telefono))
      .limit(1)
  }

  if (existing.length) {
    const id = existing[0].id
    await db
      .update(clientes)
      .set({
        nombre,
        telefono,
        nit: nit || existing[0].nit || null,
        email: emailRaw && validateEmail(emailRaw) ? email : existing[0].email,
        empresa: empresa || existing[0].empresa || null,
        direccion: direccion || existing[0].direccion || null,
      })
      .where(eq(clientes.id, id))

    revalidatePath('/admin')
    revalidatePath('/admin/clientes')
    return { success: true, id, created: false }
  }

  const id = randomUUID()
  await db.insert(clientes).values({
    id,
    nombre,
    email,
    telefono,
    nit: nit || null,
    empresa: empresa || null,
    direccion: direccion || null,
  })

  revalidatePath('/admin')
  revalidatePath('/admin/clientes')
  return { success: true, id, created: true }
}

export async function getClientByNit(nitRaw: string) {
  const nit = normalizeNit(nitRaw)
  if (!nit) throw new Error('NIT requerido')

  const rows = await db
    .select()
    .from(clientes)
    .where(eq(clientes.nit, nit))
    .limit(1)

  if (!rows.length) return null

  const c = rows[0]
  return {
    id: c.id,
    nombre: c.nombre,
    email: c.email,
    telefono: c.telefono,
    nit: c.nit,
    empresa: c.empresa,
    direccion: c.direccion,
  }
}

export async function listClientsForAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('No autorizado')

  const rows = await db.select().from(clientes).orderBy(asc(clientes.createdAt))
  return rows.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    email: c.email,
    telefono: c.telefono,
    nit: c.nit,
    empresa: c.empresa,
    direccion: c.direccion,
    createdAt: c.createdAt,
  }))
}
