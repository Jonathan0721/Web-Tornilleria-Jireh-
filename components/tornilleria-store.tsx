'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Plus, ShieldCheck, Truck, MessageCircle } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { CartPreview } from './cart-preview'

const products = [
  { id: 'TH-M8-40', name: 'Tornillo hexagonal M8 x 40', category: 'Tornillos', price: 0.18, stock: 248, unit: 'ud.', tipo: 'galvanizado', medidas: 'M8 x 40', descripcion: 'Tornillo hexagonal galvanizado de alta resistencia' },
  { id: 'TH-M10-60', name: 'Tornillo hexagonal M10 x 60', category: 'Tornillos', price: 0.29, stock: 186, unit: 'ud.', tipo: 'grado8', medidas: 'M10 x 60', descripcion: 'Tornillo hexagonal grado 8 para aplicaciones de alta carga' },
  { id: 'TA-M10', name: 'Tuerca autoblocante M10', category: 'Tuercas', price: 0.24, stock: 84, unit: 'ud.', tipo: 'seguridad', medidas: 'M10', descripcion: 'Tuerca autoblocante con anillo de nylon para seguridad' },
  { id: 'AP-M6-ZN', name: 'Arandela plana zincada M6', category: 'Arandelas', price: 0.06, stock: 512, unit: 'ud.', tipo: 'zincado', medidas: 'M6', descripcion: 'Arandela plana zincada para protección contra corrosión' },
  { id: 'KIT-120', name: 'Kit de fijación profesional 120 pzs.', category: 'Kits', price: 12.9, stock: 19, unit: 'kit', descripcion: 'Kit completo de fijación para proyectos profesionales' },
  { id: 'TA-M8', name: 'Tuerca hexagonal M8 zincada', category: 'Tuercas', price: 0.12, stock: 340, unit: 'ud.', tipo: 'zincado', medidas: 'M8', descripcion: 'Tuerca hexagonal zincada estándar' },
]

const money = (value: number) => new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(value)

type StoreProduct = { id: string; name: string; category: string; price: number; stock: number; unit: string; imagen?: string; tipo?: string; medidas?: string; descripcion?: string }

export function TornilleriaStore({ initialProducts = [] }: { initialProducts?: StoreProduct[] }) {
  const catalogProducts = initialProducts.length ? initialProducts : products
  const { addToCart } = useCart()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todos')
  const categories = ['Todos', 'Tornillos', 'Tuercas', 'Arandelas', 'Kits']
  const visible = catalogProducts.filter((p) => (category === 'Todos' || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-5 md:px-8">
          <a href="/" className="flex min-h-[44px] min-w-0 shrink items-center gap-2 sm:gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary font-mono font-bold text-primary-foreground">TJ</span>
            <span className="min-w-0">
              <strong className="block truncate text-sm tracking-tight sm:text-base">Tornilleria Jehova Jireh</strong>
              <small className="hidden text-xs text-muted-foreground sm:block">Suministros industriales</small>
            </span>
          </a>
          <div className="relative ml-auto hidden max-w-xl flex-1 md:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar tornillos, tuercas, arandelas..."
              aria-label="Buscar productos"
              className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <a
            href="/registro"
            className="hidden min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted sm:inline-flex"
          >
            Registrarse
          </a>
          <div className="ml-auto sm:ml-0">
            <CartPreview />
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl px-4 pb-3 md:hidden">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar productos..."
              className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-3 text-base"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-10 md:px-8">
        <section className="grid gap-5 rounded-2xl bg-muted p-5 sm:gap-8 sm:p-7 md:grid-cols-[1.2fr_.8fr] md:p-12">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary sm:mb-4 sm:text-sm">Fijación profesional</p>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl md:text-6xl">Todo lo que necesitas para fijar bien.</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:mt-5 sm:text-base">Tornillería industrial de calidad, lista para taller u obra.</p>
            <a
              href={`https://wa.me/50256125894?text=${encodeURIComponent('Hola, quiero realizar una cotización desde el catálogo de Tornilleria Jehova Jireh.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground sm:mt-7"
            >
              <MessageCircle className="size-4" />
              Cotizar por WhatsApp
            </a>
          </div>
          <div className="flex flex-col justify-end gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <Truck className="size-5 shrink-0 text-primary" />
              <span className="text-sm font-medium">Envío rápido desde Q 35.00</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 shrink-0 text-primary" />
              <span className="text-sm font-medium">Calidad garantizada</span>
            </div>
          </div>
        </section>

        <section id="catalogo" className="scroll-mt-28 py-8 sm:py-12">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Catálogo</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Encuentra tu medida</h2>
            </div>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 min-h-[44px] text-sm ${
                    category === c
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-input text-muted-foreground'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {visible.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-border bg-card p-4 sm:p-5"
              >
                <Link href={`/producto/${p.id}`} className="block">
                  <div className="flex aspect-[1.6] items-center justify-center overflow-hidden rounded-lg bg-muted sm:aspect-[1.5]">
                    {p.imagen ? (
                      <img src={p.imagen} alt={p.name} className="h-full w-full object-contain" />
                    ) : (
                      <div className="h-3 w-28 rotate-[-18deg] rounded-full bg-primary/80 shadow-[0_6px_0_#9ca3af] sm:w-32" />
                    )}
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{p.category} · {p.id}</p>
                      <h3 className="mt-1 text-sm font-medium leading-5 sm:text-base sm:leading-6">{p.name}</h3>
                      {p.medidas ? <p className="mt-1 text-xs text-muted-foreground">{p.medidas}</p> : null}
                    </div>
                    <p className="shrink-0 text-right font-semibold">
                      {money(p.price)}
                      <span className="block text-xs font-normal text-muted-foreground">/ {p.unit}</span>
                    </p>
                  </div>
                </Link>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className={`text-xs ${p.stock > 10 ? 'text-green-600' : p.stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    {p.stock > 0 ? `${p.stock} disponibles` : 'Agotado'}
                  </span>
                  <button
                    onClick={() => addToCart(p, 1)}
                    disabled={p.stock === 0}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    <Plus className="size-4" /> Añadir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default TornilleriaStore
