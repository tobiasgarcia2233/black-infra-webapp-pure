import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Lista de rutas públicas que no requieren autenticación
  const publicPaths = ['/login']
  const path = request.nextUrl.pathname

  // Si la ruta es pública, permitir acceso
  if (publicPaths.includes(path)) {
    return NextResponse.next()
  }

  // Para todas las demás rutas (protegidas), verificar sesión en el cliente
  // La verificación real se hace en cada página con useEffect
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox).*)',
  ],
}
