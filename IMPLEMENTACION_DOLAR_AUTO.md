# AUTOMATIZACIÓN DEL DÓLAR BLUE

**Fecha:** 22/01/2026  
**Versión:** 1.0

## 📋 RESUMEN

Sistema completo de sincronización automática del dólar blue desde DolarAPI.com, con actualización manual desde la WebApp y cron job automático en Vercel.

---

## 🎯 COMPONENTES IMPLEMENTADOS

### 1. **API Route Serverless** ✅
**Archivo:** `webapp/app/api/update-dolar/route.ts`

**Funcionalidad:**
- Consulta la API gratuita de https://dolarapi.com/v1/dolares/blue
- Obtiene el valor de **venta** del dólar blue (más conservador para costos)
- Actualiza `dolar_conversion` en tabla `configuracion` de Supabase
- Recalcula automáticamente todos los costos fijos en USD
- Retorna JSON con el resultado

**Endpoints:**
- `GET /api/update-dolar` - Sincroniza el dólar
- `POST /api/update-dolar` - Mismo comportamiento (para llamadas desde UI)

**Respuesta exitosa:**
```json
{
  "success": true,
  "dolar": {
    "compra": 1480.00,
    "venta": 1500.00,
    "fecha": "2026-01-22T09:00:00Z"
  },
  "message": "Dólar actualizado a $1500 ARS"
}
```

---

### 2. **Botón de Sincronización Manual** ✅
**Ubicación:** Página de Configuración (`/dashboard/configuracion`)

**Características:**
- Botón azul destacado: **"🔄 Sincronizar Dólar Ahora"**
- Spinner animado durante la sincronización
- Deshabilitado mientras está sincronizando
- Recarga automática de datos al completar
- Mensaje de éxito con el nuevo valor

**Estados del botón:**
- Normal: "🔄 Sincronizar Dólar Ahora"
- Sincronizando: "Sincronizando..." + ícono girando
- Deshabilitado: Opacidad 50%

---

### 3. **Vercel Cron Job** ✅
**Archivo:** `webapp/vercel.json`

**Configuración:**
```json
{
  "crons": [
    {
      "path": "/api/update-dolar",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Horario:** Todos los días a las 9:00 AM UTC (6:00 AM Argentina)

**Nota:** Los cron jobs requieren un plan Vercel Pro o superior.

---

## 🔧 CONFIGURACIÓN NECESARIA

### **Variables de Entorno en Vercel**

Asegúrate de tener estas variables configuradas en tu proyecto de Vercel:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Tu URL de Supabase
   - Ejemplo: `https://tuproyecto.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - API Key pública de Supabase
   - Se usa como fallback

3. **SUPABASE_SERVICE_ROLE_KEY** (Recomendado)
   - API Key con permisos de administrador
   - Más segura para operaciones del servidor
   - Se obtiene en: Supabase Dashboard > Settings > API > service_role key

**Dónde configurarlas:**
```
Vercel Dashboard → Tu Proyecto → Settings → Environment Variables
```

---

## 🚀 DESPLIEGUE

### **Paso 1: Verificar variables de entorno**
```bash
# En Vercel Dashboard
Settings → Environment Variables

Agregar si no existe:
- SUPABASE_SERVICE_ROLE_KEY = [tu_service_role_key]
```

### **Paso 2: Desplegar a producción**
```bash
cd webapp
npx vercel --prod
```

### **Paso 3: Verificar cron job** (Solo para planes Pro)
```
Vercel Dashboard → Tu Proyecto → Settings → Crons
Deberías ver: /api/update-dolar programado para 9:00 AM UTC
```

---

## 📱 FLUJO DE USO

### **Sincronización Manual:**

1. Usuario va a **Dashboard → Configuración**
2. Ve el valor actual del dólar
3. Toca **"🔄 Sincronizar Dólar Ahora"**
4. Botón muestra "Sincronizando..." con spinner
5. Se consulta DolarAPI.com
6. Se actualiza Supabase
7. Se recalculan costos USD
8. Mensaje: "✅ Dólar actualizado a $XXXX ARS"
9. Valor se actualiza en pantalla

### **Sincronización Automática (Cron):**

1. Cada día a las 9:00 AM UTC
2. Vercel ejecuta `/api/update-dolar` automáticamente
3. Se consulta DolarAPI.com
4. Se actualiza Supabase
5. Se recalculan costos USD
6. Logs visibles en Vercel Dashboard

---

## 🔍 TESTING

### **Test Manual desde la UI:**
1. Ir a `/dashboard/configuracion`
2. Presionar "🔄 Sincronizar Dólar Ahora"
3. Verificar que muestra "Sincronizando..."
4. Confirmar mensaje de éxito
5. Ver nuevo valor del dólar

### **Test directo a la API:**
```bash
# Desde terminal (requiere deploy en Vercel)
curl https://tu-dominio.vercel.app/api/update-dolar

# Respuesta esperada:
{
  "success": true,
  "dolar": {
    "compra": 1480.00,
    "venta": 1500.00,
    "fecha": "2026-01-22T09:00:00Z"
  },
  "message": "Dólar actualizado a $1500 ARS"
}
```

### **Test del Cron Job:**
```
1. Ir a Vercel Dashboard
2. Tu Proyecto → Deployments → Crons
3. Buscar ejecuciones de /api/update-dolar
4. Ver logs de ejecución
5. Verificar status 200
```

---

## 📊 IMPACTO EN EL SISTEMA

### **Cuando se actualiza el dólar:**

1. **Tabla `configuracion`:**
   ```sql
   UPDATE configuracion 
   SET valor_numerico = nuevo_valor,
       updated_at = NOW()
   WHERE clave = 'dolar_conversion'
   ```

2. **Tabla `costos` (todos los fijos):**
   ```sql
   UPDATE costos
   SET monto_usd = monto_ars / nuevo_dolar
   WHERE tipo = 'Fijo'
   ```

3. **Dashboard:**
   - Total Gastos: Se recalcula con nuevos valores USD
   - Neto USD: Se recalcula
   - Gráficos: Se actualizan

4. **Bot de Telegram:**
   - Comando `/resumen`: Muestra nuevos valores
   - Costos visibles con conversión actualizada

---

## 🎨 INTERFAZ VISUAL

### **Botón de Sincronización:**

```tsx
Diseño:
- Color: Azul (#3b82f6)
- Fondo: bg-blue-500/20
- Hover: bg-blue-500/30
- Border: border-blue-500/30
- Ícono: RefreshCw (gira al sincronizar)
- Width: 100%
- Padding: py-3
- Rounded: rounded-xl
```

**Estados visuales:**
```
Normal:     [🔄] Sincronizar Dólar Ahora
Loading:    [⟳] Sincronizando... (spinner animado)
Success:    ✅ Dólar actualizado a $XXXX ARS
Error:      Alert nativo del navegador
```

---

## ⚙️ CONFIGURACIÓN DEL CRON

### **Formatos de Schedule:**

```javascript
"0 9 * * *"     // 9:00 AM UTC cada día (implementado)
"0 */6 * * *"   // Cada 6 horas
"0 9 * * 1-5"   // 9 AM lunes a viernes
"0 6,12,18 * * *" // 6 AM, 12 PM, 6 PM
```

### **Zona horaria:**
- El cron usa **UTC**
- Argentina (UTC-3): 9:00 AM UTC = 6:00 AM Argentina
- Para cambiar el horario, edita `vercel.json` y redeploy

---

## 🐛 TROUBLESHOOTING

### **Error: "No se pudo sincronizar el dólar"**
**Causa:** DolarAPI.com no responde o formato de respuesta cambió  
**Solución:** 
```bash
# Verificar la API manualmente
curl https://dolarapi.com/v1/dolares/blue

# Verificar logs en Vercel
Vercel Dashboard → Deployments → Function Logs
```

### **Error: "Error al actualizar Supabase"**
**Causa:** Variables de entorno incorrectas o permisos insuficientes  
**Solución:**
```bash
# Verificar variables en Vercel
Settings → Environment Variables

# Verificar que SUPABASE_SERVICE_ROLE_KEY esté configurada
# O al menos NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### **El cron no se ejecuta automáticamente**
**Causa:** Plan Vercel Hobby (gratis) no soporta cron jobs  
**Solución:**
```
1. Upgrade a Vercel Pro ($20/mes)
2. O usar sincronización manual únicamente
3. O implementar un cron externo (GitHub Actions, etc.)
```

### **Valor del dólar no se actualiza en tiempo real**
**Causa:** Cache del navegador o datos en memoria  
**Solución:**
```typescript
// La función loadData() recarga desde Supabase
// Asegurarse de llamarla después de sincronizar
await loadData() // ✅ Ya implementado
```

---

## 📈 LOGS Y MONITOREO

### **Logs de la API:**
```
Vercel Dashboard → Tu Proyecto → Functions → /api/update-dolar
```

**Logs esperados:**
```
🔄 Iniciando actualización del dólar blue...
💵 Dólar Blue - Compra: $1480 | Venta: $1500
✅ 3 costos recalculados
✅ Dólar actualizado exitosamente a $1500
```

### **Monitoreo del Cron:**
```
Vercel Dashboard → Crons → Executions
```

**Ver:**
- Última ejecución
- Status code (200 = éxito)
- Duración
- Logs completos

---

## 🔐 SEGURIDAD

### **Protección de la API:**
```typescript
// La API es serverless y segura por diseño:
- No expone credenciales en el frontend
- Usa variables de entorno del servidor
- SUPABASE_SERVICE_ROLE_KEY solo en servidor
- No requiere autenticación adicional (opcional)
```

### **Opcional: Agregar autenticación:**
```typescript
// En route.ts, agregar verificación de token:
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## 📦 ARCHIVOS CREADOS/MODIFICADOS

### **Nuevos archivos:**
1. `webapp/app/api/update-dolar/route.ts` - API serverless
2. `webapp/vercel.json` - Configuración de cron
3. `webapp/IMPLEMENTACION_DOLAR_AUTO.md` - Este archivo

### **Archivos modificados:**
1. `webapp/app/dashboard/configuracion/page.tsx` - Botón de sincronización

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Variables de entorno configuradas en Vercel
- [ ] Código desplegado en Vercel (`npx vercel --prod`)
- [ ] Probar sincronización manual desde UI
- [ ] Verificar que actualiza Supabase
- [ ] Verificar que recalcula costos
- [ ] (Opcional) Upgrade a Vercel Pro para cron
- [ ] (Opcional) Configurar alertas de fallo
- [ ] Documentar en CORE_CONTEXT.md

---

## 🎉 BENEFICIOS

✅ **Automatización total** - Sin intervención manual  
✅ **Siempre actualizado** - Dólar sincronizado cada mañana  
✅ **Serverless** - Sin servidores que mantener  
✅ **Gratis** - DolarAPI.com no requiere API key  
✅ **Escalable** - Corre en la nube de Vercel  
✅ **Auditable** - Logs completos en Vercel  
✅ **Redundancia** - Sincronización manual disponible  

---

**Sistema de automatización implementado con éxito** ✅  
**Listo para producción** 🚀
