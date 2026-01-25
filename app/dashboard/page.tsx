'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, ResumenFinanciero } from '@/lib/supabase'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  LogOut,
  Loader2,
  Users,
  Settings
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [resumen, setResumen] = useState<ResumenFinanciero | null>(null)
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    checkAuth()
    loadDashboardData()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.replace('/login')
      return
    }

    setUserName(session.user.email?.split('@')[0] || 'Usuario')
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Obtener ingresos de Enero 2026
      const { data: ingresos, error: ingresosError } = await supabase
        .from('ingresos')
        .select('monto_ars, monto_usd_total')
        .gte('fecha_cobro', '2026-01-01')
        .lte('fecha_cobro', '2026-01-31')

      if (ingresosError) throw ingresosError

      // Obtener costos de Enero 2026 (con tipos)
      const { data: costos, error: costosError } = await supabase
        .from('costos')
        .select('monto_usd, tipo, nombre, observacion')
        .gte('created_at', '2026-01-01')
        .lte('created_at', '2026-01-31')

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
      const neto_usd = total_usd - total_costos

      setResumen({
        total_ars,
        total_usd,
        total_costos,
        neto_usd,
        ingresos_proyectados,
      })
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
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

  // Datos para el gráfico
  const chartData = [
    {
      name: 'Enero 2026',
      Ingresos: resumen?.total_usd || 0,
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
        <div className="mobile-optimized py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Dashboard</h1>
              <p className="text-xs text-gray-400">Hola, {userName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white transition-colors glass-card rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mobile-optimized py-4 space-y-4">
        {/* KPIs Section */}
        <div className="grid grid-cols-1 gap-3">
          {/* KPI 1: Neto USD - Hero Card */}
          <div className="glass-card-strong rounded-2xl p-5 neon-green-glow border-neon-green/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-neon-green/10 rounded-xl backdrop-blur-sm border border-neon-green/20">
                <DollarSign className="h-5 w-5 text-neon-green" />
              </div>
              <span className="text-xs text-gray-500 px-2 py-1 rounded-md bg-white/5">Ene 2026</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">Neto USD</p>
              <p className="text-4xl font-bold neon-text-green">${formatCurrency(resumen?.neto_usd || 0)}</p>
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
          <h2 className="text-base font-bold text-white mb-4">Ingresos vs Gastos</h2>
          
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
              {resumen?.total_costos ? (resumen.total_usd / resumen.total_costos).toFixed(2) : '0'}x
            </p>
          </div>
          
          <div className="glass-card rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Margen</p>
            <p className="text-xl font-bold text-neon-green">
              {resumen?.total_usd ? ((resumen.neto_usd / resumen.total_usd) * 100).toFixed(1) : '0'}%
            </p>
          </div>
        </div>

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
