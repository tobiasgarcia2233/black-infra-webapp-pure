import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Inicializar Supabase con credenciales del servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Iniciando actualización del dólar blue...')

    // 1. Consultar API de DolarAPI.com
    const response = await fetch('https://dolarapi.com/v1/dolares/blue', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // No cachear para obtener datos frescos
    })

    if (!response.ok) {
      throw new Error(`Error al consultar DolarAPI: ${response.status}`)
    }

    const data = await response.json()
    
    // Usar el valor de venta (generalmente más alto y conservador para costos)
    const valorVenta = parseFloat(data.venta)
    const valorCompra = parseFloat(data.compra)
    
    if (!valorVenta || isNaN(valorVenta)) {
      throw new Error('Valor del dólar inválido')
    }

    console.log(`💵 Dólar Blue - Compra: $${valorCompra} | Venta: $${valorVenta}`)

    // 2. Actualizar en Supabase
    const { error: updateError } = await supabase
      .from('configuracion')
      .update({ 
        valor_numerico: valorVenta,
        updated_at: new Date().toISOString()
      })
      .eq('clave', 'dolar_conversion')

    if (updateError) {
      throw new Error(`Error al actualizar Supabase: ${updateError.message}`)
    }

    // 3. Recalcular todos los costos fijos en USD
    const { data: costosFijos, error: costosError } = await supabase
      .from('costos')
      .select('id, monto_ars')
      .eq('tipo', 'Fijo')

    if (costosError) {
      console.error('Error al obtener costos:', costosError)
    } else if (costosFijos) {
      // Actualizar cada costo con el nuevo dólar
      for (const costo of costosFijos) {
        if (costo.monto_ars) {
          const nuevoMontoUsd = Math.round((costo.monto_ars / valorVenta) * 100) / 100
          await supabase
            .from('costos')
            .update({ monto_usd: nuevoMontoUsd })
            .eq('id', costo.id)
        }
      }
      console.log(`✅ ${costosFijos.length} costos recalculados`)
    }

    console.log(`✅ Dólar actualizado exitosamente a $${valorVenta}`)

    return NextResponse.json({
      success: true,
      dolar: {
        compra: valorCompra,
        venta: valorVenta,
        fecha: data.fechaActualizacion || new Date().toISOString()
      },
      message: `Dólar actualizado a $${valorVenta} ARS`
    })

  } catch (error: any) {
    console.error('❌ Error en update-dolar:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Error desconocido',
      message: 'No se pudo actualizar el dólar'
    }, { status: 500 })
  }
}

// Permitir POST también para llamadas desde el frontend
export async function POST(request: NextRequest) {
  return GET(request)
}
