import 'server-only'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export async function getAdminSession(requestHeaders?: Headers) {
  const request = requestHeaders ?? await headers()
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail) return null

  const session = await auth.api.getSession({ headers: request })
  if (session?.user.email?.trim().toLowerCase() !== adminEmail) return null
  return session
}

export async function requireAdmin() {
  const session = await getAdminSession()
  if (!session?.user.email) throw new Error('No autorizado')
  return session.user.email
}

export async function requireAdminPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/sign-in')

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail || session.user.email?.trim().toLowerCase() !== adminEmail) redirect('/')
  return session
}
