'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft,
  Loader2,
  DollarSign,
  Save,
  TrendingUp,
  Settings,
  RefreshCw
} from 'lucide-react'

interface Costo {
  id: string
  nombre: string
  monto_ars: number
  monto_usd: number
  tipo: string
  observacion: string
}

interface Configuracion {
  dolar_conversion: number
  honorario_por_cliente: number
}

export default function ConfiguracionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [costosFijos, setCostosFijos] = useState<Costo[]>([])
  const [config, setConfig] = useState<Configuracion>({
    dolar_conversion: 1500,
    honorario_por_cliente: 55
  })
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [sincronizando, setSincronizando] = useState(false)
  const [sincronizandoPst, setSincronizandoPst] = useState(false)

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.replace('/login')
      return
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)

      // Cargar costos fijos
      const { data: costos, error: costosError } = await supabase
        .from('costos')
        .select('*')
        .eq('tipo', 'Fijo')
        .order('nombre')

      if (costosError) throw costosError

      setCostosFijos(costos || [])

      // Cargar configuración
      const { data: dolarData, error: dolarError } = await supabase
        .from('configuracion')
        .select('valor_numerico')
        .eq('clave', 'dolar_conversion')
        .single()

      if (dolarError) throw dolarError

      const { data: honorarioData, error: honorarioError } = await supabase
        .from('configuracion')
        .select('valor_numerico')
        .eq('clave', 'honorario_por_cliente')
        .single()

      if (honorarioError) throw honorarioError

      setConfig({
        dolar_conversion: parseFloat(String(dolarData?.valor_numerico || 1500)),
        honorario_por_cliente: parseFloat(String(honorarioData?.valor_numerico || 55))
      })

    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCosto = async (costoId: string, nuevoMontoArs: number) => {
    if (nuevoMontoArs < 0) {
      alert('El monto debe ser positivo')
      return
    }

    try {
      setSaving(true)

      // Calcular monto en USD usando el dólar actual
      const nuevoMontoUsd = Math.round((nuevoMontoArs / config.dolar_conversion) * 100) / 100

      const { error } = await supabase
        .from('costos')
        .update({ 
          monto_ars: nuevoMontoArs,
          monto_usd: nuevoMontoUsd
        })
        .eq('id', costoId)

      if (error) throw error

      // Actualizar estado local
      setCostosFijos(prev => prev.map(c => 
        c.id === costoId ? { ...c, monto_ars: nuevoMontoArs, monto_usd: nuevoMontoUsd } : c
      ))

      mostrarMensajeExito('✅ Costo actualizado')
    } catch (error) {
      console.error('Error al actualizar costo:', error)
      alert('Error al actualizar costo')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateDolar = async (nuevoValor: number) => {
    if (nuevoValor <= 0) {
      alert('El valor del dólar debe ser positivo')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase
        .from('configuracion')
        .update({ valor_numerico: nuevoValor })
        .eq('clave', 'dolar_conversion')

      if (error) throw error

      setConfig(prev => ({ ...prev, dolar_conversion: nuevoValor }))

      // Recalcular todos los costos en USD
      for (const costo of costosFijos) {
        const nuevoMontoUsd = Math.round((costo.monto_ars / nuevoValor) * 100) / 100
        await supabase
          .from('costos')
          .update({ monto_usd: nuevoMontoUsd })
          .eq('id', costo.id)
      }

      // Recargar datos
      await loadData()

      mostrarMensajeExito('✅ Dólar actualizado. Costos recalculados.')
    } catch (error) {
      console.error('Error al actualizar dólar:', error)
      alert('Error al actualizar dólar')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateHonorario = async (nuevoValor: number) => {
    if (nuevoValor < 0) {
      alert('El honorario debe ser positivo')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase
        .from('configuracion')
        .update({ valor_numerico: nuevoValor })
        .eq('clave', 'honorario_por_cliente')

      if (error) throw error

      setConfig(prev => ({ ...prev, honorario_por_cliente: nuevoValor }))

      mostrarMensajeExito('✅ Honorario de Agustín actualizado')
    } catch (error) {
      console.error('Error al actualizar honorario:', error)
      alert('Error al actualizar honorario')
    } finally {
      setSaving(false)
    }
  }

  const mostrarMensajeExito = (mensaje: string) => {
    setMensajeExito(mensaje)
    setTimeout(() => setMensajeExito(null), 3000)
  }

  const handleSincronizarDolar = async () => {
    try {
      setSincronizando(true)

      const response = await fetch('/api/update-dolar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        // Recargar datos para mostrar el nuevo valor
        await loadData()
        mostrarMensajeExito(`✅ ${data.message}`)
      } else {
        alert(`Error: ${data.message || 'No se pudo sincronizar el dólar'}`)
      }
    } catch (error) {
      console.error('Error al sincronizar dólar:', error)
      alert('Error de conexión al sincronizar el dólar')
    } finally {
      setSincronizando(false)
    }
  }

  const handleSincronizarPst = async () => {
    try {
      setSincronizandoPst(true)

      // Llamar directamente al backend de Render
      const response = await fetch('https://black-infra-api-pure.onrender.com/sync-pst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        mostrarMensajeExito(`✅ ${data.message}`)
      } else {
        alert(`Error: ${data.message || 'No se pudo sincronizar PST.NET'}`)
      }
    } catch (error) {
      console.error('Error al sincronizar PST:', error)
      alert('Error de conexión al sincronizar PST.NET')
    } finally {
      setSincronizandoPst(false)
    }
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  // Calcular resumen
  const totalFijosArs = costosFijos.reduce((acc, c) => acc + (c.monto_ars || 0), 0)
  const totalFijosUsd = costosFijos.reduce((acc, c) => acc + (c.monto_usd || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-neon-green mx-auto" />
          <p className="mt-4 text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black safe-area-inset-top safe-area-inset-bottom">
      {/* Header */}
      <header className="glass-card border-b border-white/5">
        <div className="mobile-optimized py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Configuración</h1>
                <p className="text-xs text-gray-400">Gastos fijos y parámetros</p>
              </div>
            </div>
            <Settings className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </header>

      {/* Mensaje de Éxito */}
      {mensajeExito && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-neon-green text-black px-6 py-3 rounded-xl font-semibold shadow-lg animate-bounce">
          {mensajeExito}
        </div>
      )}

      {/* Main Content */}
      <main className="mobile-optimized py-4 space-y-4">
        {/* Resumen */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <p className="text-xs text-gray-400">Total Fijos</p>
            </div>
            <p className="text-xl font-bold text-white">${formatCurrency(totalFijosUsd)}</p>
            <p className="text-xs text-gray-500 mt-1">${formatNumber(totalFijosArs)} ARS</p>
          </div>

          <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-neon-green" />
              <p className="text-xs text-gray-400">Dólar Actual</p>
            </div>
            <p className="text-xl font-bold text-neon-green">${formatNumber(config.dolar_conversion)}</p>
            <p className="text-xs text-gray-500 mt-1">ARS por USD</p>
          </div>
        </div>

        {/* Parámetros del Sistema */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Parámetros del Sistema</h2>

          {/* Dólar Blue */}
          <div className="bg-white/[0.02] rounded-xl p-4 space-y-3 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Dólar Blue</h3>
                <p className="text-xs text-gray-500">Conversión ARS → USD</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/30">
                Sistema
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-green text-lg font-bold">$</span>
              <input
                type="number"
                value={config.dolar_conversion || ''}
                onChange={(e) => {
                  const valor = parseFloat(e.target.value) || 0
                  setConfig(prev => ({ ...prev, dolar_conversion: valor }))
                }}
                onBlur={(e) => {
                  const valor = parseFloat(e.target.value) || 0
                  if (valor !== config.dolar_conversion && valor > 0) {
                    handleUpdateDolar(valor)
                  }
                }}
                disabled={saving || sincronizando}
                className="w-full bg-white/5 text-white rounded-xl pl-10 pr-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-neon-green/50 disabled:opacity-50"
              />
            </div>

            {/* Botón de Sincronización */}
            <button
              onClick={handleSincronizarDolar}
              disabled={sincronizando || saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/30"
            >
              <RefreshCw className={`h-4 w-4 ${sincronizando ? 'animate-spin' : ''}`} />
              {sincronizando ? 'Sincronizando...' : '🔄 Sincronizar Dólar Ahora'}
            </button>

            <p className="text-xs text-gray-500">
              💡 Al cambiar este valor manualmente o sincronizar, todos los costos en ARS se recalcularán en USD automáticamente.
            </p>
          </div>

          {/* Honorario Agustín */}
          <div className="bg-white/[0.02] rounded-xl p-4 space-y-3 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Honorario por Cliente</h3>
                <p className="text-xs text-gray-500">Comisión de Agustín</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold border border-purple-500/30">
                Variable
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-green text-lg font-bold">$</span>
              <input
                type="number"
                value={config.honorario_por_cliente || ''}
                onChange={(e) => {
                  const valor = parseFloat(e.target.value) || 0
                  setConfig(prev => ({ ...prev, honorario_por_cliente: valor }))
                }}
                onBlur={(e) => {
                  const valor = parseFloat(e.target.value) || 0
                  if (valor !== config.honorario_por_cliente) {
                    handleUpdateHonorario(valor)
                  }
                }}
                disabled={saving}
                className="w-full bg-white/5 text-white rounded-xl pl-10 pr-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-neon-green/50 disabled:opacity-50"
              />
            </div>

            <p className="text-xs text-gray-500">
              💡 Este valor se multiplica por la cantidad de clientes activos que comisionan.
            </p>
          </div>

          {/* PST.NET Balance */}
          <div className="bg-white/[0.02] rounded-xl p-4 space-y-3 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">PST.NET Balance</h3>
                <p className="text-xs text-gray-500">Sincronización de ingresos</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/30">
                Ingreso
              </div>
            </div>

            {/* Botón de Sincronización PST */}
            <button
              onClick={handleSincronizarPst}
              disabled={sincronizandoPst || saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-green-500/30"
            >
              <RefreshCw className={`h-4 w-4 ${sincronizandoPst ? 'animate-spin' : ''}`} />
              {sincronizandoPst ? 'Sincronizando...' : '💰 Sincronizar PST.NET'}
            </button>

            <p className="text-xs text-gray-500">
              💡 Calcula el 50% de (Balance USDT + Cashback) y lo registra como ingreso proyectado.
            </p>
          </div>
        </div>

        {/* Costos Fijos */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Costos Fijos Mensuales</h2>

          {costosFijos.map((costo) => (
            <div 
              key={costo.id} 
              className="bg-white/[0.02] rounded-xl p-4 space-y-3 border border-white/5"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{costo.nombre}</h3>
                  <p className="text-xs text-gray-500">{costo.observacion}</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/30">
                  Fijo
                </div>
              </div>

              {/* Monto en ARS */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Monto Mensual (ARS)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">$</span>
                  <input
                    type="number"
                    value={costo.monto_ars || ''}
                    onChange={(e) => {
                      const valor = parseFloat(e.target.value) || 0
                      setCostosFijos(prev => prev.map(c => 
                        c.id === costo.id ? { ...c, monto_ars: valor } : c
                      ))
                    }}
                    onBlur={(e) => {
                      const valor = parseFloat(e.target.value) || 0
                      if (valor !== costo.monto_ars) {
                        handleUpdateCosto(costo.id, valor)
                      }
                    }}
                    disabled={saving}
                    className="w-full bg-white/5 text-white rounded-xl pl-10 pr-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-neon-green/50 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Equivalente en USD */}
              <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-lg">
                <span className="text-sm text-gray-400">Equivalente en USD:</span>
                <span className="text-lg font-bold text-neon-green">
                  ${formatCurrency(costo.monto_ars / config.dolar_conversion)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer con información */}
        <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="font-semibold text-white">ℹ️ Nota:</span> Los cambios se guardan automáticamente al salir de cada campo. 
            El Dashboard principal se actualizará con los nuevos valores en el próximo cálculo.
          </p>
        </div>
      </main>
    </div>
  )
}
