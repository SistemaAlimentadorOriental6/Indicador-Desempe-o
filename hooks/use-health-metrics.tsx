"use client"

import { useState, useEffect } from "react"
import type { HealthMetrics, LastMonthData, KmsData } from "@/types/kpi"

export function useHealthMetrics(userCode?: string) {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    bonusPercentage: 0,
    kmPercentage: 0,
    lastUpdated: new Date().toISOString(),
    heartRate: 0, // Default value
    sleep: 0, // Default value
    stress: 0, // Default value
    hydration: 0, // Default value
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastMonthInfo, setLastMonthInfo] = useState({
    month: "",
    year: 0,
  })

  useEffect(() => {
    if (!userCode) {
      setIsLoading(false)
      return
    }

    async function fetchHealthMetrics() {
      setIsLoading(true)
      setError(null)
      
      try {
        // Obtener datos de bonos
        const bonusResponse = await fetch(`/api/get-base-bonus-for-year?codigo=${userCode}`)
        if (!bonusResponse.ok) {
          throw new Error(`Error al obtener datos de bonos: ${bonusResponse.statusText}`)
        }
        const bonusData = await bonusResponse.json()

        // Obtener datos de kilometraje
        const kmsResponse = await fetch(`/api/data-repository?codigo=${userCode}`)
        if (!kmsResponse.ok) {
          throw new Error(`Error al obtener datos de kilometraje: ${kmsResponse.statusText}`)
        }
        const kmsData = await kmsResponse.json()

        // Procesar datos de bonos
        let bonusPercent = 0
        if (bonusData.success && bonusData.lastMonthData) {
          const bonusValue = bonusData.lastMonthData.finalValue || 0
          const bonusBase = bonusData.lastMonthData.bonusValue || 0
          
          // Calcular porcentaje: (valor final / valor base) * 100
          // Asegurarse de que no haya división por cero
          bonusPercent = bonusBase > 0 ? Math.round((bonusValue / bonusBase) * 100) : 0
          
          // Limitar el porcentaje a un máximo de 100%
          bonusPercent = Math.min(bonusPercent, 100)

          setLastMonthInfo({
            month: bonusData.lastMonthData.monthName || "",
            year: bonusData.lastMonthData.year || new Date().getFullYear(),
          })

          console.log("Datos de bono cargados:", {
            bonusBase,
            bonusValue,
            bonusPercent,
            month: bonusData.lastMonthData.monthName,
            year: bonusData.lastMonthData.year,
          })
        } else if (bonusData.summary && typeof bonusData.summary.percentage === 'number') {
          // Alternativa: usar el porcentaje del resumen si no hay lastMonthData
          bonusPercent = bonusData.summary.percentage
        }

        // Procesar datos de kilometraje
        let kmsPercent = 0
        if (kmsData.success && kmsData.data && kmsData.data.length > 0) {
          // Obtener el registro más reciente (los datos vienen ordenados por fecha DESC)
          const lastKmsData = kmsData.data[0]
          const kmsProgValue = parseFloat(lastKmsData.valor_programacion) || 0
          const kmsExecValue = parseFloat(lastKmsData.valor_ejecucion) || 0

          // Calcular porcentaje: (valor ejecutado / valor programado) * 100
          // Asegurarse de que no haya división por cero
          kmsPercent = kmsProgValue > 0 ? Math.round((kmsExecValue / kmsProgValue) * 100) : 0
          
          // Limitar el porcentaje a un máximo de 100%
          kmsPercent = Math.min(kmsPercent, 100)

          // Si no tenemos información del mes de los bonos, usar la del kilometraje
          if (!lastMonthInfo.month) {
            setLastMonthInfo({
              month: lastKmsData.monthName || "",
              year: lastKmsData.year || new Date().getFullYear(),
            })
          }

          console.log("Datos de kilometraje cargados:", {
            kmsProgValue,
            kmsExecValue,
            kmsPercent,
            month: lastKmsData.monthName,
            year: lastKmsData.year,
          })
        } else if (kmsData.summary && typeof kmsData.summary.percentage === 'number') {
          // Alternativa: usar el porcentaje del resumen si no hay datos
          kmsPercent = kmsData.summary.percentage
        }

        // Actualizar las métricas
        setMetrics({
          bonusPercentage: bonusPercent,
          kmPercentage: kmsPercent,
          lastUpdated: new Date().toISOString(),
          heartRate: 0, // Default or calculated value
          sleep: 0, // Default or calculated value
          stress: 0, // Default or calculated value
          hydration: 0, // Default or calculated value
        })
      } catch (err) {
        console.error("Error fetching health metrics:", err)
        setError(err instanceof Error ? err : new Error("Error desconocido al obtener métricas"))
        
        // En caso de error, mantener los valores anteriores o establecer valores por defecto
        setMetrics(prev => ({
          ...prev,
          lastUpdated: new Date().toISOString(),
        }))
      } finally {
        setIsLoading(false)
      }
    }

    fetchHealthMetrics()
  }, [userCode])

  return { metrics, isLoading, error, lastMonthInfo }
}
