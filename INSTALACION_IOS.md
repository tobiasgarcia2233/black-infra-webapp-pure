# 📱 Guía de Instalación en iPhone (iOS)

## Paso 1: Preparar los Iconos

Antes de instalar la app en el iPhone, asegúrate de tener los iconos PWA:

1. Ve a la carpeta `public/icons/`
2. Lee el archivo `INSTRUCCIONES.md`
3. Crea los iconos en todos los tamaños requeridos
4. Los iconos críticos para iOS son:
   - `icon-152x152.png`
   - `icon-192x192.png`

## Paso 2: Configurar Variables de Entorno

Crea el archivo `.env.local` en la raíz de `webapp/`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

## Paso 3: Instalar Dependencias

```bash
cd webapp
npm install
```

## Paso 4: Modo Desarrollo (Opcional)

Para probar en desarrollo:

```bash
npm run dev
```

Accede desde tu iPhone en la misma red WiFi: `http://TU-IP-LOCAL:3000`

## Paso 5: Build para Producción

```bash
npm run build
npm start
```

## Paso 6: Desplegar

### Opción A: Vercel (Recomendado)

1. Instala Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Despliega:
   ```bash
   vercel --prod
   ```

3. Configura las variables de entorno en el dashboard de Vercel

### Opción B: Otro hosting

- Netlify
- Railway
- Render
- AWS Amplify

## Paso 7: Instalar en iPhone

1. **Abre Safari en tu iPhone** (Chrome/Firefox no soportan instalación PWA en iOS)
2. Navega a la URL de tu app desplegada
3. Toca el botón de **Compartir** (ícono de cuadrado con flecha hacia arriba)
4. Desplázate y selecciona **"Agregar a pantalla de inicio"**
5. Personaliza el nombre si quieres (ej: "BLACK")
6. Toca **"Agregar"**

¡Listo! La app ahora aparecerá en tu pantalla de inicio como una app nativa.

## ✨ Características de la PWA en iOS

✅ **Modo Standalone**: Se abre sin la barra de Safari
✅ **Ícono personalizado**: Usa el apple-touch-icon
✅ **Status bar oscuro**: Estilo black-translucent
✅ **Safe areas**: Respeta las áreas seguras del iPhone (notch)
✅ **Viewport optimizado**: Sin zoom accidental
✅ **Cache offline**: Service Worker para acceso sin internet (en build)

## 🔧 Solución de Problemas

### El ícono no aparece correctamente
- Verifica que los archivos PNG estén en `public/icons/`
- Asegúrate de que sean PNG válidos (no JPG renombrados)
- Intenta con 152x152px y 192x192px como mínimo

### La app no se abre en modo standalone
- Verifica que el `manifest.json` tenga `"display": "standalone"`
- Revisa que los meta tags de Apple estén en `layout.tsx`
- Desinstala y reinstala la PWA desde Safari

### Los estilos se ven mal en iPhone
- Revisa las clases `safe-area-inset-top` y `safe-area-inset-bottom`
- Verifica que el viewport esté configurado correctamente

## 📊 Testing

Prueba las siguientes funcionalidades:

- [ ] Login con Supabase Auth
- [ ] Dashboard carga los KPIs correctamente
- [ ] Gráfico se visualiza bien
- [ ] Navegación funciona
- [ ] Logout cierra sesión
- [ ] Safe areas respetan el notch
- [ ] No hay zoom accidental
- [ ] Colores se ven correctos

## 🚀 Next Steps

Después de la instalación exitosa, puedes:
1. Agregar más páginas al dashboard
2. Implementar notificaciones push
3. Agregar más gráficos y reportes
4. Sincronización offline
