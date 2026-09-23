'use client'

import { useState } from 'react'
import { ArrowLeft, ShoppingCart, Plus, Minus, Truck, ShieldCheck, Award, Package } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/lib/cart-context'
import { IosToast } from './ios-toast'
import { CartPreview } from './cart-preview'

export default function TornilleriaProductDetail({ product }: { product: any }) {
  const [quantity, setQuantity] = useState(1)
  const [showToast, setShowToast] = useState(false)
  const { addToCart } = useCart()
  
  const money = (value: number) => new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value)
  
  const handleAddToCart = () => {
    try {
      console.log('[ProductDetail] Adding to cart:', { product, quantity })
      addToCart(product, quantity)
      setShowToast(true)
    } catch (error) {
      console.error('[ProductDetail] Error adding to cart:', error)
      alert('Error al agregar al carrito. Por favor intenta nuevamente.')
    }
  }
  
  const tipoLabels: Record<string, string> = {
    galvanizado: 'Galvanizado',
    grado5: 'Grado 5',
    grado8: 'Grado 8',
    seguridad: 'Seguridad',
    acero_inoxidable: 'Acero Inoxidable',
    zincado: 'Zincado'
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 md:px-8">
          <Link href="/catalogo" className="flex shrink-0 items-center gap-3 px-2 py-2 min-h-[44px] hover:opacity-80 active:opacity-70 transition-opacity cursor-pointer">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary font-mono font-bold text-primary-foreground pointer-events-none">TJ</span>
            <span className="hidden sm:block font-semibold tracking-tight">Tornilleria Jehova Jireh</span>
            <span className="sm:hidden font-semibold tracking-tight text-sm">TJ Tornilleria</span>
          </Link>
          <CartPreview />
        </div>
      </header>
      
      <main className="mx-auto max-w-7xl px-4 sm:px-5 py-6 sm:py-10 md:px-8">
        <Link href="/catalogo" className="inline-flex items-center gap-2 px-3 py-2 min-h-[44px] text-xs sm:text-sm text-muted-foreground hover:text-foreground active:text-foreground mb-4 sm:mb-6 transition-colors cursor-pointer">
          <ArrowLeft className="size-4" /> Volver al catálogo
        </Link>
        
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
          {/* Imagen del producto */}
          <div className="aspect-square rounded-2xl border border-border bg-muted flex items-center justify-center overflow-hidden">
            {product.imagen ? (
              <img 
                src={product.imagen} 
                alt={product.nombre} 
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Package className="size-24 mb-4 opacity-20" />
                <p className="text-sm">Imagen no disponible</p>
              </div>
            )}
          </div>
          
          {/* Información del producto */}
          <div className="flex flex-col">
            <div className="mb-4">
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {product.categoria || product.category}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">{product.nombre || product.name}</h1>
            <p className="text-sm sm:text-lg text-muted-foreground mb-4">SKU: {product.sku || product.id}</p>
            
            {product.tipo && (
              <div className="mb-4">
                <span className="text-sm font-medium">Tipo: </span>
                <span className="text-sm text-muted-foreground">{tipoLabels[product.tipo] || product.tipo}</span>
              </div>
            )}
            
            {product.medidas && (
              <div className="mb-4">
                <span className="text-sm font-medium">Medidas: </span>
                <span className="text-sm text-muted-foreground">{product.medidas}</span>
              </div>
            )}
            
            <div className="mb-6">
              <p className="text-3xl sm:text-4xl font-semibold tracking-tight">{money(Number(product.precio || product.price))}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">por {product.unidad || product.unit}</p>
            </div>
            
            {product.descripcion && (
              <p className="text-muted-foreground mb-6">{product.descripcion}</p>
            )}
            
            {/* Selector de cantidad y botón agregar */}
            <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center rounded-lg border border-input justify-center sm:justify-start">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-muted active:bg-muted/80 transition-colors cursor-pointer"
                  aria-label="Reducir cantidad"
                >
                  <Minus className="size-4" />
                </button>
                <span className="px-6 py-3 font-medium min-w-[60px] text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-muted active:bg-muted/80 transition-colors cursor-pointer"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <button 
                onClick={handleAddToCart}
                disabled={product.stock < quantity}
                className="flex-1 rounded-lg bg-primary px-4 sm:px-6 py-4 min-h-[48px] font-medium text-primary-foreground hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base transition-opacity cursor-pointer"
              >
                <ShoppingCart className="mr-2 inline size-4" />
                Agregar al carrito
              </button>
            </div>
            
            <div className="mb-8">
              <p className="text-sm font-medium mb-2">Disponibilidad: </p>
              <p className={`text-sm ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                {product.stock > 10 ? `${product.stock} unidades disponibles` : product.stock > 0 ? `Solo ${product.stock} unidades disponibles` : 'Agotado'}
              </p>
            </div>
            
            {/* Características */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-6">
              <h3 className="font-semibold mb-4">Características</h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <ShieldCheck className="size-4 sm:size-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium">Alta calidad</p>
                    <p className="text-xs text-muted-foreground">Certificado ISO</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Truck className="size-4 sm:size-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium">Envío rápido</p>
                    <p className="text-xs text-muted-foreground">24-48 horas</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Award className="size-4 sm:size-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium">Garantía</p>
                    <p className="text-xs text-muted-foreground">30 días</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Package className="size-4 sm:size-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium">Empaque seguro</p>
                    <p className="text-xs text-muted-foreground">Protegido</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Descripción detallada */}
            {product.descripcionDetallada && (
              <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
                <h3 className="font-semibold mb-4">Especificaciones técnicas</h3>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line text-xs sm:text-sm">
                  {product.descripcionDetallada}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <IosToast 
        show={showToast} 
        message={`${quantity} ${product.nombre || product.name} agregado al carrito`}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}
