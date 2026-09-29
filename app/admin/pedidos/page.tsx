import { requireAdminPage } from '@/lib/admin-auth'
import { getOrderById, getOrders, updateOrderStatus } from '@/app/actions/orders'
import TornilleriaDashboard from '@/components/tornilleria-dashboard'

export default async function PedidosPage() {
  await requireAdminPage()

  const orders = await getOrders()
  const recentOrders = orders.map((order) => ({
    id: order.id,
    number: order.numero,
    client: order.clienteNombre || 'Cliente',
    date: order.createdAt.toLocaleDateString('es-GT'),
    amount: new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(order.total),
    status: order.estado,
    phone: order.clienteTelefono || '',
    email: order.clienteEmail || '',
  }))

  return <TornilleriaDashboard
    activeSection="Pedidos"
    recentOrders={recentOrders}
    updateOrderStatus={updateOrderStatus}
    getOrderById={getOrderById}
  />
}
