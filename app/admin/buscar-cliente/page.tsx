import { NitLookupPanel } from '@/components/nit-lookup-panel'

export default function BuscarClientePage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-2xl">
        <a href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
          ← Admin
        </a>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Buscar cliente por NIT</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Para facturar: escribe el NIT y cargamos nombre, teléfono, empresa y dirección.
        </p>
        <div className="mt-8">
          <NitLookupPanel />
        </div>
      </div>
    </main>
  )
}
