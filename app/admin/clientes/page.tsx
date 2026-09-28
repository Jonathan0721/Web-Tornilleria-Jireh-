import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getClients } from '@/app/actions/orders'
import TornilleriaDashboard from '@/components/tornilleria-dashboard'

export default async function ClientesPage() {
  const session = await auth.api.getSession({
    headers: new Headers({ cookie: (await cookies()).toString() }),
  })
  if (!session) redirect('/sign-in')

  const clients = await getClients()
  return (
    <TornilleriaDashboard
      activeSection="Clientes"
      clients={clients.map((client) => ({
        id: client.id,
        name: client.nombre,
        email: client.email,
        phone: client.telefono || '',
        nit: client.nit || '',
        company: client.empresa || '',
        createdAt: client.createdAt.toLocaleDateString('es-GT'),
      }))}
    />
  )
}
