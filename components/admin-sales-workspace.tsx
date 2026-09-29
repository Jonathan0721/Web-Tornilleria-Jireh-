'use client'

import { useState, useTransition } from 'react'
import {
  confirmSalesQuote,
  createSalesQuote,
  getSalesDocument,
  listSalesDocuments,
  lookupSalesCustomer,
  searchInventoryForSales,
} from '@/app/actions/sales-documents'
import type { SalesQuoteInput } from '@/app/actions/sales-documents'
import { downloadSalesDocumentPdf } from '@/lib/sales-document-pdf'
import {
  ArrowLeft, Check, FileText, LoaderCircle, Plus, Search, ShoppingCart, Trash2,
  UserRound, X,
} from 'lucide-react'

type Product = Awaited<ReturnType<typeof searchInventoryForSales>>[number]
type Document = NonNullable<Awaited<ReturnType<typeof getSalesDocument>>>
type DocumentRow = Awaited<ReturnType<typeof listSalesDocuments>>[number]
type CartLine = { product: Product; quantity: number; unitPrice: number }
type CustomerFields = SalesQuoteInput['customer']

function currency(value: number) {
  const [integer, decimals] = value.toFixed(2).split('.')
  const groupedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `Q ${groupedInteger}.${decimals}`
}

function dateLabel(value: string) {
  const guatemalaTime = new Date(new Date(value).getTime() - 6 * 60 * 60 * 1000)
  const day = String(guatemalaTime.getUTCDate()).padStart(2, '0')
  const month = String(guatemalaTime.getUTCMonth() + 1).padStart(2, '0')
  const year = guatemalaTime.getUTCFullYear()
  return `${day}/${month}/${year}`
}

function whatsappLink(phone: string, document: Document) {
  const digits = phone.replace(/\D/g, '')
  const number = digits.startsWith('502') ? digits : `502${digits}`
  const docNumber = document.status === 'comprobante'
    ? document.receiptNumber || document.quoteNumber
    : document.quoteNumber
  const pendingQuantity = document.items.reduce((sum, item) => sum + item.quantity - item.quantityDeducted, 0)
  const message = document.status === 'comprobante'
    ? `Hola ${document.customerName}, te compartimos el comprobante interno ${docNumber} por ${currency(document.total)}.${pendingQuantity ? ` Quedaron ${pendingQuantity} unidades por encargo.` : ''} No es factura fiscal.`
    : `Hola ${document.customerName}, te compartimos la cotizacion ${docNumber} por ${currency(document.total)}. La disponibilidad se confirma al concretar la venta.`
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export default function AdminSalesWorkspace({ initialDocuments }: { initialDocuments: DocumentRow[] }) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartLine[]>([])
  const [customer, setCustomer] = useState<CustomerFields>({
    name: '', phone: '', nit: '', email: '', company: '', address: '',
  })
  const [notes, setNotes] = useState('')
  const [documents, setDocuments] = useState(initialDocuments)
  const [selected, setSelected] = useState<Document | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const subtotal = cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
  const taxes = Math.round(subtotal * 12) / 100
  const total = subtotal + taxes

  function runSearch() {
    setError('')
    startTransition(async () => {
      try {
        setProducts(await searchInventoryForSales(search))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'No se pudieron buscar productos.')
      }
    })
  }

  function addProduct(product: Product) {
    setCart((current) => {
      const found = current.find((line) => line.product.id === product.id)
      if (found) return current.map((line) => line.product.id === product.id
        ? { ...line, quantity: line.quantity + 1 }
        : line)
      return [...current, { product, quantity: 1, unitPrice: product.price > 0 ? product.price : 0 }]
    })
    setNotice(`${product.sku} agregado a la cotizacion.`)
  }

  function updateLine(index: number, field: 'quantity' | 'unitPrice', value: string) {
    const parsed = Number(value)
    setCart((current) => current.map((line, position) => position === index
      ? { ...line, [field]: Number.isFinite(parsed) ? parsed : 0 }
      : line))
  }

  function findCustomer() {
    setError('')
    startTransition(async () => {
      try {
        const found = await lookupSalesCustomer(customer.nit || '')
        if (!found) {
          setNotice('No encontramos ese NIT; completa los datos del cliente.')
          return
        }
        setCustomer(found)
        setNotice('Datos del cliente cargados.')
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'No se pudo buscar el cliente.')
      }
    })
  }

  function saveQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    startTransition(async () => {
      try {
        const result = await createSalesQuote({
          customer,
          notes,
          items: cart.map((line) => ({
            sku: line.product.sku,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
        })
        const document = await getSalesDocument(result.id)
        if (!document) throw new Error('No se pudo cargar la cotizacion guardada.')
        setSelected(document)
        setDocuments(await listSalesDocuments())
        setCart([])
        setNotice(`Cotizacion ${result.number} guardada. No se modifico el inventario.`)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'No se pudo guardar la cotizacion.')
      }
    })
  }

  function loadDocument(id: string) {
    setError('')
    startTransition(async () => {
      try {
        const document = await getSalesDocument(id)
        if (!document) throw new Error('No se encontro el documento.')
        setSelected(document)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'No se pudo cargar el documento.')
      }
    })
  }

  function confirmSale() {
    if (!selected) return
    if (!window.confirm(`Confirmar venta ${selected.quoteNumber}? Se descontaran las cantidades del inventario.`)) return
    setError('')
    setNotice('')
    startTransition(async () => {
      try {
        const result = await confirmSalesQuote(selected.id)
        const document = await getSalesDocument(selected.id)
        if (!document) throw new Error('La venta se guardo, pero no se pudo volver a cargar el documento.')
        setSelected(document)
        setDocuments(await listSalesDocuments())
        setNotice(`Venta confirmada como ${result.number}; ${result.pendingQuantity ? `se descontó lo disponible y quedaron ${result.pendingQuantity} unidades por encargo.` : 'se descontaron las existencias.'}`)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'No se pudo confirmar la venta.')
      }
    })
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <a href="/admin" aria-label="Volver al administrador" className="rounded-lg border border-border p-2 hover:bg-muted">
              <ArrowLeft className="size-4" />
            </a>
            <div>
              <h1 className="text-xl font-semibold">Ventas y cotizaciones</h1>
              <p className="text-sm text-muted-foreground">Busca productos por código, cotiza y confirma la venta.</p>
            </div>
          </div>
          <FileText className="hidden size-6 text-primary sm:block" />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_350px]">
        <section className="space-y-6">
          <form onSubmit={saveQuote} className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <UserRound className="size-5 text-primary" />
                <h2 className="font-semibold">Datos del cliente</h2>
              </div>
              <div className="mb-4 flex gap-2">
                <input
                  required
                  value={customer.nit || ''}
                  onChange={(event) => setCustomer({ ...customer, nit: event.target.value })}
                  placeholder="NIT del cliente"
                  aria-label="NIT del cliente"
                  className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                <button type="button" onClick={findCustomer} disabled={isPending} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50">
                  <Search className="size-4" /> Buscar NIT
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input required maxLength={120} value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} placeholder="Nombre *" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                <input required maxLength={30} value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} placeholder="Teléfono *" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                <input maxLength={100} type="email" value={customer.email || ''} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} placeholder="Correo (opcional)" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                <input maxLength={120} value={customer.company || ''} onChange={(event) => setCustomer({ ...customer, company: event.target.value })} placeholder="Empresa (opcional)" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                <input maxLength={300} value={customer.address || ''} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} placeholder="Dirección (opcional)" className="rounded-lg border border-input bg-background px-3 py-2 text-sm sm:col-span-2" />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Search className="size-5 text-primary" />
                <h2 className="font-semibold">Agregar producto</h2>
              </div>
              <div className="flex gap-2">
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Busca por código, nombre o medida" className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                <button type="button" onClick={runSearch} disabled={isPending || search.trim().length < 2} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                  {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" />} Buscar
                </button>
              </div>
              {products.length > 0 && (
                <div className="mt-3 divide-y divide-border rounded-lg border border-border">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{product.sku} {product.measures ? `· ${product.measures}` : ''} · Stock: {product.stock} · {currency(product.price)}</p>
                      </div>
                      <button type="button" onClick={() => addProduct(product)} aria-label={`Agregar ${product.sku}`} className="shrink-0 rounded-lg border border-border p-2 hover:bg-muted">
                        <Plus className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {products.length === 0 && search && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {search.trim().length < 2 ? 'Ingresa al menos dos caracteres y busca para ver productos.' : 'No encontramos productos con ese codigo, nombre o medida.'}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <ShoppingCart className="size-5 text-primary" />
                <h2 className="font-semibold">Productos de la cotización</h2>
              </div>
              {cart.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">Busca un producto por código y agrégalo aquí.</div>
              ) : (
                <div className="space-y-3">
                  {cart.map((line, index) => (
                    <div key={line.product.id} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[minmax(0,1fr)_90px_125px_34px] sm:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{line.product.name}</p>
                        <p className="text-xs text-muted-foreground">{line.product.sku} · Stock actual: {line.product.stock}</p>
                      </div>
                      <label className="text-xs text-muted-foreground">Cantidad
                        <input type="number" min="1" step="1" value={line.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground" />
                      </label>
                      <label className="text-xs text-muted-foreground">Precio unitario (Q)
                        <input type="number" min="0.01" step="0.01" value={line.unitPrice || ''} onChange={(event) => updateLine(index, 'unitPrice', event.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground" />
                      </label>
                      <button type="button" onClick={() => setCart((current) => current.filter((_, position) => position !== index))} aria-label={`Quitar ${line.product.sku}`} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="mt-4 block text-sm font-medium">Notas (opcional)
                <textarea maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal" />
              </label>
              <div className="mt-4 ml-auto max-w-xs space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{currency(subtotal)}</span></div>
                <div className="flex justify-between"><span>IVA (12%)</span><span>{currency(taxes)}</span></div>
                <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{currency(total)}</span></div>
              </div>
              <button type="submit" disabled={isPending || cart.length === 0} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <FileText className="size-4" />} Guardar cotización
              </button>
              <p className="mt-2 text-center text-xs text-muted-foreground">Guardar o cotizar no descuenta existencias. El precio debe confirmarse antes de cobrar.</p>
            </div>
          </form>

          {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
          {notice && <div role="status" className="rounded-lg border border-emerald-600/20 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

          {selected && (
            <section className="rounded-xl border border-primary/30 bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{selected.status === 'comprobante' ? 'Comprobante interno' : 'Cotización guardada'}</p>
                  <h2 className="mt-1 text-lg font-semibold">{selected.status === 'comprobante' ? selected.receiptNumber : selected.quoteNumber}</h2>
                  <p className="text-sm text-muted-foreground">{selected.customerName} · {currency(selected.total)}</p>
                </div>
                <button type="button" onClick={() => setSelected(null)} aria-label="Cerrar documento" className="rounded-md p-2 hover:bg-muted"><X className="size-4" /></button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => downloadSalesDocumentPdf(selected)} className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">Descargar PDF interno</button>
                {selected.customerPhone && <a href={whatsappLink(selected.customerPhone, selected)} target="_blank" rel="noreferrer" className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">Abrir WhatsApp</a>}
                {selected.status === 'cotizacion' && (
                  <button type="button" disabled={isPending} onClick={confirmSale} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                    <Check className="size-4" /> Confirmar venta y descontar stock disponible
                  </button>
                )}
              </div>
              {selected.status === 'comprobante' && selected.items.some((item) => item.quantityDeducted < item.quantity) && (
                <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800">
                  Parte de esta venta quedó por encargo. Se descontó únicamente el stock disponible; faltan {selected.items.reduce((sum, item) => sum + item.quantity - item.quantityDeducted, 0)} unidades.
                </p>
              )}
              {selected.status === 'cotizacion' && <p className="mt-3 text-xs text-muted-foreground">Para enviar por WhatsApp, descarga el PDF y adjúntalo en el chat. La cotización no reserva stock.</p>}
            </section>
          )}
        </section>

        <aside className="h-fit rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6">
          <h2 className="font-semibold">Documentos recientes</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cotizaciones y comprobantes guardados</p>
          <div className="mt-4 space-y-2">
            {documents.length === 0 && <p className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">Aún no hay documentos.</p>}
            {documents.map((document) => (
              <button key={document.id} type="button" onClick={() => loadDocument(document.id)} className="w-full rounded-lg border border-border p-3 text-left hover:bg-muted/50">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{document.receiptNumber || document.quoteNumber}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${document.status === 'comprobante' ? 'bg-emerald-600/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'}`}>
                    {document.status === 'comprobante' ? 'Venta' : 'Cotización'}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{document.customerName} · {dateLabel(document.createdAt)}</p>
                <p className="mt-2 text-sm font-semibold">{currency(document.total)}</p>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </main>
  )
}
