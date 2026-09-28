import { notFound } from 'next/navigation'
import TornilleriaProductDetail from '@/components/tornilleria-product-detail'
import { db } from '@/lib/db'
import { inventario } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

async function getProductById(id: string) {
  const [productBySku] = await db.select().from(inventario).where(
    and(eq(inventario.sku, id), eq(inventario.activo, true))
  ).limit(1)
  if (productBySku) return productBySku

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return undefined
  }

  const [productById] = await db.select().from(inventario).where(
    and(eq(inventario.id, id), eq(inventario.activo, true))
  ).limit(1)
  return productById
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProductById(id)
  
  if (!product) {
    notFound()
  }
  
  return <TornilleriaProductDetail product={product} />
}
