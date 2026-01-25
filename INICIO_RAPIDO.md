# 🚀 Inicio Rápido - BLACK Infrastructure WebApp

## ⚡ Setup en 5 Pasos

### 1️⃣ Instalar Dependencias

```bash
cd webapp
npm install
```

### 2️⃣ Configurar Variables de Entorno

Crea el archivo `.env.local` en la raíz de `webapp/`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

> **Nota**: Copia estos valores desde el dashboard de Supabase:
> - Project Settings → API → Project URL
> - Project Settings → API → anon/public key

### 3️⃣ Crear Iconos PWA

Los iconos son **CRÍTICOS** para que la PWA funcione en iPhone.

**Opción rápida**: Usa https://realfavicongenerator.net/

1. Sube tu logo (512x512px recomendado)
2. Descarga el paquete de iconos
3. Copia los archivos a `public/icons/`

**Archivos necesarios**:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png ⭐ **CRÍTICO**
- icon-192x192.png ⭐ **CRÍTICO**
- icon-384x384.png
- icon-512x512.png

### 4️⃣ Modo Desarrollo

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.

### 5️⃣ Desplegar a Producción

#### Vercel (Recomendado)

```bash
npm i -g vercel
vercel --prod
```

Configura las variables de entorno en el dashboard de Vercel.

## 📱 Instalar en iPhone

1. Abre **Safari** en tu iPhone
2. Ve a la URL de tu app
3. Toca el botón **Compartir**
4. Selecciona **"Agregar a pantalla de inicio"**
5. ¡Listo! La app aparecerá como una app nativa

## ✅ Verificación

Prueba que todo funcione:

- [ ] La página de login se carga
- [ ] Puedes iniciar sesión con Supabase Auth
- [ ] El dashboard muestra los 3 KPIs
- [ ] El gráfico se visualiza correctamente
- [ ] Puedes hacer logout

## 🔐 Crear Usuario en Supabase

Si aún no tienes un usuario de prueba:

1. Ve a tu proyecto en Supabase
2. Authentication → Users
3. Add User
4. Ingresa email y password
5. Confirma el usuario
6. Usa esas credenciales en el login

## 📚 Documentación Adicional

- `README.md` - Documentación principal
- `INSTALACION_IOS.md` - Guía detallada de instalación en iPhone
- `ESTRUCTURA.md` - Estructura completa del proyecto
- `public/icons/INSTRUCCIONES.md` - Cómo crear los iconos

## 🆘 Problemas Comunes

### Error: "Faltan variables de entorno"
→ Verifica que `.env.local` exista y tenga las dos variables

### Los KPIs muestran 0
→ Verifica que tengas datos en Supabase para Enero 2026

### La app no se instala en iPhone
→ Verifica que los iconos estén en `public/icons/`

### "Invalid login credentials"
→ Verifica que el usuario exista en Supabase Auth

## 🎯 Stack Completo

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database**: Supabase
- **Auth**: Supabase Auth
- **PWA**: @next/pwa
- **Language**: TypeScript

## 🚀 ¡Todo Listo!

La WebApp ya está configurada y lista para usar. Ahora puedes:
- Personalizar los estilos
- Agregar más páginas
- Implementar más funcionalidades
- Desplegar a producción

¿Preguntas? Revisa la documentación en los archivos .md del proyecto.
