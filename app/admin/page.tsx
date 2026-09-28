import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getOrders } from '@/app/actions/orders'
import TornilleriaDashboard from '@/components/tornilleria-dashboard'
import { db } from '@/lib/db'
import { inventario, clientes } from '@/lib/db/schema'
import { sql, lt } from 'drizzle-orm'

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect('/sign-in')
  }

  // Obtener datos reales de la base de datos
  const inventoryRows = await db.select().from(inventario).orderBy(inventario.nombre)
  const inventory = inventoryRows.map((product) => ({
    id: product.id,
    name: product.nombre,
    sku: product.sku,
    category: product.categoria,
    price: product.precio,
    stock: product.stock,
    tipo: product.tipo ?? undefined,
    medidas: product.medidas ?? undefined,
  }))

  const allOrders = await getOrders()
  const recentOrders = allOrders.slice(0, 10).map((order) => ({
    id: order.id,
    number: order.numero,
    client: order.clienteNombre || 'Cliente',
    date: order.createdAt.toLocaleDateString('es-GT'),
    amount: new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(order.total),
    status: order.estado,
    phone: order.clienteTelefono || '',
    email: order.clienteEmail || '',
  }))

  const lowStockProducts = inventoryRows
    .filter((product) => product.stock < product.stockMinimo)
    .map((product) => ({
      name: product.nombre,
      sku: product.sku,
      stock: product.stock,
      price: product.precio,
    }))

  const totalClients = await db.select({ count: sql<number>`count(*)` }).from(clientes)

  const stats = {
    sales: { value: 0, change: '+0%' }, // Calcular desde pedidos completados
    orders: { value: allOrders.length, change: '+0%' },
    products: { value: inventoryRows.length, change: '+0' },
    clients: { value: totalClients[0]?.count || 0, change: '+0' }
  }

  const pendingCount = allOrders.filter((order) => order.estado === 'pendiente').length
  const preparingCount = allOrders.filter((order) => order.estado === 'preparando').length
  const pendingOrders = {
    total: pendingCount + preparingCount,
    pending: pendingCount,
    preparing: preparingCount
  }

  return (
    <TornilleriaDashboard 
      userName={session.user.name || 'Administrador'}
      inventory={inventory}
      stats={stats}
      recentOrders={recentOrders}
      lowStockProducts={lowStockProducts}
      pendingOrders={pendingOrders}
      activeSection="Resumen"
    />
  )
}
