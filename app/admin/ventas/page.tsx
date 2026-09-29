import { listSalesDocuments } from '@/app/actions/sales-documents'
import AdminSalesWorkspace from '@/components/admin-sales-workspace'
import { requireAdminPage } from '@/lib/admin-auth'

export default async function VentasPage() {
  await requireAdminPage()
  const documents = await listSalesDocuments()
  return <AdminSalesWorkspace initialDocuments={documents} />
}
