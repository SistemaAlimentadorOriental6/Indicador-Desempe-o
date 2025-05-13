"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Clock, Gift, ChevronDown, ChevronUp } from "lucide-react"
import { motion } from "framer-motion"

interface BonusCardProps {
  userCode?: string
  className?: string
}

interface Novedad {
  id: number
  fecha_inicio_novedad: string
  fecha_fin_novedad: string
  codigo_empleado: string
  codigo_factor: string
  observaciones: string
}

export default function BonusCard({ userCode, className = "" }: BonusCardProps) {
  const [bonusData, setBonusData] = useState<{
    disponibles: number | null
    diasExpiracion: number | null
    valorBase: number | null
    porcentajeDeduccion: number | null
    valorFinal: number | null
    bonosPorAno: Record<number, number>
  }>({
    disponibles: null,
    diasExpiracion: null,
    valorBase: null,
    porcentajeDeduccion: null,
    valorFinal: null,
    bonosPorAno: {},
  })
  const [showAnnualData, setShowAnnualData] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [novedades, setNovedades] = useState<Novedad[]>([])
  const [noData, setNoData] = useState(false)

  useEffect(() => {
    const fetchBonusData = async () => {
      if (!userCode) return

      setIsLoading(true)
      setError(null)
      setNoData(false)

      try {
        // Obtener datos de bonos
        const response = await fetch(`/api/user/bonuses?codigo=${encodeURIComponent(userCode)}`)

        if (!response.ok) {
          if (response.status === 503) {
            // Error de conexión a la base de datos
            setNoData(true)
            setIsLoading(false)
            return
          }
          throw new Error(`Error fetching data: ${response.status}`)
        }

        const data = await response.json()
        console.log("Bonus Card API response:", data)

        if (data.error) {
          throw new Error(data.error)
        }

        // Verificar si hay datos relevantes
        if ((!data.data || data.data.length === 0) && !data.bonusesByYear) {
          setNoData(true)
          setIsLoading(false)
          return
        }

        // Guardar las novedades
        setNovedades(data.data || [])

        // Obtener datos reales de la base de datos
        const valorBase = data.baseBonus || null
        const porcentajeDeduccion = data.deductionPercentage || null
        const valorFinal = data.finalBonus || null
        const disponibles = data.availableBonuses || null
        const diasExpiracion = data.expiresInDays || null

        // Contar bonos por año usando solo datos reales
        const bonosPorAno: Record<number, number> = {}

        // Agrupar por año si hay datos disponibles
        if (data.data && data.availableYears) {
          data.availableYears.forEach((year: number) => {
            const bonosDelAno = data.data.filter((novedad: Novedad) => {
              const fechaInicio = new Date(novedad.fecha_inicio_novedad)
              return fechaInicio.getFullYear() === year
            })
            bonosPorAno[year] = bonosDelAno.length
          })
        }

        setBonusData({
          disponibles,
          diasExpiracion,
          valorBase,
          porcentajeDeduccion,
          valorFinal,
          bonosPorAno,
        })
      } catch (error) {
        console.error("Error fetching bonus data:", error)
        setError(error instanceof Error ? error.message : "Error al cargar los datos de bonos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBonusData()
  }, [userCode])

  if (isLoading) {
    return (
      <div className={`bg-emerald-500 rounded-xl shadow-lg p-6 text-white relative overflow-hidden ${className}`}>
        <div className="flex justify-center items-center h-40">
          <div className="w-10 h-10 border-4 border-emerald-300 border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-500 rounded-xl shadow-lg p-6 text-white relative overflow-hidden ${className}`}>
        <h3 className="font-bold text-xl mb-2">Error</h3>
        <p>{error}</p>
      </div>
    )
  }

  if (noData) {
    return (
      <div className={`bg-gray-500 rounded-xl shadow-lg p-6 text-white relative overflow-hidden ${className}`}>
        <h3 className="font-bold text-xl mb-2">Sin datos disponibles</h3>
        <p>No se encontraron datos de bonos para este usuario o no hay conexión a la base de datos.</p>
      </div>
    )
  }

  return (
    <div className={`bg-emerald-500 rounded-xl shadow-lg p-6 text-white relative overflow-hidden ${className}`}>
      {/* Decorative elements */}
      <div className="absolute top-4 right-4">
        <Gift className="w-8 h-8 text-white/30" />
      </div>
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-emerald-400/30"></div>
      <div className="absolute top-1/2 right-8 w-12 h-12 rounded-full bg-emerald-400/20"></div>

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold">Mis Bonos</h2>
        {bonusData.disponibles !== null && (
          <div className="flex items-baseline">
            <span className="text-4xl font-bold">{bonusData.disponibles}</span>
            <span className="ml-2 text-emerald-100">disponibles</span>
            <Gift className="w-5 h-5 ml-2 text-emerald-100" />
          </div>
        )}
        {bonusData.diasExpiracion !== null && (
          <div className="flex items-center mt-1 text-sm text-emerald-100">
            <Clock className="w-4 h-4 mr-1" />
            <span>Expira en {bonusData.diasExpiracion} días</span>
          </div>
        )}
      </div>

      {/* Bonus calculation */}
      {bonusData.valorBase !== null && bonusData.porcentajeDeduccion !== null && bonusData.valorFinal !== null && (
        <div className="bg-emerald-600/30 rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center">
            <span>${bonusData.valorBase.toLocaleString()}</span>
            <span>-{bonusData.porcentajeDeduccion}%</span>
            <span className="font-bold">${bonusData.valorFinal.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Annual data toggle */}
      {Object.keys(bonusData.bonosPorAno).length > 0 && (
        <div className="mb-2">
          <button
            onClick={() => setShowAnnualData(!showAnnualData)}
            className="flex items-center text-emerald-100 hover:text-white transition-colors"
          >
            <span className="mr-1">Datos Anuales</span>
            {showAnnualData ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Annual data */}
      {showAnnualData && Object.keys(bonusData.bonosPorAno).length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <h3 className="text-sm font-medium mb-2">Bonos por Año</h3>
          {Object.entries(bonusData.bonosPorAno)
            .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
            .map(([year, count]) => (
              <div key={year} className="mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span>{year}</span>
                  <div className="flex items-center">
                    <Gift className="w-4 h-4 mr-1 text-emerald-200/50" />
                    <span>{count} bonos</span>
                  </div>
                </div>
                <div className="w-full bg-emerald-600/30 rounded-full h-2">
                  <div
                    className="bg-emerald-200 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (count / 12) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
        </motion.div>
      )}

      {/* Details button */}
      <div className="flex justify-end">
        <button className="bg-white text-emerald-600 px-4 py-2 rounded-lg font-medium flex items-center hover:bg-emerald-50 transition-colors">
          Ver Detalles
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  )
}
