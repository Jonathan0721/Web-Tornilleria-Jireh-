import TornilleriaDashboard from '@/components/tornilleria-dashboard'
import { requireAdminPage } from '@/lib/admin-auth'

export default async function CatalogoPage() {
  await requireAdminPage()
  return <TornilleriaDashboard activeSection="Catálogo" />
}
