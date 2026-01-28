'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface PeriodoContextType {
  periodoSeleccionado: string
  setPeriodoSeleccionado: (periodo: string) => void
  periodos: string[]
}

const PeriodoContext = createContext<PeriodoContextType | undefined>(undefined)

export function PeriodoProvider({ children }: { children: ReactNode }) {
  // Obtener el mes actual en formato MM-YYYY
  const obtenerPeriodoActual = () => {
    const ahora = new Date()
    const mes = String(ahora.getMonth() + 1).padStart(2, '0')
    const anio = ahora.getFullYear()
    return `${mes}-${anio}`
  }

  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>(obtenerPeriodoActual())
  const [periodos, setPeriodos] = useState<string[]>([])

  useEffect(() => {
    // Generar lista de periodos: incluye último año + próximos 2 meses
    const generarPeriodos = () => {
      const listaPeriodos: string[] = []
      const ahora = new Date()
      
      // Agregar próximos 2 meses (para cobros adelantados)
      for (let i = 2; i >= 1; i--) {
        const fecha = new Date(ahora.getFullYear(), ahora.getMonth() + i, 1)
        const mes = String(fecha.getMonth() + 1).padStart(2, '0')
        const anio = fecha.getFullYear()
        listaPeriodos.push(`${mes}-${anio}`)
      }
      
      // Agregar mes actual
      const mesActual = String(ahora.getMonth() + 1).padStart(2, '0')
      const anioActual = ahora.getFullYear()
      listaPeriodos.push(`${mesActual}-${anioActual}`)
      
      // Agregar últimos 11 meses
      for (let i = 1; i <= 11; i++) {
        const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
        const mes = String(fecha.getMonth() + 1).padStart(2, '0')
        const anio = fecha.getFullYear()
        listaPeriodos.push(`${mes}-${anio}`)
      }
      
      return listaPeriodos
    }

    setPeriodos(generarPeriodos())
  }, [])

  return (
    <PeriodoContext.Provider value={{ periodoSeleccionado, setPeriodoSeleccionado, periodos }}>
      {children}
    </PeriodoContext.Provider>
  )
}

export function usePeriodo() {
  const context = useContext(PeriodoContext)
  if (context === undefined) {
    throw new Error('usePeriodo debe ser usado dentro de un PeriodoProvider')
  }
  return context
}
