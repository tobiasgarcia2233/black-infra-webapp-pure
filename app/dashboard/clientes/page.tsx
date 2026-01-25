'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Cliente } from '@/lib/supabase'
import { 
  ArrowLeft,
  Loader2,
  Users,
  DollarSign,
  CheckCircle2,
  Plus,
  X
} from 'lucide-react'

type FiltroEstado = 'Todos' | 'Activo' | 'Pausado' | 'Inactivo'

interface NuevoCliente {
  nombre: string
  fee_mensual: number
  estado: string
  comisiona_agustin: boolean
}

export default function ClientesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filtroActivo, setFiltroActivo] = useState<FiltroEstado>('Todos')
  const [saving, setSaving] = useState(false)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState<NuevoCliente>({
    nombre: '',
    fee_mensual: 0,
    estado: 'Activo',
    comisiona_agustin: true
  })
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
    loadClientes()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.replace('/login')
      return
    }
  }

  const loadClientes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre')

      if (error) throw error

      setClientes(data || [])
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCliente = async (clienteId: string, field: string, value: any) => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('clientes')
        .update({ [field]: value })
        .eq('id', clienteId)

      if (error) throw error

      // Actualizar estado local
      setClientes(prev => prev.map(c => 
        c.id === clienteId ? { ...c, [field]: value } : c
      ))
    } catch (error) {
      console.error('Error al actualizar cliente:', error)
      alert('Error al actualizar cliente')
    } finally {
      setSaving(false)
    }
  }

  const handleCrearCliente = async () => {
    // Validaciones
    if (!nuevoCliente.nombre.trim()) {
      alert('Por favor ingresa el nombre del cliente')
      return
    }

    if (nuevoCliente.fee_mensual < 0) {
      alert('El fee mensual debe ser un valor positivo')
      return
    }

    try {
      setSaving(true)

      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          nombre: nuevoCliente.nombre.trim(),
          fee_mensual: nuevoCliente.fee_mensual,
          estado: nuevoCliente.estado,
          comisiona_agustin: nuevoCliente.comisiona_agustin,
          activo: nuevoCliente.estado === 'Activo',
          honorario_usd: nuevoCliente.fee_mensual // Mantener compatibilidad
        }])
        .select()

      if (error) throw error

      // Actualizar lista local
      if (data && data.length > 0) {
        setClientes(prev => [...prev, data[0] as Cliente].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      }

      // Mostrar mensaje de éxito
      setMensajeExito('✅ Cliente creado con éxito')
      setTimeout(() => setMensajeExito(null), 3000)

      // Cerrar modal y resetear formulario
      setMostrarModal(false)
      setNuevoCliente({
        nombre: '',
        fee_mensual: 0,
        estado: 'Activo',
        comisiona_agustin: true
      })
    } catch (error) {
      console.error('Error al crear cliente:', error)
      alert('Error al crear cliente')
    } finally {
      setSaving(false)
    }
  }

  const estadosDisponibles = ['Activo', 'Inactivo', 'Pausado', 'Prospecto']
  const filtros: FiltroEstado[] = ['Todos', 'Activo', 'Pausado', 'Inactivo']

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  // Filtrar clientes según el filtro activo
  const clientesFiltrados = filtroActivo === 'Todos' 
    ? clientes 
    : clientes.filter(c => c.estado === filtroActivo)

  // Calcular resumen
  const clientesActivos = clientes.filter(c => c.estado === 'Activo').length
  const clientesConComision = clientes.filter(c => c.estado === 'Activo' && c.comisiona_agustin).length
  const ingresosProyectados = clientes
    .filter(c => c.estado === 'Activo')
    .reduce((acc, c) => acc + (c.fee_mensual || 0), 0)
  const costoAgustin = clientesConComision * 55

  // Función para obtener el color del badge según el estado
  const getEstadoBadgeClass = (estado: string) => {
    switch(estado) {
      case 'Activo':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Pausado':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Inactivo':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'Prospecto':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-neon-green mx-auto" />
          <p className="mt-4 text-gray-400">Cargando clientes...</p>
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
                <h1 className="text-xl font-bold text-white">Gestión de Clientes</h1>
                <p className="text-xs text-gray-400">{clientes.length} clientes totales</p>
              </div>
            </div>
            <button
              onClick={() => setMostrarModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-neon-green text-black rounded-xl font-semibold hover:bg-neon-green/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo</span>
            </button>
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
              <Users className="h-4 w-4 text-neon-green" />
              <p className="text-xs text-gray-400">Activos</p>
            </div>
            <p className="text-2xl font-bold text-white">{clientesActivos}</p>
          </div>

          <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-neon-green" />
              <p className="text-xs text-gray-400">Con Comisión</p>
            </div>
            <p className="text-2xl font-bold text-white">{clientesConComision}</p>
          </div>

          <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-neon-green" />
              <p className="text-xs text-gray-400">Ingresos Proy.</p>
            </div>
            <p className="text-lg font-bold text-neon-green">${formatCurrency(ingresosProyectados)}</p>
          </div>

          <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <p className="text-xs text-gray-400">Costo Agustín</p>
            </div>
            <p className="text-lg font-bold text-white">${formatCurrency(costoAgustin)}</p>
          </div>
        </div>

        {/* Filtros Rápidos */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filtros.map((filtro) => (
            <button
              key={filtro}
              onClick={() => setFiltroActivo(filtro)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                filtroActivo === filtro
                  ? 'bg-neon-green text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {filtro}
            </button>
          ))}
        </div>

        {/* Lista de Clientes - Cards */}
        <div className="space-y-3">
          {clientesFiltrados.length === 0 ? (
            <div className="bg-white/[0.02] rounded-xl p-8 text-center border border-white/5">
              <p className="text-gray-400">No hay clientes en esta categoría</p>
            </div>
          ) : (
            clientesFiltrados.map((cliente) => (
              <div 
                key={cliente.id} 
                className="bg-white/[0.02] rounded-xl p-4 space-y-4 border border-white/5"
              >
                {/* Header: Nombre y Badge de Estado */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-white flex-1">{cliente.nombre}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoBadgeClass(cliente.estado)}`}>
                    {cliente.estado}
                  </span>
                </div>

                {/* Selector de Estado */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Estado del Cliente</label>
                  <select
                    value={cliente.estado}
                    onChange={(e) => handleUpdateCliente(cliente.id, 'estado', e.target.value)}
                    disabled={saving}
                    className="w-full bg-white/5 text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neon-green/50 disabled:opacity-50 appearance-none"
                    style={{ WebkitAppearance: 'none' }}
                  >
                    {estadosDisponibles.map(estado => (
                      <option key={estado} value={estado} className="bg-black">
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input de Fee Mensual */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Fee Mensual (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-green text-lg font-bold">$</span>
                    <input
                      type="number"
                      value={cliente.fee_mensual || ''}
                      onChange={(e) => handleUpdateCliente(cliente.id, 'fee_mensual', parseFloat(e.target.value) || 0)}
                      disabled={saving}
                      placeholder="0.00"
                      className="w-full bg-white/5 text-white rounded-xl pl-10 pr-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-neon-green/50 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Toggle iOS Style para Comisión */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Comisiona a Agustín</p>
                    <p className="text-xs text-gray-500">$55 USD por cliente</p>
                  </div>
                  <button
                    onClick={() => handleUpdateCliente(cliente.id, 'comisiona_agustin', !cliente.comisiona_agustin)}
                    disabled={saving}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-neon-green/50 disabled:opacity-50 ${
                      cliente.comisiona_agustin ? 'bg-neon-green' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
                        cliente.comisiona_agustin ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal de Nuevo Cliente */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMostrarModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-[#0a0a0a] w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl border border-white/10 shadow-2xl animate-slide-up">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Nuevo Cliente</h2>
              <button
                onClick={() => setMostrarModal(false)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Formulario */}
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Nombre del Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  value={nuevoCliente.nombre}
                  onChange={(e) => setNuevoCliente(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-white/5 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-neon-green/50"
                  autoFocus
                />
              </div>

              {/* Fee Mensual */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fee Mensual (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-green text-xl font-bold">$</span>
                  <input
                    type="number"
                    value={nuevoCliente.fee_mensual || ''}
                    onChange={(e) => setNuevoCliente(prev => ({ ...prev, fee_mensual: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-full bg-white/5 text-white rounded-xl pl-10 pr-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-neon-green/50"
                  />
                </div>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estado Inicial
                </label>
                <select
                  value={nuevoCliente.estado}
                  onChange={(e) => setNuevoCliente(prev => ({ ...prev, estado: e.target.value }))}
                  className="w-full bg-white/5 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-neon-green/50 appearance-none"
                  style={{ WebkitAppearance: 'none' }}
                >
                  {estadosDisponibles.map(estado => (
                    <option key={estado} value={estado} className="bg-black">
                      {estado}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comisiona Agustín */}
              <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-xl border border-white/5">
                <div>
                  <p className="text-sm font-medium text-white">¿Comisiona a Agustín?</p>
                  <p className="text-xs text-gray-500">$55 USD por cliente activo</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNuevoCliente(prev => ({ ...prev, comisiona_agustin: !prev.comisiona_agustin }))}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-neon-green/50 ${
                    nuevoCliente.comisiona_agustin ? 'bg-neon-green' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
                      nuevoCliente.comisiona_agustin ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer con Botones */}
            <div className="p-4 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setMostrarModal(false)}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearCliente}
                disabled={saving || !nuevoCliente.nombre.trim()}
                className="flex-1 px-4 py-3 bg-neon-green text-black rounded-xl font-semibold hover:bg-neon-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Crear Cliente'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
