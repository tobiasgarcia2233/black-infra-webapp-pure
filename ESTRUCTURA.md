# 📁 Estructura del Proyecto WebApp

```
webapp/
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx               # Root layout con meta tags iOS PWA
│   ├── page.tsx                 # Página principal (redirect a login)
│   ├── globals.css              # Estilos globales + Tailwind + Safe Areas
│   ├── login/
│   │   └── page.tsx            # Página de login con Supabase Auth
│   └── dashboard/
│       └── page.tsx            # Dashboard con KPIs y gráfico
│
├── lib/
│   └── supabase.ts             # Cliente de Supabase + Types
│
├── public/
│   ├── manifest.json           # PWA Manifest (display: standalone)
│   └── icons/                  # Iconos PWA para iOS
│       ├── INSTRUCCIONES.md
│       ├── icon-72x72.png      # (Crear)
│       ├── icon-96x96.png      # (Crear)
│       ├── icon-128x128.png    # (Crear)
│       ├── icon-144x144.png    # (Crear)
│       ├── icon-152x152.png    # CRÍTICO para iOS
│       ├── icon-192x192.png    # CRÍTICO para iOS
│       ├── icon-384x384.png    # (Crear)
│       └── icon-512x512.png    # (Crear)
│
├── middleware.ts               # Protección de rutas
├── next.config.mjs            # Configuración Next.js + PWA
├── tailwind.config.js         # Configuración Tailwind
├── postcss.config.js          # PostCSS
├── tsconfig.json              # TypeScript
├── package.json               # Dependencias
├── .gitignore                 # Git ignore
├── .env.local                 # Variables de entorno (CREAR)
├── README.md                  # Documentación principal
├── INSTALACION_IOS.md         # Guía de instalación en iPhone
└── ESTRUCTURA.md              # Este archivo
```

## 🔑 Archivos Clave

### PWA Configuration

1. **manifest.json**
   - `display: "standalone"` → Modo app nativa
   - `theme_color: "#0ea5e9"` → Color de la barra de estado
   - Lista de iconos para todas las resoluciones

2. **layout.tsx**
   - Meta tags específicos para iOS:
     - `apple-mobile-web-app-capable`
     - `apple-mobile-web-app-status-bar-style`
     - `apple-mobile-web-app-title`
   - Links a `apple-touch-icon`
   - Viewport con `viewport-fit=cover` para notch

3. **globals.css**
   - Safe area insets para iOS (notch support)
   - Estilos para modo standalone
   - Tailwind base

### Auth & Data

4. **lib/supabase.ts**
   - Cliente de Supabase configurado
   - Types de las tablas (Cliente, Ingreso, Costo, ResumenFinanciero)
   - Configuración de persistencia de sesión

5. **login/page.tsx**
   - Login con email/password
   - Integración con Supabase Auth
   - UI moderna con Tailwind

6. **dashboard/page.tsx**
   - Verificación de autenticación
   - Carga de datos desde Supabase
   - 3 KPIs principales
   - Gráfico con Recharts
   - Logout

### Configuration

7. **next.config.mjs**
   - Configuración de @next/pwa
   - Service Worker automático
   - Deshabilitado en desarrollo

8. **middleware.ts**
   - Protección de rutas privadas
   - Lista de rutas públicas

## 🎨 Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **PWA**: @next/pwa
- **Language**: TypeScript

## 📦 Dependencias Principales

```json
{
  "next": "14.2.15",
  "react": "^18.3.1",
  "@supabase/supabase-js": "^2.39.7",
  "recharts": "^2.10.4",
  "lucide-react": "^0.344.0",
  "tailwindcss": "^3.4.1",
  "@next/pwa": "^5.6.0"
}
```

## 🔄 Flujo de la Aplicación

1. **Inicio** (`/`)
   - Redirect automático a `/login`

2. **Login** (`/login`)
   - Usuario ingresa email y password
   - Supabase Auth valida credenciales
   - Si OK → redirect a `/dashboard`
   - Si error → mostrar mensaje

3. **Dashboard** (`/dashboard`)
   - Verificar sesión activa (o redirect a login)
   - Cargar datos de Supabase:
     - Ingresos de Enero 2026
     - Costos de Enero 2026
   - Calcular KPIs:
     - Neto USD = Total USD - Total Costos
     - Total Ingresos (USD y ARS)
     - Total Gastos (USD)
   - Renderizar gráfico Ingresos vs Gastos
   - Botón de logout

4. **Logout**
   - Llamar a `supabase.auth.signOut()`
   - Redirect a `/login`

## 🎯 Features Implementadas

✅ PWA instalable en iPhone
✅ Modo standalone (sin barra de Safari)
✅ Meta tags específicos para iOS
✅ Safe areas para notch
✅ Login con Supabase Auth
✅ Dashboard con datos reales
✅ 3 KPIs principales
✅ Gráfico interactivo (Recharts)
✅ Responsive design
✅ TypeScript
✅ Tailwind CSS

## 🚀 Próximos Pasos (Sugeridos)

- [ ] Agregar más períodos al gráfico (últimos 6 meses)
- [ ] Página de listado de clientes
- [ ] Página de listado de ingresos
- [ ] Página de listado de costos
- [ ] Filtros por fecha
- [ ] Exportar datos a CSV
- [ ] Notificaciones push
- [ ] Modo offline completo
- [ ] Dark mode
