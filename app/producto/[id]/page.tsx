import { notFound } from 'next/navigation'
import TornilleriaProductDetail from '@/components/tornilleria-product-detail'
import { db } from '@/lib/db'
import { inventario } from '@/lib/db/schema'
import { eq, or } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

async function getProductById(id: string) {
  const products = await db.select().from(inventario).where(
    or(
      eq(inventario.sku, id),
      eq(inventario.id, id)
    )
  )
  return products[0]
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProductById(id)
  
  if (!product) {
    notFound()
  }
  
  return <TornilleriaProductDetail product={product} />
}
