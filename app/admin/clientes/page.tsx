import { requireAdminPage } from '@/lib/admin-auth'
import { getClients } from '@/app/actions/orders'
import TornilleriaDashboard from '@/components/tornilleria-dashboard'

export default async function ClientesPage() {
  await requireAdminPage()

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
