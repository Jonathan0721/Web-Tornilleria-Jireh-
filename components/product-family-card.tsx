'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { CatalogProduct, getProductDimensions } from '@/lib/product-variants'

const money = (value: number) =>
  new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value)

export function ProductFamilyCard({
  family,
  variants,
}: {
  family: string
  variants: CatalogProduct[]
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id || '')
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()
  const selected = variants.find((variant) => variant.id === selectedId) || variants[0]
  const familyImage = selected.imagen || variants.find((variant) => variant.imagen)?.imagen
  const dimensionOptions = useMemo(() => variants.map((variant) => ({
    variant,
    dimensions: getProductDimensions(variant.medidas),
  })), [variants])
  const hasDimensions = variants.length > 1 && dimensionOptions.every((item) => item.dimensions !== null)
  const widths = [...new Set(dimensionOptions.flatMap((item) => item.dimensions ? [item.dimensions.width] : []))]
  const selectedDimensions = getProductDimensions(selected.medidas)
  const width = selectedDimensions?.width || widths[0] || ''
  const lengths = [...new Set(dimensionOptions.flatMap((item) =>
    item.dimensions?.width === width ? [item.dimensions.length] : [],
  ))]
  const purchasable = selected.stock > 0 && selected.price > 0
  const unavailableReason = selected.price <= 0 ? 'Precio pendiente' : 'Agotado'

  function selectWidth(value: string) {
    const next = dimensionOptions.find((item) =>
      item.dimensions?.width === value && (lengths.includes(item.dimensions.length)),
    )?.variant || dimensionOptions.find((item) => item.dimensions?.width === value)?.variant
    if (next) {
      setSelectedId(next.id)
      setQuantity(1)
    }
  }

  function selectLength(value: string) {
    const next = dimensionOptions.find((item) =>
      item.dimensions?.width === width && item.dimensions.length === value,
    )?.variant
    if (next) {
      setSelectedId(next.id)
      setQuantity(1)
    }
  }

  return (
    <article className="rounded-xl border border-border bg-card p-4 sm:p-5">
      {selected.mostrarImagen !== false && (
        <div className="flex aspect-[1.6] items-center justify-center overflow-hidden rounded-lg bg-muted sm:aspect-[1.5]">
          {familyImage ? (
            <img src={familyImage} alt={family} className="h-full w-full object-contain" />
          ) : (
            <div className="h-3 w-28 rotate-[-18deg] rounded-full bg-primary/80 shadow-[0_6px_0_#9ca3af] sm:w-32" />
          )}
        </div>
      )}

      <div className="mt-4">
        {(selected.mostrarCategoria !== false || selected.mostrarSku !== false) && (
          <p className="text-xs text-muted-foreground">
            {selected.mostrarCategoria !== false ? selected.category : ''}
            {selected.mostrarCategoria !== false && selected.mostrarSku !== false ? ' · ' : ''}
            {selected.mostrarSku !== false ? selected.sku || selected.id : ''}
          </p>
        )}
        <h3 className="mt-1 text-base font-semibold leading-6">{family}</h3>
        {selected.mostrarDescripcion !== false && selected.descripcion && (
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{selected.descripcion}</p>
        )}
      </div>

      {hasDimensions ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-muted-foreground">
            Ancho
            <select
              value={width}
              onChange={(event) => selectWidth(event.currentTarget.value)}
              className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            >
              {widths.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Largo
            <select
              value={selectedDimensions?.length || ''}
              onChange={(event) => selectLength(event.currentTarget.value)}
              className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            >
              {lengths.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
      ) : variants.length > 1 ? (
        <label className="mt-4 block text-xs font-medium text-muted-foreground">
          Variante
          <select
            value={selected.id}
            onChange={(event) => { setSelectedId(event.currentTarget.value); setQuantity(1) }}
            className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
          >
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>{variant.medidas || variant.sku || variant.id}</option>
            ))}
          </select>
        </label>
      ) : selected.mostrarMedidas !== false && selected.medidas ? (
        <p className="mt-2 text-xs text-muted-foreground">{selected.medidas}</p>
      ) : null}

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          {selected.mostrarPrecio !== false && (
            <p className="font-semibold">
              {selected.price > 0 ? money(selected.price) : 'Precio pendiente'}
              {selected.price > 0 && <span className="block text-xs font-normal text-muted-foreground">/ {selected.unit}</span>}
            </p>
          )}
          {selected.mostrarStock !== false && (
            <p className={`mt-1 text-xs ${selected.stock > 10 ? 'text-green-600' : selected.stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
              {selected.stock > 0 ? `${selected.stock} disponibles` : 'Agotado'}
            </p>
          )}
        </div>
        <label className="text-xs text-muted-foreground">
          Cantidad
          <input
            type="number"
            min="1"
            max={selected.stock}
            step="1"
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Math.min(selected.stock || 1, Number(event.currentTarget.value) || 1)))}
            className="mt-1 h-11 w-24 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            aria-label={`Cantidad de ${selected.name}`}
          />
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Link href={`/producto/${selected.sku || selected.id}`} className="text-sm font-medium text-primary hover:underline">
          Ver detalles
        </Link>
        <button
          type="button"
          onClick={() => addToCart({ ...selected, id: selected.sku || selected.id }, quantity)}
          disabled={!purchasable || quantity > selected.stock}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Plus className="size-4" />
          {purchasable ? 'Añadir' : unavailableReason}
        </button>
      </div>
    </article>
  )
}
