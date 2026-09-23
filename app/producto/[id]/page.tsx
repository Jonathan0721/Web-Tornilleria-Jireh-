import { notFound } from 'next/navigation'
import TornilleriaProductDetail from '@/components/tornilleria-product-detail'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  // NOTA: Cuando configures la base de datos, descomenta esto y usa datos reales
  // const product = await getProductById(params.id)
  // if (!product) notFound()
  
  const { id } = await params
  
  // Datos temporales de ejemplo
  const product = {
    id: id,
    sku: 'TH-M8-40',
    nombre: 'Tornillo hexagonal M8 x 40',
    categoria: 'Tornillos',
    tipo: 'galvanizado',
    medidas: 'M8 x 40',
    descripcion: 'Tornillo hexagonal de alta resistencia para aplicaciones industriales',
    descripcionDetallada: 'Tornillo hexagonal galvanizado de grado 8.2, diseñado para aplicaciones que requieren alta resistencia a la corrosión y carga. Cumple con normas ISO 4017. Ideal para construcción metálica, maquinaria industrial y estructuras expuestas a ambientes húmedos.\n\nEspecificaciones:\n- Diámetro: M8\n- Longitud: 40mm\n- Material: Acero al carbono\n- Acabado: Galvanizado en caliente\n- Grado: 8.8\n- Norma: ISO 4017\n- Rosca: Métrica fina',
    imagen: null,
    precio: '0.18',
    stock: 248,
    unidad: 'ud.'
  }
  
  return <TornilleriaProductDetail product={product} />
}
