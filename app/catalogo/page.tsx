import TornilleriaStore from '@/components/tornilleria-store'
import { db } from '@/lib/db'
import { inventario } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function CatalogoPage() {
  // Obtener productos activos de la base de datos
  const products = await db.select().from(inventario).where(eq(inventario.activo, true))
  
  const initialProducts = products.map(p => ({
    id: p.sku || p.id,
    name: p.nombre,
    category: p.categoria,
    price: Number(p.precio),
    stock: p.stock,
    unit: p.unidad,
    sku: p.sku,
    tipo: p.tipo,
    medidas: p.medidas,
    descripcion: p.descripcion,
    imagen: p.imagen
  }))
  
  return <TornilleriaStore initialProducts={initialProducts} />
}
