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

export function compareDimensionValues(left: string, right: string) {
  const leftValue = parseFractionalSize(left)
  const rightValue = parseFractionalSize(right)
  if (leftValue !== null && rightValue !== null) return leftValue - rightValue
  return left.localeCompare(right, 'es', { numeric: true, sensitivity: 'base' })
}

function parseFractionalSize(value: string) {
  const match = value.trim().match(/^(\d+)(?:-(\d+)\/(\d+)|\/(\d+))?$/)
  if (!match) return null
  const whole = Number(match[1])
  if (match[4]) return whole / Number(match[4])
  if (match[2] && match[3]) return whole + Number(match[2]) / Number(match[3])
  return whole
}

export function compareProductDimensions(left?: string | null, right?: string | null) {
  const leftDimensions = getProductDimensions(left)
  const rightDimensions = getProductDimensions(right)
  if (!leftDimensions || !rightDimensions) {
    return (left || '').localeCompare(right || '', 'es', { numeric: true, sensitivity: 'base' })
  }
  return compareDimensionValues(leftDimensions.width, rightDimensions.width)
    || compareDimensionValues(leftDimensions.length, rightDimensions.length)
}
