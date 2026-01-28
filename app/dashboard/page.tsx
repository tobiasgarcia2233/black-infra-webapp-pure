'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, ResumenFinanciero, CobroDetalle } from '@/lib/supabase'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  LogOut,
  Loader2,
  Users,
  Settings,
  Briefcase,
  Wallet,
  RefreshCw,
  Clock
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { usePeriodo } from '@/contexts/PeriodoContext'
import PeriodoSelector from '@/components/PeriodoSelector'
import CobrosPendientesPanel from '@/components/CobrosPendientesPanel'

export default function DashboardPage() {
  const router = useRouter()
  const { periodoSeleccionado } = usePeriodo()
  const [loading, setLoading] = useState(true)
  const [resumen, setResumen] = useState<ResumenFinanciero | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [cobrosSemana, setCobrosSemana] = useState<CobroDetalle[]>([])
  const [totalSemana, setTotalSemana] = useState<number>(0)
  const [dolarBlue, setDolarBlue] = useState<number>(1200)
  const [sincronizandoPst, setSincronizandoPst] = useState(false)
  const [mensajePst, setMensajePst] = useState<string | null>(null)
  const [cashbackHold, setCashbackHold] = useState<number>(0)
  const [vistaActiva, setVistaActiva] = useState<'liquidez' | 'performance'>('liquidez')
  const [refrescando, setRefrescando] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    // FORZAR REFRESH al cambiar periodo o vista
    console.log('🔄 Cambio detectado - Refrescando datos...')
    loadDashboardData(true)  // Force refresh = true
    loadCobrosPendientes()
  }, [periodoSeleccionado, vistaActiva])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.replace('/login')
      return
    }

    setUserName(session.user.email?.split('@')[0] || 'Usuario')
  }

  const loadDashboardData = async (forceRefresh = false) => {
    try {
      setLoading(true)

      // Obtener ingresos según la vista activa
      // LIQUIDEZ: Todo lo cobrado en este periodo (periodo = fecha de cobro)
      // PERFORMANCE: Solo lo que corresponde a este mes de servicio (mes_aplicado)
      const campoFiltro = vistaActiva === 'liquidez' ? 'periodo' : 'mes_aplicado'
      
      console.log('🔄 Cargando datos del dashboard...')
      console.log('   Vista:', vistaActiva)
      console.log('   Periodo:', periodoSeleccionado)
      console.log('   Campo filtro:', campoFiltro)
      console.log('   Force refresh:', forceRefresh)
      
      // Agregar timestamp para evitar caché del navegador/Supabase
      const timestamp = forceRefresh ? `?_=${Date.now()}` : ''
      
      const { data: ingresos, error: ingresosError } = await supabase
        .from('ingresos')
        .select('monto_ars, monto_usd_total, fecha_cobro, periodo, mes_aplicado')
        .eq(campoFiltro, periodoSeleccionado)
        // Forzar bypass de caché de Supabase
        .order('created_at', { ascending: false })

      console.log('   Registros encontrados:', ingresos?.length || 0)
      
      // Mostrar desglose de ingresos en consola
      if (ingresos && ingresos.length > 0) {
        console.log('   📊 DESGLOSE DE INGRESOS:')
        const totalUSD = ingresos.reduce((sum, ing) => sum + (parseFloat(String(ing.monto_usd_total || 0))), 0)
        console.log(`   Total USD: $${totalUSD.toFixed(2)}`)
        console.log('   Primeros 3 registros:')
        ingresos.slice(0, 3).forEach((ing, idx) => {
          console.log(`   ${idx + 1}. $${ing.monto_usd_total} - ${ing.fecha_cobro} - periodo:${ing.periodo} - mes_aplicado:${ing.mes_aplicado}`)
        })
      } else {
        console.log('   ⚠️ No se encontraron registros para este periodo/vista')
      }
      
      if (ingresosError) throw ingresosError

      // Obtener costos del periodo seleccionado (con tipos)
      const { data: costos, error: costosError } = await supabase
        .from('costos')
        .select('monto_usd, tipo, nombre, observacion')
        .eq('periodo', periodoSeleccionado)

      if (costosError) throw costosError

      // Obtener cantidad de clientes activos que comisionan a Agustín
      const { count: clientesComisionAgustin, error: clientesError } = await supabase
        .from('clientes')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'Activo')
        .eq('comisiona_agustin', true)

      if (clientesError) throw clientesError

      // Obtener honorario por cliente desde configuración
      const { data: configHonorario, error: honorarioError } = await supabase
        .from('configuracion')
        .select('valor_numerico')
        .eq('clave', 'honorario_por_cliente')
        .single()

      if (honorarioError) throw honorarioError

      // Obtener balance neto de PST.NET desde configuración
      const { data: configPstBalance, error: pstBalanceError } = await supabase
        .from('configuracion')
        .select('valor_numerico')
        .eq('clave', 'pst_balance_neto')
        .single()

      // No lanzar error si no existe, simplemente usar 0
      const pst_balance_neto = pstBalanceError ? 0 : (parseFloat(String(configPstBalance?.valor_numerico || 0)))

      // Obtener dólar blue para conversión a ARS
      const { data: configDolar, error: dolarError } = await supabase
        .from('configuracion')
        .select('valor_numerico')
        .eq('clave', 'dolar_conversion')
        .single()

      // No lanzar error si no existe, usar valor por defecto
      const dolar_conversion = dolarError ? 1200 : (parseFloat(String(configDolar?.valor_numerico || 1200)))
      setDolarBlue(dolar_conversion)

      // Obtener hold cashback para mostrar "Próximo Ingreso"
      const { data: configHold, error: holdError } = await supabase
        .from('configuracion')
        .select('valor_numerico')
        .eq('clave', 'pst_cashback_hold')
        .single()

      const cashback_hold = holdError ? 0 : (parseFloat(String(configHold?.valor_numerico || 0)))
      setCashbackHold(cashback_hold)

      // Calcular costo dinámico de Agustín (solo clientes que comisionan)
      const costoAgustin = (clientesComisionAgustin || 0) * (parseFloat(String(configHonorario?.valor_numerico || 0)))

      // Calcular ingresos proyectados (suma de fee_mensual de clientes activos)
      const { data: clientesActivos, error: ingresosProyectadosError } = await supabase
        .from('clientes')
        .select('fee_mensual')
        .eq('estado', 'Activo')

      if (ingresosProyectadosError) throw ingresosProyectadosError

      const ingresos_proyectados = clientesActivos?.reduce((acc, cliente) => 
        acc + (parseFloat(String(cliente.fee_mensual || 0))), 0) || 0

      // Calcular totales
      const total_ars = ingresos?.reduce((acc, ing) => acc + (parseFloat(String(ing.monto_ars || 0))), 0) || 0
      const total_usd = ingresos?.reduce((acc, ing) => acc + (parseFloat(String(ing.monto_usd_total || 0))), 0) || 0
      const total_costos_fijos = costos?.reduce((acc, cost) => acc + (parseFloat(String(cost.monto_usd || 0))), 0) || 0
      const total_costos = total_costos_fijos + costoAgustin
      
      // Neto de honorarios (sin PST)
      const neto_honorarios = total_usd - total_costos
      
      // ============================================================
      // LÓGICA DE PST.NET - SOLO PARA MES ACTUAL
      // ============================================================
      // PST.NET es el saldo de HOY, solo se suma al neto si estamos
      // viendo el mes ACTUAL. Para meses futuros, no tiene sentido
      // incluir el saldo actual de PST porque no es un ingreso futuro.
      
      // Detectar mes actual en formato MM-YYYY
      const ahora = new Date()
      const mesActual = String(ahora.getMonth() + 1).padStart(2, '0')
      const anioActual = ahora.getFullYear()
      const periodoActual = `${mesActual}-${anioActual}`
      
      const esPeriodoActual = periodoSeleccionado === periodoActual
      
      console.log('💰 LÓGICA DE PST.NET:')
      console.log('   Periodo actual del sistema:', periodoActual)
      console.log('   Periodo seleccionado:', periodoSeleccionado)
      console.log('   ¿Es periodo actual?:', esPeriodoActual)
      console.log('   Balance PST disponible:', pst_balance_neto)
      
      // NETO TOTAL: Solo incluye PST si es el mes actual
      let neto_usd = neto_honorarios
      let pst_incluido = false
      
      if (esPeriodoActual) {
        neto_usd = neto_honorarios + pst_balance_neto
        pst_incluido = true
        console.log('   ✅ PST sumado al Neto Total')
      } else {
        console.log('   ⏭️  PST NO sumado (periodo futuro/pasado)')
      }
      
      console.log('   Neto de honorarios:', neto_honorarios)
      console.log('   PST incluido:', pst_incluido ? pst_balance_neto : 0)
      console.log('   NETO TOTAL:', neto_usd)

      setResumen({
        total_ars,
        total_usd,
        total_costos,
        neto_usd,
        ingresos_proyectados,
        pst_balance_neto, // Para mostrar en UI si es mes actual
        pst_incluido, // Flag para saber si PST está incluido en el neto
      })
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCobrosPendientes = async () => {
    try {
      // Llamar a la función SQL que devuelve el detalle completo
      const { data, error } = await supabase
        .rpc('obtener_detalle_cobros_semana')

      if (error) throw error

      if (data && data.length > 0) {
        // Obtener los cobros ya registrados en este periodo
        const { data: cobrosRegistrados, error: errorCobros } = await supabase
          .from('ingresos')
          .select('cliente_id')
          .eq('periodo', periodoSeleccionado)

        if (errorCobros) throw errorCobros

        const clientesCobrados = new Set(cobrosRegistrados?.map(c => c.cliente_id) || [])

        // Marcar los cobros que ya fueron registrados
        const cobrosConEstado = data.map((cobro: any) => ({
          ...cobro,
          ya_cobrado: clientesCobrados.has(cobro.cliente_id)
        }))

        setCobrosSemana(cobrosConEstado as CobroDetalle[])
        // Calcular el total sumando solo los no cobrados
        const total = cobrosConEstado
          .filter((c: any) => !c.ya_cobrado)
          .reduce((acc: number, cobro: any) => 
            acc + (parseFloat(String(cobro.fee_monto || 0))), 0)
        setTotalSemana(total)
      } else {
        setCobrosSemana([])
        setTotalSemana(0)
      }
    } catch (error) {
      console.error('Error al cargar cobros pendientes:', error)
      setCobrosSemana([])
      setTotalSemana(0)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const handleCobroRegistrado = () => {
    // Refrescar todos los datos del dashboard
    loadDashboardData()
    loadCobrosPendientes()
  }

  // Función de refresh manual con feedback visual
  const handleRefreshDashboard = async () => {
    try {
      setRefrescando(true)
      console.log('🔄 REFRESH MANUAL INICIADO')
      
      // Forzar recarga sin caché
      await loadDashboardData(true)
      await loadCobrosPendientes()
      
      console.log('✅ REFRESH COMPLETADO')
      
      // Mostrar feedback temporal
      const originalTitle = document.title
      document.title = '✓ Actualizado'
      setTimeout(() => {
        document.title = originalTitle
      }, 2000)
      
    } catch (error) {
      console.error('❌ Error en refresh:', error)
    } finally {
      setRefrescando(false)
    }
  }

  const handleSincronizarPst = async () => {
    try {
      setSincronizandoPst(true)
      setMensajePst(null)

      // Llamar directamente al backend de Render
      const response = await fetch('https://black-infra-api-pure.onrender.com/sync-pst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        // Recargar datos del dashboard para mostrar el nuevo balance PST
        await loadDashboardData(true)  // Force refresh
        setMensajePst('¡Actualizado!')
        
        // Limpiar mensaje después de 2 segundos
        setTimeout(() => setMensajePst(null), 2000)
      } else {
        setMensajePst('Error al sincronizar')
        setTimeout(() => setMensajePst(null), 3000)
      }
    } catch (error) {
      console.error('Error al sincronizar PST:', error)
      setMensajePst('Error de conexión')
      setTimeout(() => setMensajePst(null), 3000)
    } finally {
      setSincronizandoPst(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  // Convertir periodo (MM-YYYY) a formato legible para el gráfico
  const formatearPeriodoGrafico = (periodo: string) => {
    const [mes, anio] = periodo.split('-')
    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ]
    return `${meses[parseInt(mes) - 1]} ${anio}`
  }

  // Datos para el gráfico
  // PST.NET solo se incluye si es el periodo actual (resumen.pst_incluido)
  const chartData = [
    {
      name: formatearPeriodoGrafico(periodoSeleccionado),
      Ingresos: (resumen?.total_usd || 0) + (resumen?.pst_incluido ? (resumen?.pst_balance_neto || 0) : 0),
      Gastos: resumen?.total_costos || 0,
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-neon-green mx-auto" />
          <p className="mt-4 text-gray-400">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black safe-area-inset-top safe-area-inset-bottom">
      {/* Header */}
      <header className="glass-card border-b border-white/5">
        <div className="mobile-optimized py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Dashboard</h1>
              <p className="text-xs text-gray-400">Hola, {userName}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Botón de Refresh */}
              <button
                onClick={handleRefreshDashboard}
                disabled={refrescando}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neon-green hover:text-white transition-colors glass-card rounded-lg border border-neon-green/20 hover:border-neon-green/40 disabled:opacity-50"
                title="Actualizar datos desde Supabase"
              >
                <RefreshCw className={`h-4 w-4 ${refrescando ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {refrescando ? 'Actualizando...' : 'Actualizar'}
                </span>
              </button>
              
              {/* Botón de Salir */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white transition-colors glass-card rounded-lg"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
          
          {/* Time Machine - Selector de Periodo */}
          <div className="w-full">
            <PeriodoSelector />
          </div>

          {/* Selector de Vista: Liquidez vs Performance */}
          <div className="w-full flex gap-2">
            <button
              onClick={() => setVistaActiva('liquidez')}
              className={`
                flex-1 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all
                ${vistaActiva === 'liquidez'
                  ? 'bg-neon-green/20 text-neon-green border-2 border-neon-green/50 shadow-lg shadow-neon-green/20'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }
              `}
            >
              💰 Liquidez Actual
            </button>
            <button
              onClick={() => setVistaActiva('performance')}
              className={`
                flex-1 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all
                ${vistaActiva === 'performance'
                  ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }
              `}
            >
              📊 Performance Mensual
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mobile-optimized py-4 space-y-4">
        {/* KPIs Section */}
        <div className="grid grid-cols-1 gap-3">
          {/* KPI 1: Neto USD - Hero Card con Desglose */}
          <div className="glass-card-strong rounded-2xl p-5 neon-green-glow border-neon-green/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-neon-green/10 rounded-xl backdrop-blur-sm border border-neon-green/20">
                <DollarSign className="h-5 w-5 text-neon-green" />
              </div>
              <span className="text-xs text-gray-500 px-2 py-1 rounded-md bg-white/5">
                {formatearPeriodoGrafico(periodoSeleccionado)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-medium text-gray-400">
                  {vistaActiva === 'liquidez' ? '💰 Liquidez Total' : '📊 Neto del Mes'}
                </p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${
                  vistaActiva === 'liquidez' 
                    ? 'bg-neon-green/10 text-neon-green/80 border border-neon-green/20' 
                    : 'bg-blue-500/10 text-blue-400/80 border border-blue-500/20'
                }`}>
                  {vistaActiva === 'liquidez' ? 'Todo cobrado' : 'Solo este mes'}
                </span>
              </div>
              <p className="text-4xl font-bold neon-text-green">${formatCurrency(resumen?.neto_usd || 0)}</p>
              
              {/* Conversión a ARS */}
              <p className="text-lg text-gray-400 mt-2">
                ${formatNumber((resumen?.neto_usd || 0) * dolarBlue)} ARS
              </p>

              {/* Descripción de la vista activa */}
              <div className="mt-3 mb-4 p-2 bg-white/5 rounded-lg border border-white/10">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  {vistaActiva === 'liquidez' 
                    ? '💡 Liquidez: Todo el dinero que entró en este periodo, sin importar a qué mes de servicio pertenece.'
                    : '💡 Performance: Solo los ingresos que corresponden al trabajo de este mes específico.'
                  }
                </p>
              </div>

              {/* Nota: PST solo para mes actual */}
              {resumen && !resumen.pst_incluido && (resumen.pst_balance_neto ?? 0) > 0 && (
                <div className="mt-3 mb-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-[10px] text-amber-400 leading-relaxed font-medium">
                    ⚠️ PST.NET (${ formatCurrency(resumen.pst_balance_neto || 0)}) no está incluido en este periodo.
                    El saldo de PST solo se suma al Neto Total del mes actual.
                  </p>
                </div>
              )}
              
              {/* Desglose del Neto - Mini Cards */}
              {/* Solo mostrar si es periodo actual Y hay PST */}
              {resumen && resumen.pst_incluido && (resumen.pst_balance_neto ?? 0) > 0 && (
                <div className="space-y-2 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Mini Card 1: Honorarios */}
                    <div className="bg-black/20 rounded-xl p-3 backdrop-blur-sm border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg">
                          <Briefcase className="h-3.5 w-3.5 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Honorarios</span>
                      </div>
                      <p className="text-lg font-bold text-white">
                        ${formatCurrency((resumen.total_usd - resumen.total_costos) || 0)}
                      </p>
                    </div>

                    {/* Mini Card 2: PST.NET Depositado */}
                    <div className="bg-black/20 rounded-xl p-3 backdrop-blur-sm border border-fuchsia-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-fuchsia-500/10 rounded-lg">
                            <Wallet className="h-3.5 w-3.5 text-fuchsia-400" />
                          </div>
                          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">PST Depositado</span>
                        </div>
                        
                        {/* Botón de actualización */}
                        <button
                          onClick={handleSincronizarPst}
                          disabled={sincronizandoPst}
                          className="p-1 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Actualizar balance PST"
                        >
                          <RefreshCw className={`h-3 w-3 text-fuchsia-400 ${sincronizandoPst ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                      
                      <p className="text-lg font-bold text-fuchsia-400">
                        ${formatCurrency(resumen.pst_balance_neto || 0)}
                      </p>
                      <p className="text-[9px] text-gray-500 mt-1">(50% aplicado)</p>
                      
                      {/* Mensaje de feedback */}
                      {mensajePst && (
                        <p className="text-[10px] text-fuchsia-400 mt-1 animate-pulse">
                          {mensajePst}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Próximo Ingreso (Hold Cashback) - Ancho Completo */}
                  <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm border border-amber-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                          <Clock className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-300 uppercase tracking-wide block">Próximo Ingreso Estimado</span>
                          <span className="text-[10px] text-gray-500">Esperando depósito de plataforma</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-amber-400">
                          ${formatCurrency((cashbackHold / 2) || 0)}
                        </p>
                        <p className="text-[9px] text-gray-500 mt-1">(50% aplicado)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* KPI 2 y 3: Grid de 2 columnas */}
          <div className="grid grid-cols-2 gap-3">
            {/* KPI 2: Total Ingresos */}
            <div className="glass-card rounded-xl p-4">
              <div className="p-2 bg-neon-green/10 rounded-lg w-fit mb-3 border border-neon-green/20">
                <TrendingUp className="h-4 w-4 text-neon-green" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Ingresos</p>
                <p className="text-xl font-bold text-white">${formatCurrency(resumen?.total_usd || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">${formatNumber(resumen?.total_ars || 0)} ARS</p>
              </div>
            </div>

            {/* KPI 3: Total Gastos */}
            <div className="glass-card rounded-xl p-4">
              <div className="p-2 bg-gray-500/10 rounded-lg w-fit mb-3 border border-gray-500/20">
                <TrendingDown className="h-4 w-4 text-gray-300" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Gastos</p>
                <p className="text-xl font-bold text-white">${formatCurrency(resumen?.total_costos || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">USD</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="glass-card rounded-2xl p-4">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white">
              {vistaActiva === 'liquidez' ? '💰 Liquidez vs Gastos' : '📊 Performance Mensual'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {vistaActiva === 'liquidez' 
                ? (resumen?.pst_incluido 
                    ? 'Todo lo cobrado en este periodo + PST.NET (mes actual)'
                    : 'Todo lo cobrado en este periodo (PST.NET solo en mes actual)')
                : (resumen?.pst_incluido
                    ? 'Ingresos que corresponden al trabajo de este mes + PST.NET (mes actual)'
                    : 'Ingresos que corresponden al trabajo de este mes (PST.NET solo en mes actual)')
              }
            </p>
          </div>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#666"
                  style={{ fontSize: '11px' }}
                  tick={{ fill: '#888' }}
                />
                <YAxis 
                  stroke="#666"
                  style={{ fontSize: '11px' }}
                  tick={{ fill: '#888' }}
                  tickFormatter={(value) => `$${formatNumber(value)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(10px)',
                    color: '#fff',
                  }}
                  formatter={(value: any) => [`$${formatCurrency(value)}`, '']}
                  labelStyle={{ color: '#888' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  iconType="circle"
                />
                <Bar 
                  dataKey="Ingresos" 
                  fill="#00ff41" 
                  radius={[6, 6, 0, 0]}
                  name="Ingresos USD"
                />
                <Bar 
                  dataKey="Gastos" 
                  fill="#888888" 
                  radius={[6, 6, 0, 0]}
                  name="Gastos USD"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Ratio</p>
            <p className="text-xl font-bold text-neon-green">
              {resumen?.total_costos ? (
                ((resumen.total_usd + (resumen.pst_balance_neto || 0)) / resumen.total_costos).toFixed(2)
              ) : '0'}x
            </p>
          </div>
          
          <div className="glass-card rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Margen</p>
            <p className="text-xl font-bold text-neon-green">
              {(resumen?.total_usd || 0) + (resumen?.pst_balance_neto || 0) > 0 ? (
                (((resumen?.neto_usd || 0) / ((resumen?.total_usd || 0) + (resumen?.pst_balance_neto || 0))) * 100).toFixed(1)
              ) : '0'}%
            </p>
          </div>
        </div>

        {/* Panel de Tesorería Semanal */}
        <CobrosPendientesPanel 
          cobros={cobrosSemana} 
          totalSemana={totalSemana}
          onCobroRegistrado={handleCobroRegistrado}
        />

        {/* Accesos Rápidos */}
        <div className="space-y-3">
          {/* Gestión de Clientes */}
          <button
            onClick={() => router.push('/dashboard/clientes')}
            className="w-full glass-card rounded-xl p-4 hover:bg-white/10 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neon-green/10 rounded-lg border border-neon-green/20">
                <Users className="h-5 w-5 text-neon-green" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Gestión de Clientes</p>
                <p className="text-xs text-gray-400">Administrar estados, fees y comisiones</p>
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-white transition-colors">→</div>
          </button>

          {/* Configuración */}
          <button
            onClick={() => router.push('/dashboard/configuracion')}
            className="w-full glass-card rounded-xl p-4 hover:bg-white/10 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Settings className="h-5 w-5 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Configuración</p>
                <p className="text-xs text-gray-400">Costos fijos, dólar y parámetros</p>
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-white transition-colors">→</div>
          </button>
        </div>
      </main>
    </div>
  )
}
