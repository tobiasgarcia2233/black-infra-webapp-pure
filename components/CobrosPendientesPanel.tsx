'use client'

import React, { useState } from 'react'
import { Calendar, ChevronDown, ChevronUp, AlertCircle, DollarSign, Check, Loader2 } from 'lucide-react'
import { CobroDetalle, supabase } from '@/lib/supabase'
import { usePeriodo } from '@/contexts/PeriodoContext'
import toast from 'react-hot-toast'

interface CobrosPendientesPanelProps {
  cobros: CobroDetalle[]
  totalSemana: number
  onCobroRegistrado: () => void
}

export default function CobrosPendientesPanel({ cobros, totalSemana, onCobroRegistrado }: CobrosPendientesPanelProps) {
  const [expandido, setExpandido] = useState(false)
  const [procesando, setProcesando] = useState<string | null>(null)
  const { periodoSeleccionado } = usePeriodo()

  if (cobros.length === 0) return null

  // Calcular días restantes hasta una fecha
  const calcularDiasRestantes = (fechaStr: string): number => {
    const fechaVencimiento = new Date(fechaStr + 'T00:00:00')
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const diffTime = fechaVencimiento.getTime() - hoy.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Formatear fecha en español
  const formatearFecha = (fechaStr: string): string => {
    const fecha = new Date(fechaStr + 'T00:00:00')
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${fecha.getDate()} de ${meses[fecha.getMonth()]}`
  }

  // Obtener clases CSS según días restantes
  const getClasesUrgencia = (dias: number): string => {
    if (dias < 0 || dias === 0) {
      // Atrasado o HOY
      return 'bg-red-500/20 text-red-400 border-red-500/50'
    } else if (dias <= 3) {
      // Urgente (1-3 días)
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
    } else if (dias <= 7) {
      // Esta semana (4-7 días)
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    } else {
      // Normal (más de 7 días)
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  // Obtener texto del badge
  const getTextoBadge = (dias: number): string => {
    if (dias < 0) {
      const diasAtrasados = Math.abs(dias)
      return `Atrasado ${diasAtrasados} día${diasAtrasados === 1 ? '' : 's'}`
    } else if (dias === 0) {
      return 'HOY'
    } else if (dias === 1) {
      return 'Mañana'
    } else if (dias <= 3) {
      return `En ${dias} días`
    } else {
      return `En ${dias} días`
    }
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  // Calcular el mes aplicado (próximo mes) para cobros adelantados
  const calcularMesAplicado = (fechaCobro: Date): string => {
    // Los cobros son por adelantado, entonces el servicio corresponde al mes siguiente
    const mesProximo = new Date(fechaCobro)
    mesProximo.setMonth(mesProximo.getMonth() + 1)
    
    const mes = String(mesProximo.getMonth() + 1).padStart(2, '0')
    const anio = mesProximo.getFullYear()
    
    return `${mes}-${anio}`
  }

  // Función para registrar un cobro
  const registrarCobro = async (cobro: CobroDetalle) => {
    try {
      setProcesando(cobro.cliente_id)

      const fechaCobroHoy = new Date()
      const mesAplicado = calcularMesAplicado(fechaCobroHoy)

      // Verificar si ya existe un cobro para este cliente en el mes aplicado
      // (No puede haber dos cobros del mismo cliente para el mismo mes de servicio)
      const { data: cobroExistente, error: errorVerificacion } = await supabase
        .from('ingresos')
        .select('id, periodo, mes_aplicado')
        .eq('cliente_id', cobro.cliente_id)
        .eq('mes_aplicado', mesAplicado)
        .single()

      if (cobroExistente) {
        const [mesNum, anioNum] = mesAplicado.split('-')
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        const nombreMes = meses[parseInt(mesNum) - 1]
        
        toast.error(`Ya existe un cobro para ${nombreMes} ${anioNum}`)
        setProcesando(null)
        return
      }

      if (errorVerificacion && errorVerificacion.code !== 'PGRST116') {
        throw errorVerificacion
      }

      // Obtener el dólar de conversión actual
      const { data: configDolar, error: errorDolar } = await supabase
        .from('configuracion')
        .select('valor_numerico')
        .eq('clave', 'dolar_conversion')
        .single()

      if (errorDolar) throw errorDolar

      const dolarConversion = parseFloat(String(configDolar?.valor_numerico || 1))
      const montoARS = cobro.fee_monto * dolarConversion

      // Registrar el cobro con atribución temporal correcta
      const { error: errorInsert } = await supabase
        .from('ingresos')
        .insert({
          cliente_id: cobro.cliente_id,
          monto_usd_total: cobro.fee_monto,
          monto_ars: montoARS,
          fecha_cobro: fechaCobroHoy.toISOString().split('T')[0],  // Cuándo entró el dinero
          periodo: periodoSeleccionado,                             // Periodo del sistema (contexto)
          mes_aplicado: mesAplicado,                                // Mes del servicio (adelantado)
          detalle: `Cobro adelantado para ${mesAplicado}`
        })

      if (errorInsert) throw errorInsert

      // Mostrar mensaje de éxito con claridad sobre la atribución
      const [mesNum, anioNum] = mesAplicado.split('-')
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      const nombreMes = meses[parseInt(mesNum) - 1]
      
      toast.success(
        `✅ ${cobro.cliente_nombre}: $${cobro.fee_monto} cobrado para ${nombreMes}`,
        { duration: 4000 }
      )
      
      // Refrescar datos del dashboard
      onCobroRegistrado()
      
    } catch (error) {
      console.error('Error al registrar cobro:', error)
      toast.error('Error al registrar el cobro')
    } finally {
      setProcesando(null)
    }
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-yellow-500/20">
      {/* Header - Siempre visible */}
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Calendar className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Cobros pendientes esta semana</p>
              <p className="text-xs text-gray-400">{cobros.length} cliente{cobros.length === 1 ? '' : 's'} con vencimiento próximo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {expandido ? (
              <ChevronUp className="h-5 w-5 text-yellow-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-yellow-400" />
            )}
          </div>
        </div>

        {/* Total a Cobrar - Grande */}
        <div className="flex items-center justify-between bg-yellow-500/5 rounded-xl p-3 border border-yellow-500/20">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Total a cobrar:</span>
          </div>
          <span className="text-2xl font-bold text-yellow-400">${formatCurrency(totalSemana)}</span>
        </div>
      </button>

      {/* Lista Detallada - Expandible */}
      {expandido && (
        <div className="border-t border-white/5">
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {cobros.map((cobro) => {
              const diasRestantes = calcularDiasRestantes(cobro.fecha_exacta)
              return (
                <div
                  key={cobro.cliente_id}
                  className="bg-white/[0.02] rounded-xl p-3 border border-white/5 hover:bg-white/[0.04] transition-colors"
                >
                  {/* Fila: Nombre y Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-white truncate flex-1">
                      {cobro.cliente_nombre}
                    </p>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 ml-2 ${getClasesUrgencia(diasRestantes)}`}>
                      {diasRestantes <= 0 && (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {getTextoBadge(diasRestantes)}
                    </span>
                  </div>

                  {/* Fila: Monto, Fecha y Botón de Cobro */}
                  <div className="flex items-center justify-between text-xs gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-400">
                        📅 {formatearFecha(cobro.fecha_exacta)}
                      </span>
                      <span className="text-neon-green font-bold text-sm">
                        ${formatCurrency(cobro.fee_monto)}
                      </span>
                    </div>
                    
                    {/* Botón de Cobro */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        registrarCobro(cobro)
                      }}
                      disabled={procesando === cobro.cliente_id || cobro.ya_cobrado}
                      className={`
                        flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl
                        font-semibold text-xs transition-all
                        ${cobro.ya_cobrado 
                          ? 'bg-gray-500/20 text-gray-500 border border-gray-500/30 cursor-not-allowed'
                          : 'bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/20 active:scale-95'
                        }
                        ${procesando === cobro.cliente_id ? 'opacity-50' : ''}
                        min-w-[90px]
                      `}
                    >
                      {procesando === cobro.cliente_id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>...</span>
                        </>
                      ) : cobro.ya_cobrado ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Cobrado</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Cobrar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer con resumen */}
          <div className="border-t border-white/5 p-3 bg-white/[0.02]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">
                💡 Tip: Los cobros atrasados aparecen primero
              </span>
              <span className="text-gray-500">
                {cobros.filter(c => calcularDiasRestantes(c.fecha_exacta) <= 0).length} urgentes
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
