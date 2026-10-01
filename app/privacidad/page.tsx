import Link from 'next/link'

export const metadata = {
  title: 'Política de privacidad | TORNILLOS JEHOVA JIREH',
  description: 'Información sobre el tratamiento de datos personales y tecnologías de almacenamiento.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-3xl px-5 py-12 md:px-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Volver al inicio</Link>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Política de privacidad</h1>
        <p className="mt-3 text-sm text-muted-foreground">Última actualización: 1 de octubre de 2026</p>
        <div className="mt-8 space-y-7 text-sm leading-7">
          <section><h2 className="text-xl font-semibold">Responsable</h2><p className="mt-2">TORNILLOS JEHOVA JIREH, Guatemala. Para consultas sobre tus datos puedes escribirnos por WhatsApp desde la sección de contacto del sitio.</p></section>
          <section><h2 className="text-xl font-semibold">Datos que podemos recibir</h2><p className="mt-2">Podemos recibir nombre, teléfono, correo, NIT, empresa, dirección de entrega y los datos que incluyas al solicitar una cotización, registrarte o realizar un pedido.</p></section>
          <section><h2 className="text-xl font-semibold">Finalidad</h2><p className="mt-2">Usamos la información para atender consultas, preparar cotizaciones, procesar pedidos, coordinar entregas, facturar y responder solicitudes de soporte. No vendemos tus datos personales.</p></section>
          <section><h2 className="text-xl font-semibold">Almacenamiento y Analytics</h2><p className="mt-2">El carrito se guarda localmente en tu navegador para que puedas continuar tu compra. Google Analytics y Vercel Analytics solo se cargan si aceptas el análisis en el aviso de privacidad. Si lo rechazas, el sitio y el catálogo siguen funcionando.</p></section>
          <section><h2 className="text-xl font-semibold">Conservación y derechos</h2><p className="mt-2">Conservamos la información durante el tiempo necesario para la finalidad correspondiente y obligaciones aplicables. Puedes solicitar acceso, corrección o eliminación de tus datos contactándonos por WhatsApp.</p></section>
          <section><h2 className="text-xl font-semibold">Cambios</h2><p className="mt-2">Podemos actualizar esta política cuando cambien nuestros servicios o las obligaciones aplicables. Publicaremos la versión vigente en esta página.</p></section>
        </div>
      </article>
    </main>
  )
}
