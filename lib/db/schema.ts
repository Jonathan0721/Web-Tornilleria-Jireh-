import { boolean, integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull(),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull(),
  issuer: text('issuer'),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

export const clientes = pgTable('clientes', {
  id: uuid('id').primaryKey(),
  nombre: text('nombre').notNull(),
  email: text('email').notNull(),
  telefono: text('telefono'),
  nit: text('nit'),
  empresa: text('empresa'),
  direccion: text('direccion'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
export const inventario = pgTable('inventario', {
  id: uuid('id').primaryKey(),
  sku: text('sku').notNull(),
  familia: text('familia'),
  nombre: text('nombre').notNull(),
  categoria: text('categoria').notNull(),
  descripcion: text('descripcion'),
  descripcionDetallada: text('descripcion_detallada'),
  imagen: text('imagen'),
  tipo: text('tipo'),
  medidas: text('medidas'),
  precio: numeric('precio', { precision: 12, scale: 2 }).notNull(),
  stock: integer('stock').notNull(),
  stockMinimo: integer('stock_minimo').notNull(),
  unidad: text('unidad').notNull(),
  activo: boolean('activo').notNull(),
  mostrarSku: boolean('mostrar_sku').notNull().default(true),
  mostrarCategoria: boolean('mostrar_categoria').notNull().default(true),
  mostrarPrecio: boolean('mostrar_precio').notNull().default(true),
  mostrarStock: boolean('mostrar_stock').notNull().default(true),
  mostrarTipo: boolean('mostrar_tipo').notNull().default(true),
  mostrarMedidas: boolean('mostrar_medidas').notNull().default(true),
  mostrarDescripcion: boolean('mostrar_descripcion').notNull().default(true),
  mostrarDescripcionDetallada: boolean('mostrar_descripcion_detallada').notNull().default(true),
  mostrarImagen: boolean('mostrar_imagen').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
export const pedidos = pgTable('pedidos', { id: uuid('id').primaryKey(), numero: text('numero').notNull(), clienteId: uuid('cliente_id'), estado: text('estado').notNull(), subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(), impuestos: numeric('impuestos', { precision: 12, scale: 2 }).notNull(), total: numeric('total', { precision: 12, scale: 2 }).notNull(), notas: text('notas'), createdAt: timestamp('created_at').notNull().defaultNow(), updatedAt: timestamp('updated_at').notNull().defaultNow() })
export const pedidoItems = pgTable('pedido_items', { id: uuid('id').primaryKey(), pedidoId: uuid('pedido_id').notNull(), inventarioId: uuid('inventario_id'), sku: text('sku').notNull(), nombre: text('nombre').notNull(), cantidad: integer('cantidad').notNull(), precioUnitario: numeric('precio_unitario', { precision: 12, scale: 2 }).notNull(), total: numeric('total', { precision: 12, scale: 2 }).notNull() })
export const pedidoHistorial = pgTable('pedido_historial', {
  id: uuid('id').primaryKey(),
  pedidoId: uuid('pedido_id').notNull().references(() => pedidos.id, { onDelete: 'cascade' }),
  estadoAnterior: text('estado_anterior'),
  estadoNuevo: text('estado_nuevo').notNull(),
  cambiadoPor: text('cambiado_por'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
