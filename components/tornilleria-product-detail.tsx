'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, ShoppingCart, Package } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/lib/cart-context'
import { IosToast } from './ios-toast'
import { CartPreview } from './cart-preview'
import type { InferSelectModel } from 'drizzle-orm'
import type { inventario } from '@/lib/db/schema'
import { getProductDimensions } from '@/lib/product-variants'

type Product = InferSelectModel<typeof inventario>

export default function TornilleriaProductDetail({
  product,
  variants = [product],
}: {
  product: Product
  variants?: Product[]
}) {
  const [selectedSku, setSelectedSku] = useState(product.sku)
  const [quantity, setQuantity] = useState(1)
  const selectedProduct = variants.find((variant) => variant.sku === selectedSku) || product
  const familyImage = selectedProduct.imagen || variants.find((variant) => variant.imagen)?.imagen
  const dimensionOptions = useMemo(() => variants.map((variant) => ({
    variant,
    dimensions: getProductDimensions(variant.medidas),
  })), [variants])
  const hasDimensions = variants.length > 1 && dimensionOptions.every((item) => item.dimensions !== null)
  const widths = [...new Set(dimensionOptions.flatMap((item) => item.dimensions ? [item.dimensions.width] : []))]
  const selectedDimensions = getProductDimensions(selectedProduct.medidas)
  const lengths = [...new Set(dimensionOptions.flatMap((item) =>
    item.dimensions && item.dimensions.width === selectedDimensions?.width ? [item.dimensions.length] : [],
  ))]
  const [showToast, setShowToast] = useState(false)
  const { addToCart } = useCart()
  
  const money = (value: number) => new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value)
  
  const handleAddToCart = () => {
    try {
      addToCart({ ...selectedProduct, id: selectedProduct.sku }, quantity)
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
            <span className="hidden sm:block font-semibold tracking-tight">TORNILLOS JEHOVA JIREH</span>
            <span className="sm:hidden font-semibold tracking-tight text-sm">TORNILLOS JEHOVA JIREH</span>
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
          {selectedProduct.mostrarImagen && <div className="aspect-square rounded-2xl border border-border bg-white p-5 sm:p-8 flex items-center justify-center overflow-hidden">
            {familyImage ? (
              <img 
                src={familyImage}
                alt={selectedProduct.familia || selectedProduct.nombre}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Package className="size-24 mb-4 opacity-20" />
                <p className="text-sm">Imagen no disponible</p>
              </div>
            )}
          </div>}
          
          {/* Información del producto */}
          <div className="flex flex-col">
            <div className="mb-4">
              {selectedProduct.mostrarCategoria && <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {selectedProduct.categoria}
              </span>}
            </div>
            
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">{selectedProduct.familia || selectedProduct.nombre}</h1>
              {variants.length > 1 && (
                hasDimensions ? (
                  <div className="mb-5 grid grid-cols-2 gap-3">
                    <label className="text-sm font-medium">
                      Ancho
                      <select
                        value={selectedDimensions?.width || widths[0] || ''}
                        onChange={(event) => {
                          const next = dimensionOptions.find((item) => item.dimensions?.width === event.currentTarget.value)?.variant
                          if (next) { setSelectedSku(next.sku); setQuantity(1) }
                        }}
                        className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3"
                      >
                        {widths.map((width) => <option key={width} value={width}>{width}</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-medium">
                      Largo
                      <select
                        value={selectedDimensions?.length || ''}
                        onChange={(event) => {
                          const next = dimensionOptions.find((item) =>
                            item.dimensions && item.dimensions.width === selectedDimensions?.width &&
                            item.dimensions.length === event.currentTarget.value,
                          )?.variant
                          if (next) { setSelectedSku(next.sku); setQuantity(1) }
                        }}
                        className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3"
                      >
                        {lengths.map((length) => <option key={length} value={length}>{length}</option>)}
                      </select>
                    </label>
                  </div>
                ) : (
                  <label className="mb-5 text-sm font-medium">
                    Variante
                    <select
                      value={selectedProduct.sku}
                      onChange={(event) => { setSelectedSku(event.currentTarget.value); setQuantity(1) }}
                      className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3"
                    >
                      {variants.map((variant) => <option key={variant.sku} value={variant.sku}>{variant.medidas || variant.sku}</option>)}
                    </select>
                  </label>
                )
              )}
              {selectedProduct.mostrarSku && <p className="text-sm sm:text-lg text-muted-foreground mb-4">SKU: {selectedProduct.sku}</p>}
            
              {selectedProduct.mostrarTipo && selectedProduct.tipo && (
              <div className="mb-4">
                <span className="text-sm font-medium">Tipo: </span>
                <span className="text-sm text-muted-foreground">{tipoLabels[selectedProduct.tipo] || selectedProduct.tipo}</span>
              </div>
            )}
            
            {selectedProduct.mostrarMedidas && selectedProduct.medidas && (
              <div className="mb-4">
                <span className="text-sm font-medium">Medidas: </span>
                <span className="text-sm text-muted-foreground">{selectedProduct.medidas}</span>
              </div>
            )}
            
            {selectedProduct.mostrarPrecio && <div className="mb-6">
              <p className="text-3xl sm:text-4xl font-semibold tracking-tight">{Number(selectedProduct.precio) > 0 ? money(Number(selectedProduct.precio)) : 'Precio pendiente'}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">por {selectedProduct.unidad}</p>
            </div>}
            
            {selectedProduct.mostrarDescripcion && selectedProduct.descripcion && (
              <p className="text-muted-foreground mb-6">{selectedProduct.descripcion}</p>
            )}
            
            {/* Selector de cantidad y botón agregar */}
            <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <label className="text-sm font-medium">
                Cantidad
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.stock}
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(Math.max(1, Math.min(selectedProduct.stock || 1, Number(event.currentTarget.value) || 1)))}
                  className="mt-1 h-12 w-32 rounded-lg border border-input bg-background px-3"
                />
              </label>
              <button 
                onClick={handleAddToCart}
                disabled={selectedProduct.stock < quantity || selectedProduct.stock === 0 || Number(selectedProduct.precio) <= 0}
                className="flex-1 rounded-lg bg-primary px-4 sm:px-6 py-4 min-h-[48px] font-medium text-primary-foreground hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base transition-opacity cursor-pointer"
              >
                <ShoppingCart className="mr-2 inline size-4" />
                Agregar al carrito
              </button>
            </div>
            
            {selectedProduct.mostrarStock && <div className="mb-8">
              <p className="text-sm font-medium mb-2">Disponibilidad: </p>
              <p className={`text-sm ${selectedProduct.stock > 10 ? 'text-green-600' : selectedProduct.stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                {selectedProduct.stock > 10 ? `${selectedProduct.stock} unidades disponibles` : selectedProduct.stock > 0 ? `Solo ${selectedProduct.stock} unidades disponibles` : 'Agotado'}
              </p>
            </div>}
            
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-6">
              <h3 className="font-semibold mb-3">Información del producto</h3>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {selectedProduct.mostrarCategoria && <div><dt className="inline font-medium">Categoría: </dt><dd className="inline text-muted-foreground">{selectedProduct.categoria}</dd></div>}
                {selectedProduct.mostrarSku && <div><dt className="inline font-medium">Código: </dt><dd className="inline text-muted-foreground">{selectedProduct.sku}</dd></div>}
                <div><dt className="inline font-medium">Unidad de venta: </dt><dd className="inline text-muted-foreground">{selectedProduct.unidad}</dd></div>
              </dl>
            </div>
            
            {/* Descripción detallada */}
            {selectedProduct.mostrarDescripcionDetallada && selectedProduct.descripcionDetallada && (
              <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
                <h3 className="font-semibold mb-4">Especificaciones técnicas</h3>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line text-xs sm:text-sm">
                  {selectedProduct.descripcionDetallada}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <IosToast 
        show={showToast} 
        message={`${quantity} ${selectedProduct.nombre} agregado al carrito`}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}
