# Deploy del Backend en Render

## 📋 Resumen de la Arquitectura

```
┌─────────┐      ┌──────────┐      ┌──────────┐
│ Vercel  │─────▶│  Render  │─────▶│ PST.NET  │
│ (Proxy) │      │ (Backend)│      │   API    │
└─────────┘      └──────────┘      └──────────┘
```

**Ventaja**: Render tiene IP fija que PST.NET puede poner en lista blanca.

---

## 🚀 Pasos para Deployar en Render

### 1. Crear cuenta en Render

1. Ve a [https://render.com](https://render.com)
2. Crea una cuenta (gratis)
3. Verifica tu email

### 2. Crear nuevo Web Service

1. Desde el Dashboard, click en **"New +"**
2. Selecciona **"Web Service"**
3. Conecta tu repositorio de GitHub/GitLab
4. O usa **"Public Git Repository"** y pega la URL del repo

### 3. Configurar el servicio

**Configuración básica:**
- **Name**: `black-infra-api` (o el nombre que prefieras)
- **Region**: Selecciona la más cercana (ej: Oregon, USA)
- **Branch**: `main` (o tu rama principal)
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python api_server.py`

**Configuración avanzada:**
- **Instance Type**: `Free` (suficiente para empezar)
- **Auto-Deploy**: `Yes` (despliega automáticamente en cada push)

### 4. Configurar Variables de Entorno

En la sección **"Environment"**, agregar:

```bash
PST_API_KEY=tu_token_jwt_de_pst
SUPABASE_URL=https://ciedkmodyisuhkmsyhmx.supabase.co
SUPABASE_KEY=tu_service_role_key
PORT=10000
```

**Importante**: 
- `PST_API_KEY`: El token JWT de PST.NET
- `SUPABASE_KEY`: Usar el **Service Role Key** (no el anon key)
- `PORT`: Render asigna automáticamente el puerto 10000

### 5. Crear el servicio

1. Click en **"Create Web Service"**
2. Espera a que se complete el build (3-5 minutos)
3. Una vez listo, verás un estado verde y la URL del servicio

---

## 🌐 Obtener la URL y la IP de Render

### URL del Servicio

Después del deploy, Render te asignará una URL como:
```
https://black-infra-api.onrender.com
```

Esta URL la necesitas para configurar en Vercel.

### IP Fija del Servicio

Para obtener la IP de salida de tu servicio:

**Opción 1: Desde la terminal de Render**
1. Ve a tu servicio en Render
2. Click en **"Shell"** (terminal en línea)
3. Ejecuta:
```bash
curl -4 ifconfig.me
```

**Opción 2: Crear un endpoint de prueba**
Agregar temporalmente al `api_server.py`:
```python
@app.get("/my-ip")
async def get_my_ip():
    import socket
    hostname = socket.gethostname()
    ip_address = socket.gethostbyname(hostname)
    return {"ip": ip_address}
```

Luego visita: `https://tu-servicio.onrender.com/my-ip`

**Opción 3: Usar un servicio externo**
```bash
curl https://tu-servicio.onrender.com/check-ip
```

Donde `/check-ip` hace:
```python
@app.get("/check-ip")
async def check_ip():
    import requests
    response = requests.get('https://api.ipify.org?format=json')
    return response.json()
```

---

## 🔐 Configurar IP en PST.NET

1. **Obtén la IP** usando uno de los métodos anteriores
2. **Ingresa a PST.NET** con tus credenciales
3. **Ve a Configuración** → API → Lista Blanca de IPs
4. **Agrega la IP de Render**: `X.X.X.X/32`
5. **Guarda los cambios**

**Nota**: Si PST.NET usa múltiples IPs de salida en Render, puede que necesites agregar un rango o contactar a Render para conocer todas las IPs posibles.

---

## ⚙️ Configurar Vercel

En tu proyecto de Vercel, agrega la variable de entorno:

```bash
NEXT_PUBLIC_BACKEND_URL=https://black-infra-api.onrender.com
```

Pasos:
1. Ve a [vercel.com](https://vercel.com)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega `NEXT_PUBLIC_BACKEND_URL` con el valor de tu URL de Render
5. Click en **Save**
6. Redeploya el proyecto (o espera el próximo deploy automático)

---

## 🧪 Probar la Integración

### 1. Test directo al backend de Render

```bash
curl https://black-infra-api.onrender.com/sync-pst
```

Deberías ver un JSON con:
```json
{
  "success": true,
  "pst": {
    "balance_usdt": 1234.56,
    "cashback": 123.45,
    "total_disponible": 1358.01,
    "neto_reparto": 679.0
  },
  "message": "PST sincronizado: $679.0 USD (50% de $1358.01)"
}
```

### 2. Test desde Vercel (proxy)

```bash
curl https://tu-app.vercel.app/api/sync-pst
```

Debería devolver el mismo resultado.

### 3. Test desde el iPhone

1. Abre la WebApp en el iPhone
2. Ve a **Configuración**
3. Click en **"💰 Sincronizar PST.NET"**
4. Deberías ver el mensaje de éxito

---

## 📊 Monitoreo

### Logs en Render

1. Ve a tu servicio en Render
2. Click en **"Logs"**
3. Verás todos los logs en tiempo real:
   ```
   🔄 API REQUEST: /sync-pst
   📍 Probando URL: https://api.pst.net/api/v1/balances/
   ✅ ENDPOINT CORRECTO
   💰 Balance USDT: $1234.56
   ✅ Sincronización completada
   ```

### Logs en Vercel

1. Ve a tu proyecto en Vercel
2. Click en **"Deployments"** → Selecciona el deployment actual
3. Click en **"Functions"** → **"/api/sync-pst"**
4. Verás los logs del proxy

---

## 🔧 Troubleshooting

### Error: "No se pudo conectar con el backend"

**Causa**: Vercel no puede alcanzar Render.

**Solución**:
1. Verifica que la URL de Render sea correcta en las variables de entorno de Vercel
2. Verifica que el servicio de Render esté corriendo (debería mostrar estado verde)
3. Prueba la URL directamente desde el navegador: `https://tu-servicio.onrender.com/health`

### Error: "Token inválido o expirado"

**Causa**: El token JWT de PST.NET es inválido.

**Solución**:
1. Verifica que `PST_API_KEY` esté correctamente configurada en Render
2. Obtén un nuevo token JWT desde el dashboard de PST.NET
3. Actualiza la variable de entorno en Render

### Error: "404 - Todas las rutas dieron error"

**Causa**: La IP de Render no está en la lista blanca de PST.NET.

**Solución**:
1. Obtén la IP de Render (ver sección anterior)
2. Agrégala a la lista blanca en PST.NET
3. Espera 5-10 minutos para que se propague
4. Reintenta la sincronización

---

## 💡 Consejos

1. **Logs detallados**: Los logs de Python son muy verbosos, úsalos para debugging
2. **Free tier**: Render tiene un free tier generoso, pero el servicio se "duerme" después de 15 minutos de inactividad (primera request es lenta)
3. **Paid tier**: Si quieres que esté siempre activo, usa el plan de $7/mes
4. **Health checks**: Configura un health check en Render para que mantenga el servicio despierto
5. **Cron jobs**: Puedes usar GitHub Actions o Render Cron Jobs para llamar al endpoint periódicamente

---

## 🎯 Resultado Final

Una vez configurado todo:

✅ Vercel actúa como proxy seguro  
✅ Render tiene IP fija que PST.NET acepta  
✅ La sincronización funciona desde el iPhone  
✅ Los datos se guardan automáticamente en Supabase  
✅ El balance se actualiza en tiempo real en el dashboard  

**¡Arquitectura completa y funcional!** 🚀
