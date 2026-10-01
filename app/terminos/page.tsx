import Link from 'next/link'

export const metadata = {
  title: 'Términos y condiciones | TORNILLOS JEHOVA JIREH',
  description: 'Términos de uso, cotización, pedidos y entregas.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-3xl px-5 py-12 md:px-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Volver al inicio</Link>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Términos y condiciones</h1>
        <p className="mt-3 text-sm text-muted-foreground">Última actualización: 1 de octubre de 2026</p>
        <div className="mt-8 space-y-7 text-sm leading-7">
          <section><h2 className="text-xl font-semibold">Uso del sitio</h2><p className="mt-2">El sitio permite consultar productos, solicitar cotizaciones y preparar pedidos. La información debe ser proporcionada de forma verdadera y actualizada.</p></section>
          <section><h2 className="text-xl font-semibold">Precios y disponibilidad</h2><p className="mt-2">Los precios, existencias y tiempos de entrega pueden cambiar. Una solicitud enviada por la web no constituye una venta confirmada hasta que sea validada por TORNILLOS JEHOVA JIREH.</p></section>
          <section><h2 className="text-xl font-semibold">Pedidos y entregas</h2><p className="mt-2">Confirmaremos por los medios de contacto proporcionados los productos, cantidades, total, forma de pago y entrega. Cualquier cambio o cancelación debe solicitarse antes de la preparación del pedido.</p></section>
          <section><h2 className="text-xl font-semibold">Propiedad y responsabilidad</h2><p className="mt-2">El contenido del sitio se ofrece de buena fe. No garantizamos disponibilidad permanente ni ausencia de errores tipográficos, y corregiremos la información cuando sea necesario.</p></section>
          <section><h2 className="text-xl font-semibold">Contacto</h2><p className="mt-2">Para dudas sobre pedidos, devoluciones, privacidad o estos términos, utiliza el contacto por WhatsApp disponible en la web.</p></section>
        </div>
      </article>
    </main>
  )
}
