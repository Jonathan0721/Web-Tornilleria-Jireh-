import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getOrders, updateOrderStatus } from '@/app/actions/orders'
import TornilleriaDashboard from '@/components/tornilleria-dashboard'

export default async function PedidosPage() {
  const session = await auth.api.getSession({
    headers: new Headers({ cookie: (await cookies()).toString() }),
  })
  if (!session) redirect('/sign-in')

  const orders = await getOrders()
  const recentOrders = orders.map((order) => ({
    id: order.id,
    number: order.numero,
    client: order.clienteNombre || 'Cliente',
    date: order.createdAt.toLocaleDateString('es-GT'),
    amount: new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(order.total),
    status: order.estado,
    phone: order.clienteTelefono || '',
  }))

  return <TornilleriaDashboard activeSection="Pedidos" recentOrders={recentOrders} updateOrderStatus={updateOrderStatus} />
}
