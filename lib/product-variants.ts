export type CatalogProduct = {
  id: string
  sku?: string
  name: string
  family?: string | null
  category: string
  price: number
  stock: number
  unit: string
  imagen?: string | null
  tipo?: string | null
  medidas?: string | null
  descripcion?: string | null
  descripcionDetallada?: string | null
  mostrarSku?: boolean
  mostrarCategoria?: boolean
  mostrarPrecio?: boolean
  mostrarStock?: boolean
  mostrarTipo?: boolean
  mostrarMedidas?: boolean
  mostrarDescripcion?: boolean
  mostrarDescripcionDetallada?: boolean
  mostrarImagen?: boolean
}

export function getProductDimensions(measures?: string | null) {
  if (!measures) return null
  const match = measures.trim().match(/^(.+?)\s*[xX×]\s*(.+)$/)
  if (!match) return null
  return { width: match[1].trim(), length: match[2].trim() }
}
