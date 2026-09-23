'use client'

import { useCart } from '@/lib/cart-context'
import {
  ShoppingCart,
  X,
  Trash2,
  Plus,
  Minus,
  Truck,
  Store,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type DeliveryType = 'delivery' | 'pickup'

export function CartPreview() {
  const { getCartItems, getCartTotal, getCartCount, removeFromCart, updateQuantity, clearCart } =
    useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientNit, setClientNit] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber?: string } | null>(null)

  const [mounted, setMounted] = useState(false)
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

  const closeCart = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation()
    setIsOpen(false)
    setShowCheckout(false)
    setOrderError('')
  }

  const validateCheckout = () => {
    if (!clientName.trim() || !clientPhone.trim()) {
      setOrderError('Nombre y teléfono son obligatorios.')
      return false
    }
    if (!clientNit.trim()) {
      setOrderError('El NIT es obligatorio para guardar tus datos y facturar.')
      return false
    }
    if (deliveryType === 'delivery' && !clientAddress.trim()) {
      setOrderError('La dirección es obligatoria para envío a domicilio.')
      return false
    }
    setOrderError('')
    return true
  }

  const lookupByNit = async () => {
    const nit = clientNit.trim()
    if (!nit) return
    try {
      const res = await fetch('/api/clients?nit=' + encodeURIComponent(nit))
      if (!res.ok) return
      const data = await res.json()
      const c = data.client
      if (!c) return
      if (c.nombre) setClientName(c.nombre)
      if (c.telefono) setClientPhone(c.telefono)
      if (c.direccion) setClientAddress(c.direccion)
    } catch {}
  }

  const buildOrderFormData = () => {
    const formData = new FormData()
    formData.append('clientName', clientName)
    formData.append('clientPhone', clientPhone)
    formData.append('clientNit', clientNit)
    formData.append('clientAddress', deliveryType === 'delivery' ? clientAddress : 'Recoger en tienda')
    formData.append('deliveryType', deliveryType)
    formData.append('notes', orderNotes)
    formData.append(
      'items',
      JSON.stringify(
        cartItems.map((p) => ({
          sku: p.sku || p.id,
          name: p.name,
          quantity: p.quantity,
          price: p.price,
        })),
      ),
    )
    formData.append('subtotal', total.toString())
    formData.append('tax', impuestos.toString())
    formData.append('total', totalConImpuestos.toString())
    return formData
  }

  const buildWhatsAppMessage = (orderNumber?: string) => {
    const deliveryText =
      deliveryType === 'delivery' ? 'Envío a domicilio' : 'Recoger en tienda (Pick-up)'
    const addressText =
      deliveryType === 'delivery'
        ? `\n📍 Dirección: ${clientAddress}`
        : '\n📍 Recoger en tienda física'

    let message = `🛒 *NUEVO PEDIDO - Tornillería Jehova Jireh*\n\n`
    if (orderNumber) message += `🧾 *Pedido:* ${orderNumber}\n`
    message += `👤 *Cliente:* ${clientName}\n`
    message += `📱 *Teléfono:* ${clientPhone}\n`
    if (clientNit) message += `🆔 *NIT:* ${clientNit}\n`
    message += `🚚 *Tipo de entrega:* ${deliveryText}${addressText}\n\n`
    message += `📦 *Productos:*\n`

    cartItems.forEach((item, index) => {
      message += `${index + 1}. ${item.name}\n`
      message += `   SKU: ${item.sku || item.id}\n`
      message += `   Cantidad: ${item.quantity} x ${money(item.price)}\n`
      message += `   Subtotal: ${money(item.price * item.quantity)}\n\n`
    })

    message += `\n💰 *Subtotal:* ${money(total)}\n`
    message += `📊 *IVA (12%):* ${money(impuestos)}\n`
    message += `💵 *TOTAL:* ${money(totalConImpuestos)}\n\n`
    if (orderNotes) message += `📝 *Notas:* ${orderNotes}\n`
    return message
  }

  const handleWebOrder = async (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation()
    if (!validateCheckout()) return
    setOrderLoading(true)
    setOrderError('')
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        body: buildOrderFormData(),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo confirmar el pedido en la web')
      }
      setOrderSuccess({ orderNumber: data.orderNumber })
      clearCart()
      setShowCheckout(false)
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Error al confirmar el pedido')
    } finally {
      setOrderLoading(false)
    }
  }

  const handleWhatsAppOrder = async (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation()
    if (!validateCheckout()) return
    setOrderLoading(true)
    setOrderError('')
    let orderNumber: string | undefined
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        body: buildOrderFormData(),
      })
      if (response.ok) {
        const data = await response.json().catch(() => ({}))
        orderNumber = data.orderNumber
      }
    } catch (error) {
      console.error('Error al registrar pedido:', error)
    }

    window.open(
      `https://wa.me/50256125894?text=${encodeURIComponent(buildWhatsAppMessage(orderNumber))}`,
      '_blank',
    )
    clearCart()
    closeCart()
    setOrderLoading(false)
  }


  const overlay = (
    <>
      {isOpen ? (
        <>
          {/* Backdrop con pointer-events-none para no bloquear toques */}
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 pointer-events-auto"
            aria-label="Cerrar"
            onClick={closeCart}
          />

          {/* Drawer con z-index superior y pointer-events-auto */}
          <aside
            className="fixed inset-0 z-50 flex h-[100dvh] w-full flex-col bg-background pointer-events-auto sm:left-auto sm:right-0 sm:w-full sm:max-w-md sm:border-l sm:border-border"
            role="dialog"
            aria-modal="true"
            aria-label="Carrito de compras"
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {showCheckout ? 'Finalizar compra' : 'Tu carrito'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {cartItems.length} {cartItems.length === 1 ? 'línea' : 'líneas'} · {count}{' '}
                  {count === 1 ? 'pieza' : 'piezas'}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => closeCart(e)}
                onTouchEnd={(e) => closeCart(e)}
                className="inline-flex size-11 items-center justify-center rounded-lg border border-border touch-manipulation select-none"
                aria-label="Cerrar carrito"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto overscroll-contain px-4 py-4">
                {!showCheckout ? (
                  cartItems.length === 0 ? (
                    <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
                      <ShoppingCart className="mb-3 size-12 text-muted-foreground opacity-40" />
                      <p className="font-medium text-foreground">Tu carrito está vacío</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Agrega productos con el botón Añadir.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pb-4">
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border-2 border-zinc-300 bg-zinc-50 p-4 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-base font-semibold leading-snug">{item.name}</p>
                              <p className="mt-1 text-xs opacity-70">SKU: {item.sku || item.id}</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFromCart(item.id)
                              }}
                              onTouchEnd={(e) => {
                                e.stopPropagation()
                                removeFromCart(item.id)
                              }}
                              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-600 touch-manipulation select-none"
                              aria-label={`Quitar ${item.name}`}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="inline-flex items-center rounded-lg border border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateQuantity(item.id, item.quantity - 1)
                                }}
                                onTouchEnd={(e) => {
                                  e.stopPropagation()
                                  updateQuantity(item.id, item.quantity - 1)
                                }}
                                className="inline-flex size-11 items-center justify-center touch-manipulation select-none"
                                aria-label="Menos"
                              >
                                <Minus className="size-4" />
                              </button>
                              <span className="min-w-[2.5rem] text-center text-base font-bold">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateQuantity(item.id, item.quantity + 1)
                                }}
                                onTouchEnd={(e) => {
                                  e.stopPropagation()
                                  updateQuantity(item.id, item.quantity + 1)
                                }}
                                className="inline-flex size-11 items-center justify-center touch-manipulation select-none"
                                aria-label="Más"
                              >
                                <Plus className="size-4" />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-xs opacity-70">{money(item.price)} c/u</p>
                              <p className="text-lg font-bold">{money(item.price * item.quantity)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="space-y-5 pb-4">
                    <div className="rounded-xl border-2 border-zinc-300 bg-zinc-50 p-3 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50">
                      <p className="text-sm opacity-70">Resumen</p>
                      <p className="mt-1 text-base font-semibold">
                        {count} piezas · {money(totalConImpuestos)}
                      </p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {cartItems.map((item) => (
                          <li key={item.id} className="flex justify-between gap-2">
                            <span className="truncate">
                              {item.quantity}× {item.name}
                            </span>
                            <span className="shrink-0 font-medium">
                              {money(item.price * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Tipo de entrega</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeliveryType('delivery')
                          }}
                          onTouchEnd={(e) => {
                            e.stopPropagation()
                            setDeliveryType('delivery')
                          }}
                          className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-3 text-xs font-medium touch-manipulation select-none ${
                            deliveryType === 'delivery'
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-foreground'
                          }`}
                        >
                          <Truck className="size-5" />
                          Envío a domicilio
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeliveryType('pickup')
                          }}
                          onTouchEnd={(e) => {
                            e.stopPropagation()
                            setDeliveryType('pickup')
                          }}
                          className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-3 text-xs font-medium touch-manipulation select-none ${
                            deliveryType === 'pickup'
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-foreground'
                          }`}
                        >
                          <Store className="size-5" />
                          Recoger en tienda
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Nombre completo *"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground"
                        autoComplete="name"
                      />
                      <input
                        type="tel"
                        inputMode="tel"
                        placeholder="Teléfono *"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground"
                        autoComplete="tel"
                      />
                      <input
                        type="text"
                        placeholder="NIT *"
                        value={clientNit}
                        onChange={(e) => setClientNit(e.target.value)}
                        onBlur={lookupByNit}
                        required
                        className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground"
                      />
                      <p className="text-xs text-muted-foreground">
                        Si ya estás registrado, al salir del NIT cargamos tus datos.
                      </p>
                      {deliveryType === 'delivery' ? (
                        <input
                          type="text"
                          placeholder="Dirección completa *"
                          value={clientAddress}
                          onChange={(e) => setClientAddress(e.target.value)}
                          className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground"
                          autoComplete="street-address"
                        />
                      ) : null}
                      <textarea
                        placeholder="Notas (opcional)"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="min-h-[88px] w-full rounded-xl border border-input bg-background px-3 py-3 text-base text-foreground"
                      />
                    </div>
                    {orderError ? <p className="text-sm text-destructive">{orderError}</p> : null}
                  </div>
                )}
              </div>
            </div>

            <div
              className="shrink-0 space-y-3 border-t border-border bg-background px-4 py-4"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              {cartItems.length === 0 && !showCheckout ? (
                <button
                  type="button"
                  onClick={(e) => closeCart(e)}
                  onTouchEnd={(e) => closeCart(e)}
                  className="flex h-12 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold touch-manipulation select-none"
                >
                  Seguir comprando
                </button>
              ) : !showCheckout ? (
                <>
                  <div className="space-y-1 text-sm text-foreground">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{money(total)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>IVA (12%)</span>
                      <span>{money(impuestos)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span>{money(totalConImpuestos)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCheckout(true)
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation()
                      setShowCheckout(true)
                    }}
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground touch-manipulation select-none"
                  >
                    Comprar ahora
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={(e) => handleWebOrder(e)}
                    onTouchEnd={(e) => handleWebOrder(e)}
                    disabled={orderLoading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50 touch-manipulation select-none"
                  >
                    <ShoppingCart className="size-4" />
                    {orderLoading ? 'Confirmando...' : 'Confirmar compra (guardar cliente)'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleWhatsAppOrder(e)}
                    onTouchEnd={(e) => handleWhatsAppOrder(e)}
                    disabled={orderLoading}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium disabled:opacity-50 touch-manipulation select-none"
                  >
                    <MessageCircle className="size-4" />
                    También por WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCheckout(false)
                      setOrderError('')
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation()
                      setShowCheckout(false)
                      setOrderError('')
                    }}
                    className="min-h-[44px] w-full text-sm text-muted-foreground touch-manipulation select-none"
                  >
                    Volver al carrito
                  </button>
                </div>
              )}
            </div>
          </aside>
        </>
      ) : null}

      {orderSuccess ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[1100] bg-black/60 pointer-events-auto"
            aria-label="Cerrar"
            onClick={() => {
              setOrderSuccess(null)
              closeCart()
            }}
          />
          <div className="fixed inset-0 z-[1101] flex items-end justify-center p-4 sm:items-center pointer-events-none">
            <div 
              className="w-full max-w-md rounded-2xl border border-border bg-background p-6 text-center pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="size-7 text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">¡Compra confirmada!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Tu pedido{orderSuccess.orderNumber ? ` ${orderSuccess.orderNumber}` : ''} quedó
                registrado.
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setOrderSuccess(null)
                  closeCart()
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation()
                  setOrderSuccess(null)
                  closeCart()
                }}
                className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground touch-manipulation select-none"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        </>
      ) : null}
    </>
  )

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(true)
        }}
        onTouchEnd={(e) => {
          e.stopPropagation()
          setIsOpen(true)
        }}
        className="relative inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-3 py-2.5 touch-manipulation select-none"
        aria-label={`Carrito, ${count} productos`}
      >
        <ShoppingCart className="size-5" />
        <span className="text-sm font-medium">Carrito</span>
        {count > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </button>
      {mounted ? createPortal(overlay, document.body) : null}
    </>
  )
}
