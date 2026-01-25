/**
 * ⚠️ DEPRECATED - NO SE USA MÁS
 * ================================
 * Este endpoint proxy ya NO se utiliza.
 * 
 * Cambio: El frontend ahora llama DIRECTAMENTE al backend de Render:
 * https://black-infra-api-pure.onrender.com/sync-pst
 * 
 * Razón del cambio:
 * - Eliminar capa intermedia innecesaria
 * - Reducir latencia y costos de función serverless
 * - Simplificar arquitectura
 * 
 * Fecha de deprecación: 24/01/2026
 * 
 * NOTA: Este archivo se mantiene comentado solo como referencia histórica.
 *       Si necesitas reactivar el proxy, descomenta el código.
 */

import { NextRequest, NextResponse } from 'next/server'

// ⚠️ CÓDIGO DESHABILITADO - Frontend llama directamente a Render
/*
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tu-app-en-render.com'

export async function GET(request: NextRequest) {
  // ... código del proxy ...
}

export async function POST(request: NextRequest) {
  return GET(request)
}
*/

// Retornar mensaje de deprecación
export async function GET(request: NextRequest) {
  return NextResponse.json({
    deprecated: true,
    message: 'Este endpoint proxy ya no se usa. El frontend llama directamente a: https://black-infra-api-pure.onrender.com/sync-pst',
    redirect_to: 'https://black-infra-api-pure.onrender.com/sync-pst'
  }, { status: 410 }) // 410 Gone
}

export async function POST(request: NextRequest) {
  return GET(request)
}
