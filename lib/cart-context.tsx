'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  sku?: string
}

interface CartContextType {
  cart: Record<string, CartItem>
  addToCart: (product: any, quantity: number) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartCount: () => number
  getCartItems: () => CartItem[]
}

const CartContext = createContext<CartContextType | undefined>(undefined)
const STORAGE_KEY = 'tj-cart-v1'

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Record<string, CartItem>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') setCart(parsed)
      }
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    } catch {}
  }, [cart, ready])

  const addToCart = (product: any, quantity: number) => {
    const id = String(product.id || product.sku || '')
    if (!id) return
    const name = String(product.nombre || product.name || id)
    const price = Number(product.precio ?? product.price ?? 0)
    setCart((prev) => {
      const existing = prev[id]
      if (existing) {
        return {
          ...prev,
          [id]: { ...existing, quantity: existing.quantity + quantity },
        }
      }
      return {
        ...prev,
        [id]: {
          id,
          name,
          price,
          quantity,
          image: product.imagen || product.image,
          sku: String(product.sku || id),
        },
      }
    })
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setCart((prev) => {
      if (!prev[id]) return prev
      return { ...prev, [id]: { ...prev[id], quantity } }
    })
  }

  const clearCart = () => setCart({})

  const getCartItems = () => Object.values(cart)
  const getCartTotal = () =>
    Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0)
  const getCartCount = () =>
    Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        getCartItems,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
