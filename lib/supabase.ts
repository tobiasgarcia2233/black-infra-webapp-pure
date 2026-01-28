import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Tipos de datos de las tablas
export interface Cliente {
  id: string
  nombre: string
  honorario_usd: number
  estado: string
  activo: boolean
  fee_mensual?: number
  comisiona_agustin: boolean
  dia_cobro?: number
}

export interface Ingreso {
  id: string
  cliente_id: string
  monto_usd_total: number
  monto_ars: number
  fecha_cobro: string
  created_at: string
  periodo?: string
  detalle?: string
}

export interface Costo {
  id: string
  nombre: string
  monto_usd: number
  tipo: 'Fijo' | 'Variable'
  observacion?: string
  created_at: string
}

export interface CostosAgrupados {
  Fijo: Costo[]
  Variable: Costo[]
  total_fijo: number
  total_variable: number
  total_general: number
}

export interface ResumenFinanciero {
  total_ars: number
  total_usd: number
  total_costos: number
  neto_usd: number
  ingresos_proyectados?: number
  pst_balance_neto?: number
  pst_incluido?: boolean  // Indica si PST está incluido en neto_usd
}

export interface CobroDetalle {
  cliente_id: string
  cliente_nombre: string
  fee_monto: number
  dia_pago: number
  fecha_exacta: string
  dias_hasta_vencimiento: number
  estado_urgencia: 'ATRASADO' | 'HOY' | 'URGENTE' | 'ESTA_SEMANA' | 'NORMAL'
  total_semana: number
  ya_cobrado?: boolean
}
