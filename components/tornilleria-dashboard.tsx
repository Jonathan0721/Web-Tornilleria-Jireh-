'use client'

import { useState, useTransition } from 'react'
import { signOut } from '@/lib/auth-client'
import { createProduct, updateProduct, setProductActive, deleteProduct } from '@/app/actions/inventory'
import { deleteCancelledOrder } from '@/app/actions/orders'
import { ProductImageField } from '@/components/product-image-field'
import type { getOrderById as GetOrderById, updateOrderStatus as UpdateOrderStatus } from '@/app/actions/orders'
import { 
  House, ClipboardList, PackageSearch, Box, Users, Settings, Trash2,
  Search, Bell, X, Menu, ArrowUpRight, ChevronDown, Plus, Truck,
  CircleDollarSign, ShoppingCart, SlidersHorizontal, ShieldCheck
} from 'lucide-react'

const navItems = [
  { label: 'Resumen', icon: House },
  { label: 'Pedidos', icon: ClipboardList },
  { label: 'Catálogo', icon: PackageSearch },
  { label: 'Inventario', icon: Box },
  { label: 'Clientes', icon: Users },
]

const orderStatusLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

type InventoryItem = {
  id: string
  name: string
  sku: string
  family: string
  category: string
  price: string
  stock: number
  stockMinimum: number
  unit: string
  tipo: string
  medidas: string
  description: string
  detailedDescription: string
  image: string
  active: boolean
  showSku: boolean
  showCategory: boolean
  showPrice: boolean
  showStock: boolean
  showTipo: boolean
  showMeasures: boolean
  showDescription: boolean
  showDetailedDescription: boolean
  showImage: boolean
}
type DashboardStats = { sales: { value: number; change: string }; orders: { value: number; change: string }; products: { value: number; change: string }; clients: { value: number; change: string } }
type RecentOrder = { id: string; number?: string; client: string; date: string; amount: string; status: string; phone?: string; email?: string }
type OrderDetail = NonNullable<Awaited<ReturnType<typeof GetOrderById>>>
type Client = { id: string; name: string; email: string; phone: string; nit: string; company: string; createdAt: string }
type LowStockProduct = { name: string; sku: string; stock: number; price: string }
type PendingOrdersData = { total: number; pending: number; preparing: number }

export function TornilleriaDashboard({ 
  userName = 'Administrador', 
  inventory = [],
  stats,
  recentOrders = [],
  clients = [],
  updateOrderStatus,
  getOrderById,
  lowStockProducts = [],
  pendingOrders,
  activeSection = 'Resumen'
}: { 
  userName?: string; 
  inventory?: InventoryItem[]
  stats?: DashboardStats
  recentOrders?: RecentOrder[]
  clients?: Client[]
  updateOrderStatus?: typeof UpdateOrderStatus
  getOrderById?: typeof GetOrderById
  lowStockProducts?: LowStockProduct[]
  pendingOrders?: PendingOrdersData
  activeSection?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null)
  const [editingInventory, setEditingInventory] = useState(false)
  const [inventoryError, setInventoryError] = useState('')
  const [orderStatuses, setOrderStatuses] = useState<Record<string, string>>({})
  const [orderNotices, setOrderNotices] = useState<Record<string, string>>({})
  const [deletedOrders, setDeletedOrders] = useState<Set<string>>(() => new Set())
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('todos')
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const whatsappPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '').replace(/^0/, '')
    return digits.startsWith('502') ? digits : `502${digits}`
  }

  const filteredOrders = recentOrders.filter((order) => {
    if (deletedOrders.has(order.id)) return false
    const term = orderSearch.trim().toLowerCase()
    const matchesSearch = !term || [order.number, order.client, order.phone, order.email]
      .some((value) => value?.toLowerCase().includes(term))
    const matchesStatus = orderStatusFilter === 'todos' || (orderStatuses[order.id] || order.status) === orderStatusFilter
    return matchesSearch && matchesStatus
  })

  const showOrderDetail = async (orderId: string) => {
    if (!getOrderById) return
    setDetailLoading(true)
    setDetailError('')
    try {
      const detail = await getOrderById(orderId)
      if (!detail) {
        setDetailError('No se encontró ese pedido.')
        return
      }
      setSelectedOrder(detail)
    } catch {
      setDetailError('No se pudo cargar el detalle del pedido.')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-card px-5 py-6 transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><span className="font-mono text-lg font-bold">TJ</span></div>
            <div><p className="font-semibold tracking-tight">TORNILLOS JEHOVA JIREH</p></div>
          </div>
          <a href="/" className="mt-3 flex items-center gap-2 px-2 text-xs font-medium text-primary hover:underline">Ver tienda <ArrowUpRight className="size-3" /></a>
          <button onClick={() => setMobileOpen(false)} className="text-muted-foreground lg:hidden" aria-label="Cerrar menú"><X /></button>
        </div>
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Gestión</p>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ label, icon: Icon }) => {
            const href = label === 'Resumen' ? '/admin' : label === 'Pedidos' ? '/admin/pedidos' : label === 'Catálogo' ? '/admin/catalogo' : label === 'Inventario' ? '/admin/inventario' : '/admin/clientes'
            return <a key={label} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${activeSection === label ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><span className="flex items-center gap-3"><Icon className="size-[18px]" />{label}</span>{label === 'Pedidos' && pendingOrders && <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{pendingOrders.total}</span>}</a>
          })}
        </nav>
        <p className="mb-3 mt-10 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Cuenta</p>
        <nav className="flex flex-col gap-1"><button onClick={() => setSettingsOpen(true)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Settings className="size-[18px]" />Configuración</button></nav>
        <div className="mt-auto rounded-xl bg-muted p-4"><p className="text-xs font-medium">¿Necesitas ayuda?</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Estamos disponibles para ayudarte con tus pedidos.</p><button className="mt-3 text-xs font-semibold text-primary">Contactar soporte <ArrowUpRight className="ml-1 inline size-3" /></button></div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur md:px-10">
          <button onClick={() => setMobileOpen(true)} className="mr-3 text-muted-foreground lg:hidden" aria-label="Abrir menú"><Menu /></button>
          <div className="relative hidden max-w-md flex-1 md:block"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pedidos, productos..." className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm outline-none ring-primary transition focus:ring-2" /></div>
          <div className="ml-auto flex items-center gap-4"><button onClick={() => setNotificationsOpen(true)} className="relative text-muted-foreground hover:text-foreground" aria-label="Notificaciones"><Bell className="size-5" /><span className="absolute -right-1 -top-1 size-2 rounded-full bg-primary" /></button><div className="h-7 w-px bg-border" /><button onClick={() => signOut({ fetchOptions: { onSuccess: () => window.location.assign('/sign-in') } })} className="flex items-center gap-3 text-left" aria-label="Cerrar sesión"><div className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold">{userName.slice(0, 2).toUpperCase()}</div><span className="hidden text-sm md:block"><strong className="block font-medium">{userName}</strong><small className="text-muted-foreground">Administrador · Salir</small></span><ChevronDown className="hidden size-4 text-muted-foreground md:block" /></button></div>
        </header>

        <main className="mx-auto max-w-[1440px] px-5 py-8 md:px-10">
          {activeSection === 'Resumen' && (
            <>
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat('es-GT', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      timeZone: 'America/Guatemala',
                    }).format(new Date()).replace(/^./, (letter) => letter.toLocaleUpperCase('es-GT'))}
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight">Buenos días, {userName}</h1>
                  <p className="mt-1 text-muted-foreground">Esto es lo que está pasando en tu negocio hoy.</p>
                </div>
                <a href="/admin/inventario" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
                  <Plus className="size-4" /> Nuevo producto
                </a>
              </div>
              
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Ventas del mes', value: stats ? `Q ${stats.sales.value.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Q 0.00', change: stats?.sales.change || '+0%', icon: CircleDollarSign },
                  { label: 'Pedidos recibidos', value: stats?.orders.value.toString() || '0', change: stats?.orders.change || '+0%', icon: ShoppingCart },
                  { label: 'Productos activos', value: stats?.products.value.toLocaleString('es-GT') || '0', change: stats?.products.change || '+0', icon: Box },
                  { label: 'Clientes nuevos', value: stats?.clients.value.toString() || '0', change: stats?.clients.change || '+0', icon: Users }
                ].map(({ label, value, change, icon: Icon }) => (
                  <div key={label} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <Icon className="size-5 text-muted-foreground" />
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <p className="text-2xl font-semibold tracking-tight">{value}</p>
                      <span className="text-xs font-medium text-primary">{change}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">vs. mes anterior</p>
                  </div>
                ))}
              </section>

              <section className="mt-6 grid gap-6 xl:grid-cols-2">
                <div className="rounded-xl border border-border bg-primary p-6 text-primary-foreground">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold">Pedidos pendientes</h2>
                      <p className="mt-1 text-sm opacity-70">Requieren tu atención</p>
                    </div>
                    <Truck className="size-5 opacity-70" />
                  </div>
                  <p className="mt-9 text-5xl font-semibold">{pendingOrders?.total || 0}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-primary-foreground/20 pt-4 text-sm">
                    <span className="opacity-70">{pendingOrders?.pending || 0} por preparar</span>
                    <span className="opacity-70">{pendingOrders?.preparing || 0} por enviar</span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold">Inventario crítico</h2>
                      <p className="mt-1 text-sm text-muted-foreground">Productos con pocas unidades</p>
                    </div>
                    <a href="/admin/inventario" className="text-sm font-medium text-primary hover:underline">Ver todo</a>
                  </div>
                  <div className="mt-4 flex flex-col">
                    {lowStockProducts.length > 0 ? lowStockProducts.slice(0, 3).map((product) => (
                      <div key={product.sku} className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 last:border-0">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{product.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">SKU: {product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{product.stock} uds.</p>
                          <p className="mt-1 text-xs text-muted-foreground">{product.price} / ud.</p>
                        </div>
                      </div>
                    )) : (
                      <div className="px-6 py-8 text-center text-muted-foreground">No hay productos con stock crítico</div>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}

          {activeSection === 'Pedidos' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight">Pedidos</h1>
                <p className="mt-2 text-muted-foreground">Gestiona todos los pedidos de tus clientes</p>
              </div>
              <div className="rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border p-6">
                  <div>
                    <h2 className="font-semibold">Todos los pedidos</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Historial completo de pedidos</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
                  <input
                    value={orderSearch}
                    onChange={(event) => setOrderSearch(event.target.value)}
                    placeholder="Buscar por pedido, cliente, teléfono o correo"
                    aria-label="Buscar pedidos"
                    className="h-11 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
                  />
                  <select
                    value={orderStatusFilter}
                    onChange={(event) => setOrderStatusFilter(event.target.value)}
                    aria-label="Filtrar pedidos por estado"
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="todos">Todos los estados</option>
                    {Object.entries(orderStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                {detailError ? <p role="alert" className="border-b border-border px-4 py-3 text-sm text-destructive">{detailError}</p> : null}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3 font-medium">Pedido</th>
                        <th className="px-6 py-3 font-medium">Cliente</th>
                        <th className="px-6 py-3 font-medium">Importe</th>
                        <th className="px-6 py-3 font-medium">Estado y contacto</th>
                        <th className="px-6 py-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                        const currentStatus = orderStatuses[order.id] || order.status
                        const statusLabel = orderStatusLabels[currentStatus] || currentStatus
                        const whatsappMessage = `Hola ${order.client}, te actualizamos sobre tu pedido ${order.number || order.id}: ${currentStatus === 'preparando' ? 'ya estamos preparando tu pedido' : currentStatus === 'enviado' ? 'tu pedido ya fue enviado' : `su estado es ${statusLabel.toLowerCase()}`}. - TORNILLOS JEHOVA JIREH.`
                        return (
                        <tr key={order.id} className="border-t border-border">
                          <td className="whitespace-nowrap px-6 py-4 font-medium">
                            {order.number || order.id}
                            <span className="block text-xs font-normal text-muted-foreground">{order.date}</span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{order.client}</td>
                          <td className="whitespace-nowrap px-6 py-4 font-medium">{order.amount}</td>
                          <td className="min-w-64 px-6 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                aria-label={`Estado de ${order.id}`}
                                value={currentStatus}
                                disabled={!updateOrderStatus || isPending}
                                onChange={(event) => {
                                  const nextStatus = event.target.value
                                  startTransition(async () => {
                                    try {
                                      const result = await updateOrderStatus?.(order.id, nextStatus)
                                      setOrderStatuses((current) => ({ ...current, [order.id]: nextStatus }))
                                      const notice = result?.emailStatus === 'unchanged'
                                        ? 'El pedido ya tenía ese estado.'
                                        : result?.emailStatus === 'sent'
                                        ? 'Estado guardado y correo enviado.'
                                        : result?.emailStatus === 'failed'
                                          ? 'Estado guardado; falló el correo. Revisa Resend o avisa por WhatsApp.'
                                          : result?.emailStatus === 'not-configured'
                                            ? 'Estado guardado; configura un remitente verificado en Resend para enviar correo.'
                                            : 'Estado guardado. El cliente no tiene correo; puedes avisarle por WhatsApp.'
                                      setOrderNotices((current) => ({ ...current, [order.id]: notice }))
                                    } catch {
                                      setOrderNotices((current) => ({ ...current, [order.id]: 'No se pudo guardar el estado. Intenta de nuevo.' }))
                                    }
                                  })
                                }}
                                className="min-h-10 rounded-lg border border-input bg-background px-2 text-xs"
                              >
                                {Object.entries(orderStatusLabels).map(([value, label]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                              {order.phone ? (
                                <a
                                  href={`https://wa.me/${whatsappPhone(order.phone)}?text=${encodeURIComponent(whatsappMessage)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex min-h-10 items-center rounded-lg border border-input px-3 text-xs font-medium hover:bg-muted"
                                >
                                  Avisar por WhatsApp
                                </a>
                              ) : <span className="text-xs text-muted-foreground">Sin teléfono</span>}
                            </div>
                              {order.email && !order.email.endsWith('@cliente.local')
                                ? <p className="mt-2 text-xs text-muted-foreground">{order.email}</p>
                                : null}
                              {orderNotices[order.id] ? <p role="status" className="mt-2 text-xs text-muted-foreground">{orderNotices[order.id]}</p> : null}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void showOrderDetail(order.id)}
                                disabled={!getOrderById || detailLoading}
                                className="min-h-10 rounded-lg border border-input px-3 text-xs font-medium hover:bg-muted disabled:opacity-50"
                              >
                                {detailLoading ? 'Cargando...' : 'Ver detalle'}
                              </button>
                              {currentStatus === 'cancelado' && (
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => {
                                    if (!confirm(`¿Eliminar definitivamente el pedido ${order.number || order.id}? Se devolverán al inventario las cantidades de sus productos.`)) return
                                    startTransition(async () => {
                                      try {
                                        await deleteCancelledOrder(order.id)
                                        setDeletedOrders((current) => new Set(current).add(order.id))
                                      } catch (error) {
                                        setOrderNotices((current) => ({
                                          ...current,
                                          [order.id]: error instanceof Error ? error.message : 'No se pudo eliminar el pedido.',
                                        }))
                                      }
                                    })
                                  }}
                                  className="min-h-10 rounded-lg border border-destructive/50 px-3 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                                >
                                  Eliminar prueba
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        )
                      }) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                            {recentOrders.length ? 'No hay pedidos que coincidan con la búsqueda o el filtro.' : 'No hay pedidos registrados'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeSection === 'Inventario' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight">Inventario</h1>
                <p className="mt-2 text-muted-foreground">Gestiona tu catálogo de productos</p>
              </div>
              
              <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
                <div className="flex flex-col sm:flex-wrap sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">Gestionar inventario</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Agrega y edita productos</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['todos', ...new Set([...inventory.map((item) => item.tipo).filter(Boolean), 'galvanizado', 'grado5', 'grado8', 'seguridad', 'acero_inoxidable', 'zincado'])].map((tipo) => (
                      <button
                        key={tipo}
                        onClick={() => setTipoFilter(tipo)}
                        className={`px-3 py-1.5 text-xs rounded-full min-h-[44px] cursor-pointer ${tipoFilter === tipo ? 'bg-primary text-primary-foreground' : 'border border-input text-muted-foreground hover:bg-muted active:bg-muted/80 transition-colors'}`}
                      >
                        {tipo === 'todos' ? 'Todos' : tipo === 'galvanizado' ? 'Galvanizado' : tipo === 'grado5' ? 'Grado 5' : tipo === 'grado8' ? 'Grado 8' : tipo === 'seguridad' ? 'Seguridad' : tipo === 'acero_inoxidable' ? 'Inoxidable' : tipo === 'zincado' ? 'Zincado' : tipo}
                      </button>
                    ))}
                  </div>
                  <form onSubmit={(event) => {
                    event.preventDefault()
                    const formData = new FormData(event.currentTarget)
                    setInventoryError('')
                    if (formData.get('imagenSubiendo')) {
                      setInventoryError('Espera a que termine de subir la imagen antes de guardar.')
                      return
                    }
                    startTransition(async () => {
                      try {
                        await createProduct(formData)
                        window.location.reload()
                      } catch (error) {
                        setInventoryError(error instanceof Error ? error.message : 'No se pudo agregar el producto')
                      }
                    })
                  }} className="flex flex-col gap-3 w-full">
                    {inventoryError && !selectedInventory && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{inventoryError}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input name="name" required placeholder="Nombre del producto" className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                      <input name="sku" required placeholder="SKU" className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                    </div>
                    <input name="familia" maxLength={120} placeholder="Familia (ej.: Tornillo hexagonal · Rosca ordinaria · Grado 5)" className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                    <p className="text-xs text-muted-foreground">Usa exactamente el mismo nombre de familia en todas las medidas para que aparezcan juntas en el catálogo.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input name="category" required placeholder="Categoría" className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                      <select name="tipo" className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Tipo (opcional)</option>
                        <option value="galvanizado">Galvanizado</option>
                        <option value="grado5">Grado 5</option>
                        <option value="grado8">Grado 8</option>
                        <option value="seguridad">Seguridad</option>
                        <option value="acero_inoxidable">Acero inoxidable</option>
                        <option value="zincado">Zincado</option>
                      </select>
                    </div>
                    <input name="medidas" placeholder="Medidas (ej: M8 x 40, 1/2-13)" className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                    <ProductImageField />
                    <textarea name="descripcion" placeholder="Descripción corta" className="h-20 rounded-md border border-input bg-background px-3 text-sm resize-none" />
                    <textarea name="descripcionDetallada" placeholder="Descripción detallada (especificaciones técnicas)" className="h-24 rounded-md border border-input bg-background px-3 text-sm resize-none" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input name="price" required type="number" min="0" step="0.01" placeholder="Precio Q" className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                      <input name="stock" required type="number" min="0" step="1" placeholder="Stock" className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                      <input name="unidad" required placeholder="Unidad" className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                    </div>
                    <input name="stockMinimo" type="number" min="0" step="1" defaultValue="5" placeholder="Stock mínimo" className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                    <fieldset className="rounded-lg border border-border p-3">
                      <legend className="px-1 text-sm font-medium">Información visible para clientes</legend>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {[
                          ['mostrarImagen', 'Imagen'],
                          ['mostrarSku', 'Código / SKU'],
                          ['mostrarCategoria', 'Categoría'],
                          ['mostrarPrecio', 'Precio en catálogo y ficha'],
                          ['mostrarStock', 'Cantidad disponible'],
                          ['mostrarTipo', 'Tipo'],
                          ['mostrarMedidas', 'Medidas'],
                          ['mostrarDescripcion', 'Descripción corta'],
                          ['mostrarDescripcionDetallada', 'Detalles técnicos'],
                        ].map(([field, label]) => (
                          <label key={field} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <input type="checkbox" name={field} defaultChecked className="size-4" /> {label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <button disabled={isPending} className="w-full h-10 min-h-[44px] rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer">
                      {isPending ? 'Guardando...' : 'Agregar producto'}
                    </button>
                  </form>
                </div>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-xs text-muted-foreground">
                      <tr>
                        <th className="pb-3">Producto</th>
                        <th className="pb-3">SKU</th>
                        <th className="pb-3">Tipo</th>
                        <th className="pb-3">Medidas</th>
                        <th className="pb-3">Precio Q</th>
                        <th className="pb-3">Stock</th>
                        <th className="pb-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.filter(item => tipoFilter === 'todos' || item.tipo === tipoFilter).map((item) => (
                        <tr key={item.id} className={`border-b border-border last:border-0 ${item.active ? '' : 'opacity-60'}`}>
                          <td className="py-3 font-medium">
                            <button type="button" onClick={() => { setSelectedInventory(item); setEditingInventory(false); setInventoryError('') }} className="text-left hover:text-primary hover:underline">
                              {item.name}
                            </button>
                            {!item.active && <span className="ml-2 text-xs text-muted-foreground">Inactivo</span>}
                          </td>
                          <td className="py-3 text-muted-foreground">{item.sku}</td>
                          <td className="py-3 text-xs text-muted-foreground">{item.tipo || '-'}</td>
                          <td className="py-3 text-xs text-muted-foreground">{item.medidas || '-'}</td>
                          <td className="py-3">{`Q ${Number(item.price).toFixed(2)}`}</td>
                          <td className="py-3">{item.stock} {item.unit}</td>
                          <td className="py-3 text-right">
                            <button type="button" onClick={() => { setSelectedInventory(item); setEditingInventory(true); setInventoryError('') }} className="text-primary hover:underline text-xs px-2 py-1.5 min-h-[44px] cursor-pointer">
                              Editar
                            </button>
                            <button onClick={() => { if (confirm(item.active ? '¿Desactivar este producto del catálogo?' : '¿Reactivar este producto?')) startTransition(async () => {
                              try {
                                await setProductActive(item.id, !item.active)
                                window.location.reload()
                              } catch (error) {
                                setInventoryError(error instanceof Error ? error.message : 'No se pudo actualizar el producto')
                              }
                            }) }} className="text-muted-foreground hover:underline text-xs px-2 py-1.5 min-h-[44px] cursor-pointer">
                              {item.active ? 'Desactivar' : 'Reactivar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!confirm(`¿Eliminar definitivamente "${item.name}" (${item.sku})? Esta acción no se puede deshacer. Los pedidos anteriores conservarán su detalle.`)) return
                                startTransition(async () => {
                                  try {
                                    await deleteProduct(item.id)
                                    if (selectedInventory?.id === item.id) setSelectedInventory(null)
                                    window.location.reload()
                                  } catch (error) {
                                    setInventoryError(error instanceof Error ? error.message : 'No se pudo eliminar el producto')
                                  }
                                })
                              }}
                              disabled={isPending}
                              className="inline-flex min-h-[44px] items-center gap-1 px-2 py-1.5 text-xs text-destructive hover:underline disabled:opacity-50"
                            >
                              <Trash2 className="size-3.5" />
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!inventory.length && (
                        <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Todavía no hay productos. Agrégalos con el formulario anterior.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
              {selectedInventory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={editingInventory ? 'Editar producto' : 'Detalle del producto'}>
                  <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-xl sm:p-7">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold">{editingInventory ? 'Editar producto' : selectedInventory.name}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Código: {selectedInventory.sku}</p>
                      </div>
                      <button type="button" onClick={() => setSelectedInventory(null)} aria-label="Cerrar" className="rounded p-2 hover:bg-muted"><X className="size-5" /></button>
                    </div>
                    {inventoryError && <p role="alert" className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{inventoryError}</p>}
                    {!editingInventory ? (
                      <div className="space-y-4">
                        {selectedInventory.image && <img src={selectedInventory.image} alt={selectedInventory.name} className="max-h-56 w-full rounded-lg bg-muted object-contain" />}
                        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div><dt className="text-xs text-muted-foreground">Categoría</dt><dd>{selectedInventory.category}</dd></div>
                          <div><dt className="text-xs text-muted-foreground">Familia</dt><dd>{selectedInventory.family || 'Sin agrupar'}</dd></div>
                          <div><dt className="text-xs text-muted-foreground">Precio</dt><dd>Q {Number(selectedInventory.price).toFixed(2)} / {selectedInventory.unit}</dd></div>
                          <div><dt className="text-xs text-muted-foreground">Tipo</dt><dd>{selectedInventory.tipo || 'Sin especificar'}</dd></div>
                          <div><dt className="text-xs text-muted-foreground">Medidas</dt><dd>{selectedInventory.medidas || 'Sin especificar'}</dd></div>
                          <div><dt className="text-xs text-muted-foreground">Existencias</dt><dd>{selectedInventory.stock} {selectedInventory.unit} (mínimo: {selectedInventory.stockMinimum})</dd></div>
                          <div><dt className="text-xs text-muted-foreground">Estado</dt><dd>{selectedInventory.active ? 'Activo en catálogo' : 'Inactivo'}</dd></div>
                        </dl>
                        <div>
                          <h3 className="text-sm font-medium">Visibilidad en la tienda</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {[
                              selectedInventory.showImage && 'imagen',
                              selectedInventory.showSku && 'código',
                              selectedInventory.showCategory && 'categoría',
                              selectedInventory.showPrice && 'precio',
                              selectedInventory.showStock && 'stock',
                              selectedInventory.showTipo && 'tipo',
                              selectedInventory.showMeasures && 'medidas',
                              selectedInventory.showDescription && 'descripción',
                              selectedInventory.showDetailedDescription && 'detalles técnicos',
                            ].filter(Boolean).join(', ') || 'Sin información adicional visible'}
                          </p>
                        </div>
                        <div><h3 className="text-sm font-medium">Descripción</h3><p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{selectedInventory.description || 'Sin descripción'}</p></div>
                        <div><h3 className="text-sm font-medium">Detalles técnicos</h3><p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{selectedInventory.detailedDescription || 'Sin detalles técnicos'}</p></div>
                        <button type="button" onClick={() => setEditingInventory(true)} className="min-h-[44px] rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Editar producto</button>
                      </div>
                    ) : (
                      <form onSubmit={(event) => {
                        event.preventDefault()
                        const formData = new FormData(event.currentTarget)
                        if (formData.get('imagenSubiendo')) {
                          setInventoryError('Espera a que termine de subir la imagen antes de guardar.')
                          return
                        }
                        startTransition(async () => {
                          try {
                            await updateProduct(selectedInventory.id, formData)
                            window.location.reload()
                          } catch (error) {
                            setInventoryError(error instanceof Error ? error.message : 'No se pudo guardar el producto')
                          }
                        })
                      }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="text-sm">Nombre<input name="name" required maxLength={200} defaultValue={selectedInventory.name} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" /></label>
                        <label className="text-sm">Código / SKU<input name="sku" required maxLength={50} defaultValue={selectedInventory.sku} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" /></label>
                        <label className="text-sm sm:col-span-2">Familia<input name="familia" maxLength={120} defaultValue={selectedInventory.family} placeholder="Ej.: Tornillo hexagonal · Rosca ordinaria · Grado 5" className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" /><span className="mt-1 block text-xs text-muted-foreground">Todas las variantes que compartan este nombre se agruparán en el catálogo.</span></label>
                        <label className="text-sm">Categoría<input name="category" required maxLength={50} defaultValue={selectedInventory.category} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" /></label>
                        <label className="text-sm">Tipo<input name="tipo" maxLength={30} defaultValue={selectedInventory.tipo} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" /></label>
                        <label className="text-sm">Medidas<input name="medidas" maxLength={50} defaultValue={selectedInventory.medidas} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" /></label>
                        <ProductImageField key={selectedInventory.id} initialUrl={selectedInventory.image} />
                        <label className="text-sm">Precio (Q)<input name="price" required type="number" min="0" step="0.01" defaultValue={selectedInventory.price} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" /></label>
                        <label className="text-sm">Existencias<input name="stock" required type="number" min="0" step="1" defaultValue={selectedInventory.stock} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" /></label>
                        <label className="text-sm">Stock mínimo<input name="stockMinimo" required type="number" min="0" step="1" defaultValue={selectedInventory.stockMinimum} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" /></label>
                        <label className="text-sm">Unidad<input name="unidad" required maxLength={20} defaultValue={selectedInventory.unit} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" /></label>
                        <label className="text-sm sm:col-span-2">Descripción corta<textarea name="descripcion" maxLength={500} defaultValue={selectedInventory.description} className="mt-1 min-h-20 w-full rounded-md border border-input bg-background p-3" /></label>
                        <label className="text-sm sm:col-span-2">Descripción detallada / especificaciones<textarea name="descripcionDetallada" maxLength={2000} defaultValue={selectedInventory.detailedDescription} className="mt-1 min-h-28 w-full rounded-md border border-input bg-background p-3" /></label>
                        <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="activo" defaultChecked={selectedInventory.active} className="size-4" /> Disponible en el catálogo de clientes</label>
                        <fieldset className="rounded-lg border border-border p-3 sm:col-span-2">
                          <legend className="px-1 text-sm font-medium">Información visible para clientes</legend>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {[
                              ['mostrarImagen', 'Imagen', selectedInventory.showImage],
                              ['mostrarSku', 'Código / SKU', selectedInventory.showSku],
                              ['mostrarCategoria', 'Categoría', selectedInventory.showCategory],
                              ['mostrarPrecio', 'Precio en catálogo y ficha', selectedInventory.showPrice],
                              ['mostrarStock', 'Cantidad disponible', selectedInventory.showStock],
                              ['mostrarTipo', 'Tipo', selectedInventory.showTipo],
                              ['mostrarMedidas', 'Medidas', selectedInventory.showMeasures],
                              ['mostrarDescripcion', 'Descripción corta', selectedInventory.showDescription],
                              ['mostrarDescripcionDetallada', 'Detalles técnicos', selectedInventory.showDetailedDescription],
                            ].map(([field, label, checked]) => (
                              <label key={String(field)} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <input type="checkbox" name={String(field)} defaultChecked={Boolean(checked)} className="size-4" /> {String(label)}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                        <div className="flex gap-2 sm:col-span-2">
                          <button type="button" onClick={() => setEditingInventory(false)} className="min-h-[44px] rounded-md border border-input px-4 text-sm">Cancelar</button>
                          <button disabled={isPending} className="min-h-[44px] rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">{isPending ? 'Guardando...' : 'Guardar cambios'}</button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeSection === 'Catálogo' && (
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight">Catálogo</h1>
              <p className="mt-2 text-muted-foreground">Vista previa de tu tienda online</p>
              <div className="mt-6 rounded-xl border border-border bg-muted p-8 text-center">
                <p className="text-muted-foreground">El catálogo público está disponible en <a href="/catalogo" className="text-primary hover:underline">/catalogo</a></p>
              </div>
            </div>
          )}

          {activeSection === 'Clientes' && (
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight">Clientes</h1>
              <p className="mt-2 text-muted-foreground">Gestiona la información de tus clientes</p>
              <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Cliente</th>
                      <th className="px-5 py-3 font-medium">Contacto</th>
                      <th className="px-5 py-3 font-medium">NIT / Empresa</th>
                      <th className="px-5 py-3 font-medium">Registrado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.length ? clients.map((client) => (
                      <tr key={client.id} className="border-t border-border">
                        <td className="px-5 py-4 font-medium">{client.name}</td>
                        <td className="px-5 py-4">
                          <div>{client.email.endsWith('@cliente.local') ? 'Sin correo' : client.email}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{client.phone || 'Sin teléfono'}</div>
                          {client.phone ? (
                            <a
                              href={`https://wa.me/${whatsappPhone(client.phone)}?text=${encodeURIComponent(`Hola ${client.name}, te contactamos de TORNILLOS JEHOVA JIREH.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-block text-xs text-primary hover:underline"
                            >
                              Contactar por WhatsApp
                            </a>
                          ) : null}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{client.nit || '—'}{client.company ? ` · ${client.company}` : ''}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{client.createdAt}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">Aún no hay clientes registrados.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {selectedOrder ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Detalle del pedido</p>
                <h2 id="order-detail-title" className="mt-1 text-2xl font-semibold">{selectedOrder.numero}</h2>
              </div>
              <button type="button" onClick={() => setSelectedOrder(null)} aria-label="Cerrar detalle" className="rounded-lg p-2 hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-4">
                <h3 className="font-semibold">Cliente y entrega</h3>
                <p className="mt-3 text-sm">{selectedOrder.clienteNombre || 'Cliente'}</p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedOrder.clienteTelefono || 'Sin teléfono'}</p>
                {selectedOrder.clienteEmail && !selectedOrder.clienteEmail.endsWith('@cliente.local')
                  ? <p className="mt-1 break-all text-sm text-muted-foreground">{selectedOrder.clienteEmail}</p>
                  : <p className="mt-1 text-sm text-muted-foreground">Sin correo registrado</p>}
                {selectedOrder.clienteNit ? <p className="mt-2 text-sm">NIT: {selectedOrder.clienteNit}</p> : null}
                {selectedOrder.clienteEmpresa ? <p className="mt-1 text-sm">Empresa: {selectedOrder.clienteEmpresa}</p> : null}
                {selectedOrder.clienteDireccion ? <p className="mt-2 text-sm">Dirección: {selectedOrder.clienteDireccion}</p> : null}
              </div>
              <div className="rounded-xl border border-border p-4">
                <h3 className="font-semibold">Resumen</h3>
                <p className="mt-3 text-sm">Fecha: {selectedOrder.createdAt.toLocaleString('es-GT')}</p>
                <p className="mt-2 text-sm">Estado: {orderStatusLabels[selectedOrder.estado] || selectedOrder.estado}</p>
                {selectedOrder.notas ? <p className="mt-2 whitespace-pre-wrap text-sm">Notas: {selectedOrder.notas}</p> : null}
                <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
                  <p className="flex justify-between"><span>Subtotal</span><span>Q {selectedOrder.subtotal.toFixed(2)}</span></p>
                  <p className="flex justify-between"><span>IVA</span><span>Q {selectedOrder.impuestos.toFixed(2)}</span></p>
                  <p className="flex justify-between font-semibold"><span>Total</span><span>Q {selectedOrder.total.toFixed(2)}</span></p>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">SKU</th>
                    <th className="px-4 py-3 text-right font-medium">Cantidad</th>
                    <th className="px-4 py-3 text-right font-medium">Precio</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-4 py-3">{item.nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.sku}</td>
                      <td className="px-4 py-3 text-right">{item.cantidad}</td>
                      <td className="px-4 py-3 text-right">Q {item.precioUnitario.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">Q {item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold">Historial de estados</h3>
              <ol className="mt-3 space-y-3">
                {selectedOrder.history.map((entry) => (
                  <li key={entry.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p>
                        {entry.estadoAnterior
                          ? `${orderStatusLabels[entry.estadoAnterior] || entry.estadoAnterior} → `
                          : ''}
                        <strong>{orderStatusLabels[entry.estadoNuevo] || entry.estadoNuevo}</strong>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {entry.createdAt.toLocaleString('es-GT')}
                        {entry.cambiadoPor ? ` · ${entry.cambiadoPor}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>
      ) : null}

      {/* Modal de Configuración */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/30" onClick={() => setSettingsOpen(false)}>
          <div onClick={(event) => event.stopPropagation()} className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-6">
              <div>
                <h2 className="text-xl font-semibold">Configuración</h2>
                <p className="text-sm text-muted-foreground">Ajustes de tu cuenta y sistema</p>
              </div>
              <button onClick={() => setSettingsOpen(false)} aria-label="Cerrar"><X /></button>
            </div>
            <div className="flex-1 p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 font-medium">Información de la tienda</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Nombre</span>
                      <span className="text-sm font-medium">TORNILLOS JEHOVA JIREH</span>
                    </div>
                    <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Moneda</span><span className="text-sm font-medium">Quetzales (Q)</span></div>
                    <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">IVA</span><span className="text-sm font-medium">12%</span></div>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 font-medium">Preferencias</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between"><span className="text-sm">Notificaciones por email</span><input type="checkbox" defaultChecked className="rounded border-input" /></label>
                    <label className="flex items-center justify-between"><span className="text-sm">Alertas de stock bajo</span><input type="checkbox" defaultChecked className="rounded border-input" /></label>
                  </div>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="mb-2 text-sm font-medium">Estado del sistema</p>
                  <p className="text-xs text-muted-foreground">Base de datos: <span className="text-destructive">No configurada</span></p>
                  <p className="mt-1 text-xs text-muted-foreground">Autenticación: <span className="text-destructive">Deshabilitada temporalmente</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Notificaciones */}
      {notificationsOpen && <div className="fixed inset-0 z-50 bg-foreground/30" onClick={() => setNotificationsOpen(false)}><div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-0 mt-[76px] flex h-[calc(100vh-76px)] w-full max-w-sm flex-col bg-card shadow-xl"><div className="flex items-center justify-between border-b border-border p-4"><h2 className="text-lg font-semibold">Notificaciones</h2><button onClick={() => setNotificationsOpen(false)} aria-label="Cerrar"><X /></button></div><div className="flex-1 overflow-y-auto p-4"><div className="space-y-3"><div className="rounded-lg border border-border bg-muted/50 p-3"><div className="flex items-start gap-3"><div className="flex size-8 items-center justify-center rounded-full bg-primary/10"><Bell className="size-4 text-primary" /></div><div><p className="text-sm font-medium">Nuevo pedido recibido</p><p className="text-xs text-muted-foreground mt-1">Pedido #ORD-2049 de Construcciones Álvarez</p><p className="text-xs text-muted-foreground mt-1">Hace 5 minutos</p></div></div></div><div className="rounded-lg border border-border bg-muted/50 p-3"><div className="flex items-start gap-3"><div className="flex size-8 items-center justify-center rounded-full bg-orange-500/10"><Box className="size-4 text-orange-500" /></div><div><p className="text-sm font-medium">Stock bajo</p><p className="text-xs text-muted-foreground mt-1">Tuerca autoblocante M10 tiene 84 unidades</p><p className="text-xs text-muted-foreground mt-1">Hace 1 hora</p></div></div></div><div className="rounded-lg border border-border bg-muted/50 p-3"><div className="flex items-start gap-3"><div className="flex size-8 items-center justify-center rounded-full bg-green-500/10"><CircleDollarSign className="size-4 text-green-500" /></div><div><p className="text-sm font-medium">Venta completada</p><p className="text-xs text-muted-foreground mt-1">Pedido #ORD-2048 entregado exitosamente</p><p className="text-xs text-muted-foreground mt-1">Hace 2 horas</p></div></div></div></div></div></div></div>}
    </div>
  )
}

export default TornilleriaDashboard
