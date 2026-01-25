# Iconos PWA para iOS

Para que la PWA funcione correctamente en iPhone, necesitas crear iconos PNG en los siguientes tamaños:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png (CRÍTICO para iOS)
- icon-192x192.png (CRÍTICO para iOS)
- icon-384x384.png
- icon-512x512.png

## Cómo crear los iconos:

1. **Opción 1: Usar una herramienta online**
   - Ve a https://realfavicongenerator.net/
   - Sube tu logo en alta resolución
   - Descarga todos los tamaños

2. **Opción 2: Usar un generador de PWA**
   - Ve a https://www.pwabuilder.com/imageGenerator
   - Sube tu logo
   - Descarga el paquete de iconos

3. **Opción 3: Manual con diseño gráfico**
   - Usa Figma, Photoshop o Illustrator
   - Crea un canvas de 512x512px
   - Diseña tu logo (usa la letra "B" para BLACK)
   - Exporta en todos los tamaños listados arriba

## Recomendaciones de diseño:

- Usa colores que contrasten con el fondo
- El icono debe ser simple y reconocible
- Fondo sólido (evita transparencias para iOS)
- Deja un pequeño margen (safe area) alrededor del logo
- Colores sugeridos para BLACK: #0ea5e9 (azul) o #0c4a6e (azul oscuro)

## Verificación:

Después de crear los iconos, verifica que todos los archivos estén en:
`webapp/public/icons/`
