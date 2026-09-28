import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getInventoryProducts } from '@/app/actions/inventory'
import TornilleriaDashboard from '@/components/tornilleria-dashboard'

export default async function InventarioPage() {
  const session = await auth.api.getSession({
    headers: new Headers({ cookie: (await cookies()).toString() }),
  })
  if (!session) redirect('/sign-in')

  const inventory = await getInventoryProducts()
  return (
    <TornilleriaDashboard
      activeSection="Inventario"
      inventory={inventory.map((product) => ({
        id: product.id,
        name: product.nombre,
        sku: product.sku,
        category: product.categoria,
        price: product.precio,
        stock: product.stock,
        stockMinimum: product.stockMinimo,
        unit: product.unidad,
        tipo: product.tipo || '',
        medidas: product.medidas || '',
        description: product.descripcion || '',
        detailedDescription: product.descripcionDetallada || '',
        image: product.imagen || '',
        active: product.activo,
        showSku: product.mostrarSku,
        showCategory: product.mostrarCategoria,
        showPrice: product.mostrarPrecio,
        showStock: product.mostrarStock,
        showTipo: product.mostrarTipo,
        showMeasures: product.mostrarMedidas,
        showDescription: product.mostrarDescripcion,
        showDetailedDescription: product.mostrarDescripcionDetallada,
        showImage: product.mostrarImagen,
      }))}
    />
  )
}
