# Guía de Despliegue Profesional - Tornilleria Jehova Jireh

Esta guía cubre el flujo profesional de desarrollo, pruebas y despliegue en producción.

## 📋 Entornos

### 1. Desarrollo (Local)
- **URL:** http://localhost:3000
- **Base de datos:** Supabase (mismo proyecto que producción)
- **SSL:** sslmode=no-verify (evita errores de certificado en desarrollo)
- **NODE_ENV:** development
- **Propósito:** Desarrollo y pruebas locales

### 2. Producción
- **URL:** https://tu-dominio.com (Vercel, V0, etc.)
- **Base de datos:** Supabase (mismo proyecto)
- **SSL:** sslmode=verify-full (máxima seguridad)
- **NODE_ENV:** production
- **Propósito:** Sitio público para clientes

---

## 🔧 Configuración de Variables de Entorno

### Archivo .env para Desarrollo
```env
DATABASE_URL="postgresql://postgres:Tornilleria17:17@db.ibscudyurwbbywqpoyzv.supabase.co:5432/postgres?sslmode=no-verify"
NEXT_PUBLIC_SUPABASE_URL="https://ibscudyurwbbywqpoyzv.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_AiY3z9y27we7fgBmbH3yew_X7YGHgwC"
BETTER_AUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

### Variables de Entorno en Producción (Vercel/V0)
Configura estas variables en el dashboard de tu plataforma de hosting:

```env
DATABASE_URL="postgresql://postgres:Tornilleria17:17@db.ibscudyurwbbywqpoyzv.supabase.co:5432/postgres?sslmode=verify-full"
NEXT_PUBLIC_SUPABASE_URL="https://ibscudyurwbbywqpoyzv.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_AiY3z9y27we7fgBmbH3yew_X7YGHgwC"
BETTER_AUTH_URL="https://tu-dominio.com"
NODE_ENV="production"
```

**IMPORTANTE:** Cambia `tu-dominio.com` por tu URL real de producción.

---

## 🚀 Flujo de Trabajo Profesional

### 1. Desarrollo Local
```bash
# Iniciar servidor de desarrollo
npm run dev

# Acceder a:
# - Tienda: http://localhost:3000
# - Catálogo: http://localhost:3000/catalogo
# - Admin: http://localhost:3000/admin (requiere login)
# - Login: http://localhost:3000/sign-in
```

### 2. Pruebas antes de Desplegar
- [ ] Probar flujo completo de compra
- [ ] Verificar login admin funciona
- [ ] Probar en móvil y desktop
- [ ] Verificar que los productos cargan
- [ ] Probar creación de pedidos
- [ ] Verificar rate limiting en admin

### 3. Despliegue en Producción

#### Opción A: Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Desplegar por primera vez
vercel

# Configurar variables de entorno en Vercel dashboard
# Luego redeploy
vercel --prod
```

#### Opción B: V0 (v0.dev)
1. Sube tu proyecto a GitHub
2. Ve a [v0.dev](https://v0.dev)
3. Importa tu repositorio
4. Configura las variables de entorno en el dashboard de V0

#### Opción C: Docker
```bash
# Construir imagen
docker build -t tornilleria-app .

# Ejecutar contenedor
docker run -p 3000:3000 \
  -e DATABASE_URL="tu_url" \
  -e BETTER_AUTH_URL="https://tu-dominio.com" \
  -e NODE_ENV="production" \
  tornilleria-app
```

---

## 🔒 Seguridad Implementada

### 1. Headers de Seguridad
- **X-Frame-Options: DENY** - Previene clickjacking
- **X-Content-Type-Options: nosniff** - Previene MIME sniffing
- **Referrer-Policy: strict-origin-when-cross-origin** - Controla información de referer
- **Permissions-Policy** - Restringe acceso a cámara, micrófono, geolocalización

### 2. Protección de /admin
- Verificación de sesión obligatoria
- Rate limiting (30 intentos por hora por IP)
- Redirección automática a login si no autenticado
- Cookies httpOnly y secure en producción

### 3. Seguridad en Base de Datos
- Row Level Security (RLS) habilitado
- Lectura pública para inventario y clientes
- Escritura solo para usuarios autenticados
- Índices únicos en email y NIT

### 4. Rate Limiting en API
- Pedidos: 10 por hora por IP
- Clientes: 30 consultas por hora por IP
- Admin: 30 intentos por hora por IP

---

## 📝 Checklist de Producción

### Antes de Desplegar
- [ ] Base de datos configurada en Supabase
- [ ] Script SQL ejecutado correctamente
- [ ] Usuario admin creado y probado
- [ ] Catálogo de productos actualizado con datos reales
- [ ] Variables de entorno configuradas en hosting
- [ ] BETTER_AUTH_URL actualizado con dominio real
- [ ] sslmode cambiado a verify-full
- [ ] NODE_ENV configurado como production
- [ ] Flujo de compra probado completamente
- [ ] Login admin probado
- [ ] Pruebas en móvil y desktop realizadas

### Después de Desplegar
- [ ] Verificar que el sitio carga correctamente
- [ ] Probar login admin en producción
- [ ] Verificar que los productos cargan
- [ ] Probar creación de pedidos
- [ ] Configurar monitoreo (Vercel Analytics, Sentry)
- [ ] Configurar backups automáticos de Supabase
- [ ] Verificar HTTPS funciona correctamente

---

## 🛠️ Mantenimiento

### Actualizar Productos
1. Accede a `/admin` con tu cuenta
2. Ve a la sección de Inventario
3. Agrega, edita o elimina productos
4. Los cambios se reflejan inmediatamente en el catálogo

### Actualizar Código
```bash
# Hacer cambios en desarrollo
git add .
git commit -m "Descripción del cambio"
git push

# Desplegar cambios
vercel --prod
```

### Monitoreo
- **Vercel Analytics:** Métricas de rendimiento y tráfico
- **Supabase Dashboard:** Estado de base de datos
- **Logs:** Revisar errores en Vercel dashboard

---

## 🚨 Respuesta a Incidentes

### Si el sitio no carga
1. Verificar variables de entorno en hosting
2. Revisar logs en Vercel dashboard
3. Verificar que base de datos esté accesible
4. Revisar consola del navegador

### Si no puedes acceder a /admin
1. Verificar que la sesión esté activa
2. Limpiar cookies del navegador
3. Verificar rate limiting no esté bloqueando tu IP
4. Revisar logs para errores de autenticación

### Si hay errores de base de datos
1. Verificar DATABASE_URL sea correcta
2. Verificar sslmode sea el adecuado
3. Revisar Supabase dashboard
4. Verificar que las tablas existan

---

## 📞 Soporte

Para problemas técnicos:
1. Revisa los logs del servidor
2. Verifica variables de entorno
3. Revisa consola del navegador
4. Consulta SECURITY.md para medidas de seguridad

---

## 🎯 Próximos Pasos

1. **Pasarela de Pagos:** Integrar Stripe, Mercado Pago o Culqi
2. **Notificaciones:** Configurar emails para pedidos
3. **Facturación:** Implementar sistema de facturación
4. **SEO:** Optimizar para motores de búsqueda
5. **Analytics:** Configurar Google Analytics
6. **Chat en vivo:** Agregar soporte al cliente

---

**Última actualización:** Septiembre 2026
**Versión:** 1.0.0
