import { ClientRegistrationForm } from '@/components/client-registration-form'

export const metadata = {
  title: 'Registro de cliente | Tornilleria Jehova Jireh',
  description: 'Registra tu empresa o datos personales para cotizaciones y facturación más rápidas.',
}

export default function RegistroPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-14">
        <a href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver al inicio
        </a>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Registro de cliente</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Deja los datos de tu empresa o los tuyos. Así, al facturar o cotizar, con el NIT
          podemos cargar la información automáticamente.
        </p>
        <div className="mt-8">
          <ClientRegistrationForm />
        </div>
      </div>
    </main>
  )
}
