'use client'

import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Factory,
  MapPin,
  MessageCircle,
  Package,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react'
import Link from 'next/link'

/** Pon aquí el número con código de país, sin + ni espacios. Ej: 50212345678 */
const WHATSAPP_NUMBER = '50256125894'

const categories = [
  {
    name: 'Tornillos',
    description: 'Hexagonales, autorroscantes y más medidas listas para obra.',
    href: '/catalogo',
    icon: Wrench,
  },
  {
    name: 'Tuercas',
    description: 'Hexagonales, autoblocantes y zincadas para cada fijación.',
    href: '/catalogo',
    icon: Package,
  },
  {
    name: 'Arandelas',
    description: 'Planas, de presión y acabados para protección y ajuste.',
    href: '/catalogo',
    icon: ShieldCheck,
  },
  {
    name: 'Kits',
    description: 'Sets profesionales para no quedarte corto en el proyecto.',
    href: '/catalogo#kits',
    icon: Factory,
  },
]

const steps = [
  {
    step: '01',
    title: 'Explora el catálogo',
    description: 'Filtra por categoría, revisa stock y precios en quetzales.',
  },
  {
    step: '02',
    title: 'Arma tu pedido',
    description: 'Agrega lo que necesitas al carrito en segundos.',
  },
  {
    step: '03',
    title: 'Confirma fácil',
    description: 'Confirma el pedido en la web; WhatsApp queda como apoyo si lo necesitas.',
  },
]

export default function TornilleriaHome() {
  const whatsappHref = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        'Hola, vengo de la web de Tornilleria Jehova Jireh. Quiero cotizar / pedir.',
      )}`
    : '#contacto'

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link
            href="/"
            className="flex min-h-[44px] items-center gap-3 px-1 py-1 transition-opacity hover:opacity-80 active:opacity-70"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary font-mono text-lg font-bold text-primary-foreground">
              TJ
            </span>
            <span>
              <strong className="block tracking-tight">Tornilleria Jehova Jireh</strong>
              <small className="text-xs text-muted-foreground">Suministros industriales</small>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm sm:gap-3">
            <Link
              href="/registro"
              className="hidden min-h-[44px] items-center rounded-lg px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              Registrarse
            </Link>
            <a
              href={whatsappHref}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-input px-3 py-2 font-medium transition-colors hover:bg-muted"
            >
              <MessageCircle className="mr-1.5 size-4" />
              Contacto
            </a>
            <Link
              href="/catalogo"
              className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Catálogo
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-10 md:px-8 md:pb-24 md:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <p className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              <MapPin className="size-4" />
              Hecho para Guatemala
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              La fijación correcta cambia todo.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              Tornillos, tuercas y soluciones industriales para construcción, taller y
              proyectos que no pueden esperar. Compra fácil, precios en quetzales y
              atención local.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                href="/catalogo"
                className="inline-flex min-h-[48px] items-center rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Comprar en el catálogo
                <ArrowRight className="ml-2 size-4" />
              </Link>
              <a
                href={whatsappHref}
                className="inline-flex min-h-[48px] items-center rounded-lg border border-input px-5 py-3 font-medium transition-colors hover:bg-muted"
              >
                <MessageCircle className="mr-2 size-4" />
                WhatsApp
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <span>
                <CheckCircle2 className="mr-2 inline size-4 text-primary" />
                Stock visible
              </span>
              <span>
                <CheckCircle2 className="mr-2 inline size-4 text-primary" />
                Precios en quetzales
              </span>
              <span>
                <CheckCircle2 className="mr-2 inline size-4 text-primary" />
                Atención local
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground md:p-12">
            <div className="pointer-events-none absolute right-[-20px] top-[-30px] font-mono text-[160px] font-bold leading-none opacity-10 md:text-[180px]">
              TJ
            </div>
            <div className="relative">
              <Factory className="size-10 opacity-80" />
              <p className="mt-16 max-w-sm text-2xl font-semibold leading-tight sm:mt-20 sm:text-3xl">
                Suministros confiables para construcción, industria y automotriz.
              </p>
              <div className="mt-10 grid gap-4 border-t border-primary-foreground/20 pt-6 text-sm sm:mt-12">
                <span>
                  <Truck className="mr-2 inline size-4" />
                  Entregas a todo el país
                </span>
                <span>
                  <ShieldCheck className="mr-2 inline size-4" />
                  Calidad garantizada
                </span>
                <span>
                  <Package className="mr-2 inline size-4" />
                  Medidas claras y listos para pedir
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/50">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Catálogo
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Encuentra lo que necesitas
              </h2>
            </div>
            <Link
              href="/catalogo"
              className="inline-flex min-h-[44px] items-center font-medium text-foreground transition-opacity hover:opacity-80"
            >
              Ver todo
              <ChevronRight className="ml-1 size-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Link
                  key={category.name}
                  href={category.href}
                  className="group rounded-2xl border border-border bg-background p-5 transition-colors hover:border-foreground/20 hover:bg-card"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <p className="mt-5 text-lg font-semibold">{category.name}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {category.description}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Cómo comprar
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Simple, claro y sin vueltas
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="rounded-2xl border border-border p-6">
              <p className="font-mono text-sm font-semibold text-primary">{item.step}</p>
              <p className="mt-4 text-xl font-semibold">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contacto" className="border-t border-border bg-muted/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Contacto
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              ¿Listo para cotizar o pedir?
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Escríbenos por WhatsApp con tu lista o visita el catálogo para armar el
              pedido. Te ayudamos a elegir la medida correcta.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={whatsappHref}
                className="inline-flex min-h-[48px] items-center rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <MessageCircle className="mr-2 size-4" />
                WhatsApp
              </a>
              <Link
                href="/catalogo"
                className="inline-flex min-h-[48px] items-center rounded-lg border border-input px-5 py-3 font-medium transition-colors hover:bg-background"
              >
                Ir al catálogo
              </Link>
              <Link
                href="/registro"
                className="inline-flex min-h-[48px] items-center rounded-lg border border-input px-5 py-3 font-medium transition-colors hover:bg-background"
              >
                Registrarme
              </Link>
            </div>
          </div>
          <div className="grid gap-4 self-start rounded-2xl border border-border bg-background p-6 text-sm leading-6">
            <div>
              <p className="font-semibold">Negocio</p>
              <p className="mt-1 text-muted-foreground">Tornilleria Jehova Jireh</p>
            </div>
            <div>
              <p className="font-semibold">Qué vendemos</p>
              <p className="mt-1 text-muted-foreground">
                Tornillería y suministros industriales para Guatemala
              </p>
            </div>
            <div>
              <p className="font-semibold">Horario</p>
              <p className="mt-1 text-muted-foreground">
                Lun–Sáb · confirma disponibilidad por WhatsApp
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-8">
          <span>© 2026 Tornilleria Jehova Jireh · Guatemala</span>
          <div className="flex flex-wrap gap-4">
            <Link href="/catalogo" className="font-medium text-foreground transition-opacity hover:opacity-80">
              Catálogo
            </Link>
            <a href={whatsappHref} className="font-medium text-foreground transition-opacity hover:opacity-80">
              Contacto
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
