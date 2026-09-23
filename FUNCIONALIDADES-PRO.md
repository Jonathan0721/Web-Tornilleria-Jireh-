# Funcionalidades Profesionales - Tornilleria Jehova Jireh

Este documento describe las funcionalidades profesionales implementadas en el proyecto.

## 📧 1. Notificaciones por Email (Resend)

### Configuración

1. **Crear cuenta en Resend:**
   - Ve a [resend.com](https://resend.com)
   - Regístrate y obtén tu API key
   - Verifica tu dominio de email

2. **Configurar variables de entorno:**
   ```env
   RESEND_API_KEY="re_your_api_key_here"
   EMAIL_FROM="noreply@tu-dominio.com"
   EMAIL_TO_ADMIN="admin@tu-dominio.com"
   ```

### Funcionalidades

- **Email de confirmación al cliente:** Se envía automáticamente cuando se crea un pedido con:
  - Número de pedido
  - Lista de productos
  - Total a pagar
  
- **Notificación al admin:** Se envía al admin cuando se recibe un nuevo pedido con:
  - Número de pedido
  - Datos del cliente
  - Total del pedido

### Archivos

- `lib/email.ts` - Funciones de envío de emails
- `app/actions/orders.ts` - Integración en creación de pedidos

---

## 📄 2. Sistema de Facturación (PDF)

### Funcionalidades

- **Generación automática de facturas PDF** con:
  - Logo y nombre de la empresa
  - Número de pedido
  - Fecha
  - Información completa del cliente
  - Tabla detallada de productos
  - Subtotal, IVA (12%) y total
  - Formato profesional

### Uso

Para generar una factura de un pedido:
```
GET /api/invoice/[orderId]
```

Esto descargará un PDF con el nombre `factura-ORD-XXXX.pdf`

### Archivos

- `lib/invoice.ts` - Función de generación de PDF
- `app/api/invoice/[orderId]/route.ts` - API route para descargar facturas

---

## 🔍 3. Optimización SEO

### Implementaciones

#### Meta Tags Mejorados
- Title optimizado para búsqueda
- Descripción detallada con keywords
- Open Graph para redes sociales
- Twitter Cards
- Robots.txt configurado

#### Sitemap Automático
- Generación dinámica de sitemap.xml
- Incluye páginas principales
- Prioridades y frecuencias de actualización

#### Robots.txt
- Permite indexación del sitio
- Bloquea rutas de admin y API
- Configura crawl-delay respetuoso

### Configuración

```env
NEXT_PUBLIC_SITE_URL="https://tu-dominio.com"
GOOGLE_SITE_VERIFICATION="tu_codigo_verificacion"
```

### Archivos

- `app/layout.tsx` - Meta tags y configuración SEO
- `app/sitemap.ts` - Generación de sitemap
- `public/robots.txt` - Configuración de robots

---

## 📊 4. Google Analytics

### Configuración

1. **Crear propiedad en Google Analytics:**
   - Ve a [analytics.google.com](https://analytics.google.com)
   - Crea una nueva propiedad (GA4)
   - Obtén tu Measurement ID (formato: G-XXXXXXXXXX)

2. **Configurar variable de entorno:**
   ```env
   NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
   ```

### Funcionalidades

- **Tracking automático de page views**
- **Seguimiento de navegación**
- **Solo activo en producción**
- **Integración con Vercel Analytics**

### Archivos

- `components/google-analytics.tsx` - Componente de Analytics
- `app/layout.tsx` - Integración en el layout

---

## 💬 5. Chat en Vivo

### Configuración

```env
NEXT_PUBLIC_CHAT_ENABLED="true"
```

### Funcionalidades

- **Chat flotante** en la esquina inferior derecha
- **Mensajes automáticos** de bienvenida
- **Interfaz responsiva**
- **Opcional** (se puede desactivar)

### Integración con Servicios Externos

Para integrar con servicios profesionales, modifica `components/live-chat.tsx`:

- **Intercom:** `npm install @intercom/messenger-js-helm`
- **Tawk.to:** Agregar script de Tawk.to
- **Crisp:** `npm install @crisp-engines/crisp-sdk-web`
- **Zendesk:** `npm install @zendesk/web-widget-messenger`

### Archivos

- `components/live-chat.tsx` - Componente de chat

---

## 🚀 Configuración Completa para Producción

### Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres?sslmode=verify-full"

# URLs
NEXT_PUBLIC_SITE_URL="https://tu-dominio.com"
BETTER_AUTH_URL="https://tu-dominio.com"

# Email (Resend)
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="noreply@tu-dominio.com"
EMAIL_TO_ADMIN="admin@tu-dominio.com"

# Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Chat
NEXT_PUBLIC_CHAT_ENABLED="true"

# SEO
GOOGLE_SITE_VERIFICATION="tu_codigo"

# Entorno
NODE_ENV="production"
```

---

## 📝 Checklist de Activación

### Antes de Activar

- [ ] Crear cuenta en Resend y obtener API key
- [ ] Verificar dominio de email en Resend
- [ ] Crear propiedad en Google Analytics
- [ ] Obtener Measurement ID de GA
- [ ] Decidir si usar chat en vivo
- [ ] Configurar NEXT_PUBLIC_SITE_URL con dominio real

### Después de Activar

- [ ] Probar envío de emails con pedido de prueba
- [ ] Verificar que las facturas PDF se generan correctamente
- [ ] Confirmar que Google Analytics está tracking
- [ ] Probar chat en vivo (si está habilitado)
- [ ] Verificar sitemap.xml en `https://tu-dominio.com/sitemap.xml`
- [ ] Verificar robots.txt en `https://tu-dominio.com/robots.txt`

---

## 🔧 Solución de Problemas

### Emails no se envían
- Verificar que `RESEND_API_KEY` esté configurada
- Confirmar que el dominio esté verificado en Resend
- Revisar logs del servidor para errores

### Facturas PDF no se generan
- Verificar que jsPDF esté instalado
- Revisar logs para errores de generación
- Confirmar que el pedido existe

### Google Analytics no tracking
- Verificar que `NEXT_PUBLIC_GA_ID` esté configurado
- Confirmar que esté en producción
- Usar Google Tag Assistant para verificar

### Chat no aparece
- Verificar que `NEXT_PUBLIC_CHAT_ENABLED="true"`
- Confirmar que el componente esté en el layout
- Revisar consola del navegador para errores

---

## 📞 Soporte

Para problemas técnicos:
1. Revisa los logs del servidor
2. Verifica variables de entorno
3. Consulta documentación oficial de cada servicio
4. Revisa SECURITY.md para medidas de seguridad

---

**Última actualización:** Septiembre 2026
**Versión:** 1.0.0
