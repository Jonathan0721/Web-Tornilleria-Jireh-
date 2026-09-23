# Guía de Despliegue - Tornilleria Jehova Jireh

Esta guía te ayudará a configurar y desplegar el proyecto de e-commerce de Tornilleria Jehova Jireh.

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de Base de Datos (Supabase)](#configuración-de-base-de-datos-supabase)
3. [Configuración del Proyecto](#configuración-del-proyecto)
4. [Ejecución en Desarrollo](#ejecución-en-desarrollo)
5. [Despliegue en Producción](#despliegue-en-producción)
6. [Seguridad](#seguridad)
7. [Recomendaciones Adicionales](#recomendaciones-adicionales)

---

## 🔧 Requisitos Previos

- Node.js 18+ instalado
- Cuenta en Supabase (o PostgreSQL)
- Git instalado
- Editor de código (VS Code recomendado)

---

## 🗄️ Configuración de Base de Datos (Supabase)

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que el proyecto esté listo (2-3 minutos)

### 2. Ejecutar Script SQL

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Abre el archivo `supabase-setup.sql` del proyecto
3. Copia todo el contenido y pégalo en el SQL Editor
4. Haz clic en **Run** para ejecutar el script

Este script crea:
- Tablas: clientes, inventario, pedidos, pedido_items
- Tablas de autenticación (Better Auth)
- Índices para optimización
- Triggers para updated_at
- Políticas de seguridad (RLS)
- Datos de ejemplo iniciales

### 3. Obtener DATABASE_URL

1. En Supabase, ve a **Settings > Database**
2. Busca **Connection String**
3. Copia la URL con el formato:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

---

## ⚙️ Configuración del Proyecto

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

2. Edita el archivo `.env` con tus datos:

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://postgres:TU_PASSWORD@db.TU_PROYECTO.supabase.co:5432/postgres"

# Better Auth Configuration
BETTER_AUTH_URL="http://localhost:3000"

# Entorno
NODE_ENV="development"
```

**IMPORTANTE:** Nunca commits el archivo `.env` al repositorio.

### 3. Crear Primer Usuario Admin

1. Inicia el servidor de desarrollo:
```bash
npm run dev
```

2. Ve a `http://localhost:3000/sign-in`
3. Haz clic en "Crear cuenta admin"
4. Regístrate con tu email y contraseña
5. Este será tu usuario administrador

---

## 🚀 Ejecución en Desarrollo

### Iniciar Servidor

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

### Acceder al Panel Admin

1. Ve a `http://localhost:3000/sign-in`
2. Inicia sesión con tu usuario admin
3. Serás redirigido automáticamente a `/admin`

### Rutas Principales

- `/` - Página de inicio
- `/catalogo` - Catálogo de productos
- `/registro` - Registro de clientes
- `/sign-in` - Login admin
- `/admin` - Panel de administración (protegido)

---

## 🌐 Despliegue en Producción

### Opción 1: Vercel (Recomendado)

1. **Instalar Vercel CLI**
```bash
npm install -g vercel
```

2. **Login en Vercel**
```bash
vercel login
```

3. **Desplegar**
```bash
vercel
```

4. **Configurar Variables de Entorno en Vercel**
   - Ve al dashboard de Vercel
   - Tu proyecto > Settings > Environment Variables
   - Agrega:
     - `DATABASE_URL` (tu URL de Supabase)
     - `BETTER_AUTH_URL` (tu URL de producción, ej: `https://tu-app.vercel.app`)
     - `NODE_ENV` = `production`

5. **Redesplegar después de configurar variables**
```bash
vercel --prod
```

### Opción 2: V0 (v0.dev)

1. Sube tu proyecto a GitHub
2. Ve a [v0.dev](https://v0.dev)
3. Importa tu repositorio
4. V0 detectará automáticamente tu proyecto Next.js
5. Configura las variables de entorno en el dashboard de V0

### Opción 3: Docker

1. Crear `Dockerfile` (si no existe):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

2. Construir imagen:
```bash
docker build -t tornilleria-app .
```

3. Ejecutar contenedor:
```bash
docker run -p 3000:3000 -e DATABASE_URL="tu_url" tornilleria-app
```

---

## 🔒 Seguridad

### Autenticación de Admin

- La ruta `/admin` está protegida por middleware
- Solo usuarios autenticados pueden acceder
- Las sesiones expiran en 7 días
- Usa contraseñas fuertes (mínimo 8 caracteres)

### Protección de API Routes

- **Rate Limiting:**
  - Pedidos: 10 por hora por IP
  - Clientes: 30 consultas por hora por IP

- **Validación de Datos:**
  - Sanitización de inputs
  - Validación de campos requeridos
  - Límites de longitud de strings

### Row Level Security (RLS)

- Las tablas de base de datos tienen RLS habilitado
- Lectura pública para inventario y clientes
- Escritura solo para usuarios autenticados
- Pedidos solo accesibles por usuarios autenticados

### HTTPS

- Siempre usa HTTPS en producción
- Vercel proporciona SSL gratis
- Configura `BETTER_AUTH_URL` con `https://`

---

## 💡 Recomendaciones Adicionales

### 1. Pasarela de Pagos

Actualmente el proyecto no tiene pasarela de pagos integrada. Recomendaciones:

- **Stripe:** Popular, buena documentación
- **PayPal:** Fácil integración
- **Mercado Pago:** Ideal para Latinoamérica
- **Culqi:** Opción para Perú

### 2. Monitoreo y Analytics

- **Vercel Analytics:** Viene incluido en el proyecto
- **Sentry:** Para error tracking
- **Google Analytics:** Para análisis de tráfico

### 3. Backup de Base de Datos

Supabase tiene backups automáticos, pero puedes:
- Configurar backups diarios
- Exportar datos regularmente
- Usar pg_dump para backups manuales

### 4. Optimización de Imágenes

- Usa WebP para imágenes
- Comprime imágenes antes de subir
- Considera usar CDN (Cloudflare, AWS CloudFront)

### 5. SEO

- El proyecto ya tiene meta tags configurados
- Agrega sitemap.xml para mejor indexación
- Configura robots.txt
- Usa Google Search Console

### 6. Testing

Antes de desplegar a producción:
- Prueba el flujo completo de compra
- Verifica que el login admin funcione
- Prueba en múltiples dispositivos (móvil, tablet, desktop)
- Verifica que los botones funcionen en móvil

### 7. Logs y Debugging

- Los errores se loguean en consola
- En producción, considera usar servicio de logs
- Configura alertas para errores críticos

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs del servidor
2. Verifica que las variables de entorno estén correctas
3. Confirma que la base de datos esté accesible
4. Revisa la consola del navegador para errores de JavaScript

---

## ✅ Checklist antes de Publicar

- [ ] Base de datos configurada en Supabase
- [ ] Script SQL ejecutado correctamente
- [ ] Variables de entorno configuradas
- [ ] Usuario admin creado
- [ ] Datos de prueba agregados al inventario
- [ ] Flujo de compra probado
- [ ] Login admin probado
- [ ] Botones probados en móvil
- [ ] HTTPS configurado
- [ ] Rate limiting verificado

---

## 🎯 Próximos Pasos

1. Configurar pasarela de pagos
2. Agregar más productos al inventario
3. Configurar notificaciones por email
4. Implementar sistema de facturación
5. Agregar chat en vivo
6. Optimizar SEO
7. Configurar analytics avanzado

---

**¡Tu proyecto está listo para publicar! 🚀**
