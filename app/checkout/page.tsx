'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/cart-context'
import { ArrowLeft, Truck, Store, CheckCircle2, Loader2 } from 'lucide-react'

type DeliveryType = 'delivery' | 'pickup'

export default function CheckoutPage() {
  const router = useRouter()
  const { getCartItems, getCartTotal, getCartCount, clearCart } = useCart()
  const [mounted, setMounted] = useState(false)
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientNit, setClientNit] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber?: string } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const cartItems = getCartItems()
  const total = getCartTotal()
  const count = getCartCount()
  const impuestos = total * 0.12
  const totalConImpuestos = total + impuestos

  const money = (value: number) =>
    new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOrderLoading(true)
    setOrderError('')

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          cliente: {
            nombre: clientName,
            telefono: clientPhone,
            nit: clientNit,
            direccion: deliveryType === 'delivery' ? clientAddress : 'Recoger en tienda',
            empresa: ''
          },
          notas: orderNotes,
          tipo_entrega: deliveryType
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el pedido')
      }

      setOrderSuccess({ orderNumber: data.numero })
      clearCart()
      
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Error al procesar el pedido')
    } finally {
      setOrderLoading(false)
    }
  }

  if (!mounted) return null

  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-2xl px-4 py-16">
          <Link href="/catalogo" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Volver al catálogo
          </Link>
          <div className="mt-8 text-center">
            <h1 className="text-2xl font-semibold">Tu carrito está vacío</h1>
            <p className="mt-2 text-muted-foreground">Agrega productos antes de continuar con el checkout</p>
          </div>
        </div>
      </div>
    )
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-2xl px-4 py-16">
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="size-8" />
            </div>
            <h1 className="text-2xl font-semibold">¡Pedido creado exitosamente!</h1>
            <p className="mt-2 text-muted-foreground">
              Número de pedido: <strong>{orderSuccess.orderNumber}</strong>
            </p>
            <p className="mt-4 text-sm text-muted-foreground">Serás redirigido a la tienda en unos segundos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/catalogo" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Volver al catálogo
        </Link>
        
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Finalizar compra</h1>
        
        <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <h2 className="mb-4 text-lg font-semibold">Información de contacto</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">Nombre completo *</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">Teléfono *</label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="nit" className="block text-sm font-medium mb-2">NIT (opcional)</label>
                  <input
                    id="nit"
                    type="text"
                    value={clientNit}
                    onChange={(e) => setClientNit(e.target.value)}
                    className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-lg font-semibold">Tipo de entrega</h2>
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                    deliveryType === 'delivery'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <Truck className="size-5" />
                  <div>
                    <p className="font-medium">Delivery a domicilio</p>
                    <p className="text-sm text-muted-foreground">Recibe tu pedido en tu dirección</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                    deliveryType === 'pickup'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <Store className="size-5" />
                  <div>
                    <p className="font-medium">Recoger en tienda</p>
                    <p className="text-sm text-muted-foreground">Pasa por tu pedido cuando esté listo</p>
                  </div>
                </button>
              </div>
            </div>

            {deliveryType === 'delivery' && (
              <div>
                <label htmlFor="address" className="block text-sm font-medium mb-2">Dirección de entrega *</label>
                <textarea
                  id="address"
                  required
                  rows={3}
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2">Notas adicionales (opcional)</label>
              <textarea
                id="notes"
                rows={2}
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="mb-4 text-lg font-semibold">Resumen del pedido ({count} {count === 1 ? 'producto' : 'productos'})</h2>
              <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x {money(item.price)}
                      </p>
                    </div>
                    <p className="font-medium text-sm">{money(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-card p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{money(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (12%)</span>
                <span>{money(impuestos)}</span>
              </div>
              <div className="flex justify-between pt-2 text-lg font-semibold">
                <span>Total</span>
                <span>{money(totalConImpuestos)}</span>
              </div>
            </div>

            {orderError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {orderError}
              </div>
            )}

            <button
              type="submit"
              disabled={orderLoading}
              className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {orderLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Procesando...
                </span>
              ) : (
                'Confirmar pedido (pago contra entrega)'
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Al confirmar el pedido, aceptas nuestros términos y condiciones
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
