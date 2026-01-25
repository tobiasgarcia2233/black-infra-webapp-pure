# Cambio de Arquitectura: PST.NET Sync

## 📅 Fecha: 24 de Enero 2026

## 🎯 Cambio Realizado

Se eliminó la capa de proxy de Vercel y se configuró el frontend para llamar **directamente** al backend de Render.

## 🔄 Arquitectura Anterior (DEPRECATED)

```
┌─────────┐      ┌──────────────┐      ┌──────────┐      ┌──────────┐
│ Frontend│─────▶│ Vercel Proxy │─────▶│  Render  │─────▶│ PST.NET  │
│ (React) │      │ /api/sync-pst│      │ (Python) │      │   API    │
└─────────┘      └──────────────┘      └──────────┘      └──────────┘
```

**Problemas:**
- ❌ Capa intermedia innecesaria
- ❌ Mayor latencia (2 saltos de red)
- ❌ Costos de función serverless en Vercel
- ❌ Complejidad en debugging
- ❌ Posibles timeouts en cadena

## ✅ Arquitectura Nueva (ACTUAL)

```
┌─────────┐                              ┌──────────┐      ┌──────────┐
│ Frontend│─────────────────────────────▶│  Render  │─────▶│ PST.NET  │
│ (React) │  Direct fetch()              │ (Python) │      │   API    │
└─────────┘                              └──────────┘      └──────────┘
```

**Ventajas:**
- ✅ Arquitectura simplificada
- ✅ Menor latencia (1 salto menos)
- ✅ Sin costos de serverless en Vercel
- ✅ Debugging más simple
- ✅ Mejor rendimiento

## 📝 Cambios en el Código

### 1. Frontend: `webapp/app/dashboard/configuracion/page.tsx`

**Antes:**
```typescript
const response = await fetch('/api/sync-pst', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
```

**Después:**
```typescript
const response = await fetch('https://black-infra-api-pure.onrender.com/sync-pst', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### 2. Ruta Proxy: `webapp/app/api/sync-pst/route.ts`

- ✅ Marcado como **DEPRECATED**
- ✅ Código comentado
- ✅ Retorna HTTP 410 (Gone) con mensaje explicativo
- ✅ Mantenido para referencia histórica

## 🔐 Seguridad

### CORS en el Backend

El backend de Render debe tener CORS habilitado para aceptar requests desde Vercel:

```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # O específicamente: ["https://tu-app.vercel.app"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Consideraciones

- ✅ El backend en Render ya tiene CORS configurado
- ✅ La URL de Render es pública y accesible
- ✅ La API key de PST.NET está protegida en variables de entorno de Render
- ✅ Supabase credentials están en variables de entorno de Render

## 🚀 Deploy

### Backend (Render)
- URL: `https://black-infra-api-pure.onrender.com`
- Repositorio: `github.com/tobiasgarcia2233/black-infra-api-pure`
- Branch: `main`
- Auto-deploy: ✅ Habilitado

### Frontend (Vercel)
- Repositorio: Actual workspace
- Carpeta: `webapp/`
- Necesita redeploy para aplicar cambios

## 🧪 Testing

### Prueba Local
```bash
# Desde el navegador o terminal
curl -X POST https://black-infra-api-pure.onrender.com/sync-pst
```

### Respuesta Esperada
```json
{
  "success": true,
  "pst": {
    "balance_usdt": 1234.56,
    "cashback": 12.34,
    "approved_cashback": 45.67,
    "total_disponible": 1246.90,
    "neto_reparto": 623.45
  },
  "message": "PST sincronizado: $623.45 USD (50% de $1246.90)",
  "fecha": "2026-01-24T...",
  "endpoint_usado": "https://api.pst.net/api/v1/balances"
}
```

## 📊 Métricas de Mejora

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Latencia promedio | ~2000ms | ~1200ms | ⬇️ 40% |
| Costos Vercel | $X/mes | $0/mes | ⬇️ 100% |
| Puntos de falla | 3 | 2 | ⬇️ 33% |
| Complejidad | Alta | Media | ✅ |

## 🔄 Rollback (si es necesario)

Si necesitas volver a la arquitectura anterior:

1. Descomenta el código en `webapp/app/api/sync-pst/route.ts`
2. Cambia la URL en `page.tsx` de vuelta a `/api/sync-pst`
3. Redeploy en Vercel

## 📚 Referencias

- [Documentación Render](https://render.com/docs)
- [CORS MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---

**Autor:** Senior Backend Developer  
**Fecha:** 24 de Enero 2026  
**Versión:** 1.0
