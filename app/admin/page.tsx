import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import TornilleriaDashboard from '@/components/tornilleria-dashboard'
import { db } from '@/lib/db'
import { inventario, pedidos, clientes } from '@/lib/db/schema'
import { desc, sql, eq, and, lt } from 'drizzle-orm'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const session = await auth.api.getSession({
    headers: new Headers({
      cookie: cookieStore.toString()
    })
  })

  if (!session) {
    redirect('/sign-in')
  }

  // Obtener datos reales de la base de datos
  const inventory = await db.select().from(inventario).orderBy(inventario.nombre)
  
  const allOrders = await db.select().from(pedidos).orderBy(desc(pedidos.createdAt)).limit(10)
  const recentOrders = allOrders
  
  const lowStockProducts = await db.select().from(inventario).where(lt(inventario.stock, inventario.stockMinimo))
  
  const pendingOrdersData = await db.select().from(pedidos).where(eq(pedidos.estado, 'pendiente'))
  const preparingOrdersData = await db.select().from(pedidos).where(eq(pedidos.estado, 'preparando'))
  
  const totalClients = await db.select({ count: sql<number>`count(*)` }).from(clientes)
  
  const stats = {
    sales: { value: 0, change: '+0%' }, // Calcular desde pedidos completados
    orders: { value: allOrders.length, change: '+0%' },
    products: { value: inventory.length, change: '+0' },
    clients: { value: totalClients[0]?.count || 0, change: '+0' }
  }
  
  const pendingOrders = {
    total: pendingOrdersData.length + preparingOrdersData.length,
    pending: pendingOrdersData.length,
    preparing: preparingOrdersData.length
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
