# BLACK Infrastructure - WebApp Dashboard

## Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto `webapp/` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 2. Instalación

```bash
cd webapp
npm install
```

### 3. Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### 4. Build para Producción

```bash
npm run build
npm start
```

## PWA - Instalación en iPhone

1. Abre Safari en tu iPhone
2. Navega a la URL de la webapp
3. Toca el botón de "Compartir" (ícono de compartir)
4. Selecciona "Agregar a pantalla de inicio"
5. La app se instalará como una aplicación nativa

## Características

- ✅ Next.js 14 con App Router
- ✅ PWA optimizada para iOS (Standalone mode)
- ✅ Tailwind CSS
- ✅ Supabase Auth
- ✅ Dashboard con KPIs en tiempo real
- ✅ Gráfico Ingresos vs Gastos
- ✅ Responsive Design
