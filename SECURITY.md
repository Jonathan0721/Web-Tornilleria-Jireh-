# Guía de Seguridad - Tornilleria Jehova Jireh

Esta guía cubre las medidas de seguridad implementadas y recomendaciones adicionales para proteger tu aplicación.

## 🔒 Seguridad Implementada

### 1. Autenticación de Admin

**Protección de Ruta `/admin`:**
- Middleware que verifica sesión activa
- Redirección automática a `/sign-in` si no está autenticado
- Sesiones expiran en 7 días
- Cookies con `httpOnly` y `secure` en producción

**Cómo acceder al admin:**
1. Ve a `http://tu-dominio.com/sign-in`
2. Inicia sesión con email y contraseña
3. Serás redirigido automáticamente a `/admin`
4. **Nadie puede acceder directamente a `/admin` sin estar autenticado**

### 2. Protección de API Routes

**Rate Limiting:**
- Pedidos: 10 por hora por IP
- Clientes: 30 consultas por hora por IP
- Previene ataques de fuerza bruta y abuso

**Validación de Datos:**
- Sanitización de inputs (trim, limitar longitud)
- Validación de campos requeridos
- Prevención de inyección SQL (usando Drizzle ORM)

### 3. Seguridad en Base de Datos

**Row Level Security (RLS):**
- Lectura pública para inventario y clientes
- Escritura solo para usuarios autenticados
- Pedidos solo accesibles por usuarios autenticados

**Índices y Restricciones:**
- Índices únicos en email y NIT
- Constraints CHECK en valores numéricos
- Foreign keys con ON DELETE CASCADE/SET NULL

### 4. Seguridad en Frontend

**Protección de Botones en Móvil:**
- Áreas táctiles mínimas de 44x44px
- `touch-manipulation` para eliminar retardo de 300ms
- `select-none` para evitar selección de texto
- `stopPropagation()` en controladores de eventos

**Protección XSS:**
- React sanitiza automáticamente los inputs
- No se usa `dangerouslySetInnerHTML`
- Validación de datos en servidor

---

## 🛡️ Recomendaciones de Seguridad Adicionales

### 1. Contraseñas Fuertes

**Para Usuario Admin:**
- Mínimo 8 caracteres
- Incluir mayúsculas, minúsculas, números y símbolos
- No reusar contraseñas de otros sitios
- Cambiar cada 3-6 meses

**Para Base de Datos:**
- Usar contraseña generada automáticamente por Supabase
- No compartirla
- Rotar si hay sospecha de compromiso

### 2. Variables de Entorno

**Nunca commits:**
- Archivo `.env`
- Cualquier secreto en el código
- URLs de base de datos con contraseñas

**Usar:**
- `.env.example` con valores de ejemplo
- Variables de entorno en plataforma de hosting (Vercel, V0)
- Secretos management (Vercel Environment Variables, Supabase Vault)

### 3. HTTPS Obligatorio

**En Producción:**
- Siempre usar HTTPS
- Vercel proporciona SSL gratis
- Configurar `BETTER_AUTH_URL` con `https://`
- Redirigir HTTP a HTTPS

**Headers de Seguridad:**
Agregar en `next.config.mjs`:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ]
    }
  ]
}
```

### 4. Protección contra CSRF

**Implementado:**
- Better Auth maneja CSRF automáticamente
- Tokens de sesión validados en cada request

**Adicional:**
- Verificar origin headers en API routes críticas
- Usar SameSite cookies (configurado en Better Auth)

### 5. Rate Limiting Avanzado

**Actual:** Rate limiting en memoria (se pierde al reiniciar servidor)

**Recomendación para Producción:**
- Usar Redis para rate limiting distribuido
- Implementar con Upstash (Redis serverless)
- Configurar límites diferentes por tipo de usuario

Ejemplo con Upstash:
```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

async function checkRateLimit(ip: string, limit: number, window: number) {
  const key = `ratelimit:${ip}`
  const current = await redis.incr(key)
  if (current === 1) {
    await redis.expire(key, window)
  }
  return current <= limit
}
```

### 6. Monitoreo y Alertas

**Errores:**
- Configurar Sentry para error tracking
- Alertas por email para errores críticos
- Logs estructurados con timestamps

**Actividad Sospechosa:**
- Monitorear múltiples intentos de login fallidos
- Alertar por actividad inusual en API routes
- Revisar logs de rate limiting

### 7. Backup y Recuperación

**Base de Datos:**
- Supabase tiene backups automáticos (diarios)
- Configurar backups adicionales semanales
- Exportar datos regularmente con pg_dump
- Probar restauración de backups

**Código:**
- Usar Git con branches
- Tags para versiones de producción
- Backup del código en múltiples ubicaciones

### 8. Actualizaciones y Patches

**Dependencias:**
```bash
# Verificar dependencias vulnerables
npm audit

# Actualizar dependencias
npm update

# Actualizar automáticamente
npm install -g npm-check-updates
ncu -u
```

**Next.js y Frameworks:**
- Mantener Next.js actualizado
- Revisar changelog para breaking changes
- Actualizar en ambiente de desarrollo primero

### 9. Seguridad en Pasarela de Pagos

**Cuando integres pasarela de pagos:**
- Nunca almacenar datos de tarjetas
- Usar webhooks para confirmaciones
- Validar signatures de webhooks
- No confiar solo en notificaciones del cliente
- Implementar 3D Secure

**Ejemplo con Stripe:**
```typescript
// Validar webhook signature
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const signature = request.headers['stripe-signature']
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
)
```

### 10. Protección de Datos Personales

**Cumplimiento:**
- Cumplir con leyes locales de protección de datos
- Política de privacidad visible
- Opción de eliminar datos del cliente
- Consentimiento explícito para marketing

**En Base de Datos:**
- Encriptar datos sensibles si es necesario
- No almacenar CVV de tarjetas
- Minimizar datos recolectados

### 11. Seguridad en Archivos Subidos

**Si agregas subida de imágenes:**
- Validar tipo de archivo (solo imágenes)
- Limitar tamaño de archivo (max 5MB)
- Escanear con antivirus si es posible
- Almacenar en servicio seguro (Supabase Storage, AWS S3)
- No ejecutar archivos subidos

### 12. Logging y Auditoría

**Registrar:**
- Intentos de login (exitosos y fallidos)
- Cambios en inventario
- Pedidos creados y modificados
- Acciones de admin

**No registrar:**
- Contraseñas (jamás)
- Datos de tarjetas
- Información sensible de clientes

### 13. Pruebas de Seguridad

**Antes de lanzar:**
- Probar inyección SQL (Drizzle ORM protege, pero verificar)
- Probar XSS en formularios
- Verificar que rate limiting funcione
- Probar acceso no autorizado a /admin
- Verificar que cookies sean httpOnly

**Herramientas:**
- OWASP ZAP para escaneo de vulnerabilidades
- Burp Suite para pruebas de penetración
- Lighthouse para auditoría de seguridad web

### 14. Seguridad en Desarrollo

**Buenas prácticas:**
- Nunca commits credenciales
- Usar `.gitignore` para archivos sensibles
- Revisar código antes de commits
- Usar pre-commit hooks para linting
- Code reviews para cambios críticos

**Git hooks:**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint"
    }
  }
}
```

### 15. Protección contra DDoS

**Implementado:**
- Rate limiting básico

**Adicional:**
- Usar CDN (Cloudflare)
- Configurar firewall de aplicaciones web (WAF)
- Implementar cache agresivo
- Considerar servicios de protección DDoS (Cloudflare, AWS Shield)

---

## 🚨 Respuesta a Incidentes

### Si detectas un incidente de seguridad:

1. **Inmediatamente:**
   - Rotar contraseñas comprometidas
   - Revisar logs de actividad
   - Identificar alcance del incidente

2. **Comunicación:**
   - Notificar a usuarios afectados
   - Ser transparente sobre lo ocurrido
   - Explicar medidas tomadas

3. **Post-incidente:**
   - Análisis de causa raíz
   - Implementar medidas preventivas
   - Documentar lecciones aprendidas

---

## 📞 Recursos de Seguridad

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Better Auth Security](https://www.better-auth.com/docs)

---

## ✅ Checklist de Seguridad

- [ ] Contraseña de admin es fuerte
- [ ] DATABASE_URL no está en el código
- [ ] HTTPS configurado en producción
- [ ] Rate limiting verificado
- [ ] RLS habilitado en base de datos
- [ ] Logs configurados
- [ ] Backups automáticos activos
- [ ] Dependencias actualizadas
- [ ] Política de privacidad visible
- [ ] Probar acceso no autorizado a /admin
- [ ] Probar rate limiting
- [ ] Configurar monitoreo de errores

---

**Mantén tu aplicación segura revisando regularmente estas medidas.**
