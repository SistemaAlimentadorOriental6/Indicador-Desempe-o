"use client"

import React, { memo, useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { TrendingUp, Award } from "lucide-react"

// ============================================
// CONSTANTES Y UTILIDADES
// ============================================

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const ANIO_ACTUAL = new Date().getFullYear()
const MES_ACTUAL = new Date().getMonth() + 1

// Obtiene la categoría según el porcentaje de rendimiento
const obtenerCategoria = (porcentaje: number): { texto: string; color: string } => {
  if (porcentaje >= 94) return { texto: "Oro", color: "text-green-600" }
  if (porcentaje >= 90) return { texto: "Plata", color: "text-green-500" }
  if (porcentaje >= 85) return { texto: "Bronce", color: "text-blue-500" }
  if (porcentaje >= 60) return { texto: "Mejorar", color: "text-yellow-600" }
  return { texto: "Taller", color: "text-red-500" }
}

// ============================================
// COMPONENTES COMPARTIDOS
// ============================================

// Estado de carga compartido
const EstadoCarga = memo(({ mensaje }: { mensaje: string }) => (
  <div className="h-48 bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center justify-center">
    <div className="flex items-center gap-3">
      <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full" />
      <span className="text-gray-600 font-medium">{mensaje}</span>
    </div>
  </div>
))
EstadoCarga.displayName = "EstadoCarga"

// Estado sin datos compartido
const EstadoVacio = memo(({ mensaje, anio }: { mensaje: string; anio?: number }) => (
  <div className="h-48 bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center justify-center">
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
        <TrendingUp className="h-5 w-5 text-gray-400" />
      </div>
      <div className="text-gray-500 font-medium">{mensaje}</div>
      {anio && <div className="text-sm text-gray-400">para el año {anio}</div>}
    </div>
  </div>
))
EstadoVacio.displayName = "EstadoVacio"

// Tooltip personalizado para gráficas
const TooltipPersonalizado = memo(({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null

  const valor = payload[0]?.value || 0
  const categoria = obtenerCategoria(valor)

  return (
    <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-800 text-sm mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className={`font-bold ${categoria.color}`}>{valor.toFixed(1)}%</span>
        <span className="text-gray-500 text-xs">({categoria.texto})</span>
      </div>
    </div>
  )
})
TooltipPersonalizado.displayName = "TooltipPersonalizado"

// Tarjeta de mes individual
const TarjetaMes = memo(({
  mes,
  porcentaje,
  subTexto,
  esActual,
  esMejor
}: {
  mes: string
  porcentaje: number
  subTexto?: string
  esActual: boolean
  esMejor: boolean
}) => {
  const categoria = obtenerCategoria(porcentaje)

  return (
    <div className={`
      relative p-3 rounded-lg border text-center transition-colors
      ${esMejor ? 'bg-green-50 border-green-200' :
        esActual ? 'bg-gray-50 border-gray-200' :
          'bg-white border-gray-100'}
    `}>
      {esMejor && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <Award className="h-2 w-2 text-white" />
        </div>
      )}
      <div className="text-xs font-medium text-gray-500 mb-1">{mes}</div>
      <div className={`text-lg font-bold ${categoria.color}`}>
        {porcentaje.toFixed(1)}%
      </div>
      {subTexto && (
        <div className="text-xs text-gray-400 mt-1">{subTexto}</div>
      )}
    </div>
  )
})
TarjetaMes.displayName = "TarjetaMes"

// Contenedor de gráfica con encabezado
const ContenedorGrafica = memo(({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4">
    <div className="flex items-center gap-2 mb-4">
      <TrendingUp className="h-4 w-4 text-green-600" />
      <h3 className="font-semibold text-gray-800 text-sm">{titulo}</h3>
    </div>
    {children}
  </div>
))
ContenedorGrafica.displayName = "ContenedorGrafica"

// ============================================
// GRÁFICA DE COMPARACIÓN 3 AÑOS
// ============================================

interface PropsTresAnios {
  data: any[]
  isLoading?: boolean
  currentYearPerformance?: number
  referenceYear?: number
}

export const ThreeYearComparisonChart: React.FC<PropsTresAnios> = memo(({
  data,
  isLoading = false,
  currentYearPerformance,
  referenceYear = ANIO_ACTUAL
}) => {
  const datosProcessados = useMemo(() => {
    if (!data?.length) return { historico: [], actual: 0, todos: [] }

    const historico = data
      .filter(item => item.year !== referenceYear)
      .map(item => ({
        year: item.year,
        rendimiento: item['rendimiento general (%)'] || 0
      }))
      .sort((a, b) => a.year - b.year)

    const actual = currentYearPerformance ||
      data.find(item => item.year === referenceYear)?.['rendimiento general (%)'] || 0

    const todos = [...historico]
    if (actual > 0) {
      todos.push({ year: referenceYear, rendimiento: actual })
    }

    return { historico, actual, todos }
  }, [data, currentYearPerformance, referenceYear])

  if (isLoading) {
    return <EstadoCarga mensaje="Cargando análisis de rendimiento..." />
  }

  if (!data?.length) {
    return <EstadoVacio mensaje="No hay datos disponibles" />
  }

  const { historico, actual, todos } = datosProcessados
  const maximo = todos.length > 0 ? Math.max(...todos.map(d => d.rendimiento)) : 0
  const promedioHistorico = historico.length > 0
    ? (historico.reduce((sum, d) => sum + d.rendimiento, 0) / historico.length).toFixed(1)
    : 0

  return (
    <div className="space-y-4">
      <ContenedorGrafica titulo={`Evolución del Rendimiento - Últimos ${historico.length} Años`}>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={todos} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                domain={[0, 100]}
              />
              <Tooltip content={<TooltipPersonalizado />} />
              <Bar dataKey="rendimiento" radius={[4, 4, 0, 0]}>
                {todos.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.year === referenceYear ? "#16a34a" : "#10b981"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ContenedorGrafica>

      {/* Tarjetas de años históricos */}
      <div className="grid grid-cols-3 gap-3">
        {historico.map((yearData) => {
          const esMejor = yearData.rendimiento === maximo
          const categoria = obtenerCategoria(yearData.rendimiento)

          return (
            <div
              key={yearData.year}
              className={`p-4 rounded-xl border text-center ${esMejor ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'
                }`}
            >
              {esMejor && (
                <div className="flex justify-center mb-2">
                  <Award className="h-4 w-4 text-green-600" />
                </div>
              )}
              <div className="text-lg font-bold text-gray-800">{yearData.year}</div>
              <div className={`text-2xl font-bold ${categoria.color}`}>
                {yearData.rendimiento.toFixed(1)}%
              </div>
            </div>
          )
        })}
      </div>

      {/* Año actual destacado */}
      {actual > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="text-sm text-green-600 font-medium mb-1">Año Actual</div>
          <div className="text-2xl font-bold text-gray-800">{referenceYear}</div>
          <div className={`text-4xl font-bold ${obtenerCategoria(actual).color} my-2`}>
            {actual.toFixed(1)}%
          </div>
          <div className={`text-sm font-medium ${obtenerCategoria(actual).color}`}>
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Promedio histórico:</span>
          <span className="font-bold text-gray-800">{promedioHistorico}%</span>
        </div>
      </div>
    </div>
  )
})

ThreeYearComparisonChart.displayName = "ThreeYearComparisonChart"

// ============================================
// GRÁFICA DE RENDIMIENTO MENSUAL
// ============================================

interface PropsMensual {
  data: any[]
  year: number
  isLoading?: boolean
}

export const MonthlyPerformanceChart: React.FC<PropsMensual> = memo(({ data, year, isLoading = false }) => {
  const datosMensuales = useMemo(() => {
    if (!data?.length) return []

    return MESES.map((mes, index) => {
      const mesData = data.find(item => item.month === index + 1)
      if (!mesData) return null

      let kmPorcentaje = 0
      let bonoPorcentaje = 0

      if (mesData.valor_programacion > 0) {
        kmPorcentaje = (mesData.valor_ejecucion / mesData.valor_programacion) * 100
      }

      if (mesData.baseBonus > 0 && mesData.finalBonus !== undefined) {
        bonoPorcentaje = (mesData.finalBonus / mesData.baseBonus) * 100
      } else if (mesData.porcentaje !== undefined) {
        bonoPorcentaje = mesData.porcentaje
      }

      const rendimiento = (kmPorcentaje + bonoPorcentaje) / 2

      return {
        mes,
        mesNumero: index + 1,
        rendimiento: Number(rendimiento.toFixed(1))
      }
    }).filter(Boolean) as { mes: string; mesNumero: number; rendimiento: number }[]
  }, [data])

  if (isLoading) {
    return <EstadoCarga mensaje="Cargando análisis mensual..." />
  }

  if (!datosMensuales.length) {
    return <EstadoVacio mensaje="No hay datos mensuales" anio={year} />
  }

  const maximo = Math.max(...datosMensuales.map(d => d.rendimiento))
  const promedio = (datosMensuales.reduce((sum, d) => sum + d.rendimiento, 0) / datosMensuales.length).toFixed(1)

  return (
    <div className="space-y-4">
      <ContenedorGrafica titulo={`Rendimiento Mensual ${year}`}>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosMensuales} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                domain={[0, 100]}
              />
              <Tooltip content={<TooltipPersonalizado />} />
              <Bar dataKey="rendimiento" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ContenedorGrafica>

      {/* Grid de meses */}
      <div className="grid grid-cols-4 gap-2">
        {datosMensuales.map((d) => (
          <TarjetaMes
            key={d.mes}
            mes={d.mes}
            porcentaje={d.rendimiento}
            esActual={d.mesNumero === MES_ACTUAL}
            esMejor={d.rendimiento === maximo}
          />
        ))}
      </div>

      {/* Resumen */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Promedio del año:</span>
          <span className="font-bold text-gray-800">{promedio}%</span>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
          <span>Meses con datos: {datosMensuales.length}/12</span>
          <span>Máximo: {maximo}%</span>
        </div>
      </div>
    </div>
  )
})

MonthlyPerformanceChart.displayName = "MonthlyPerformanceChart"

// ============================================
// GRÁFICA DE KILÓMETROS MENSUALES
// ============================================

export const KilometersMonthlyChart: React.FC<PropsMensual> = memo(({ data, year, isLoading = false }) => {
  const datosMensuales = useMemo(() => {
    if (!data?.length) return []

    return MESES.map((mes, index) => {
      const mesData = data.find(item => item.month === index + 1)
      if (!mesData) return null

      const porcentaje = mesData.valor_programacion > 0
        ? (mesData.valor_ejecucion / mesData.valor_programacion) * 100
        : 0

      return {
        mes,
        mesNumero: index + 1,
        ejecutado: mesData.valor_ejecucion || 0,
        programado: mesData.valor_programacion || 0,
        porcentaje: Number(porcentaje.toFixed(1))
      }
    }).filter(Boolean) as any[]
  }, [data])

  if (isLoading) {
    return <EstadoCarga mensaje="Cargando análisis de kilómetros..." />
  }

  if (!datosMensuales.length) {
    return <EstadoVacio mensaje="No hay datos de kilómetros" anio={year} />
  }

  const maximo = Math.max(...datosMensuales.map(d => d.porcentaje))
  const totalEjecutado = datosMensuales.reduce((sum, d) => sum + d.ejecutado, 0)
  const totalProgramado = datosMensuales.reduce((sum, d) => sum + d.programado, 0)
  const promedioGeneral = totalProgramado > 0 ? Math.round((totalEjecutado / totalProgramado) * 100) : 0

  return (
    <div className="space-y-4">
      <ContenedorGrafica titulo={`Kilómetros ${year}`}>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosMensuales} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                domain={[0, 120]}
              />
              <Tooltip content={<TooltipPersonalizado />} />
              <Bar dataKey="porcentaje" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ContenedorGrafica>

      {/* Grid de meses */}
      <div className="grid grid-cols-4 gap-2">
        {datosMensuales.map((d) => (
          <TarjetaMes
            key={d.mes}
            mes={d.mes}
            porcentaje={d.porcentaje}
            subTexto={`${(d.ejecutado / 1000).toFixed(1)}K km`}
            esActual={d.mesNumero === MES_ACTUAL}
            esMejor={d.porcentaje === maximo}
          />
        ))}
      </div>

      {/* Resumen */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-gray-600">Total ejecutado:</span>
          <span className="font-bold text-gray-800">{(totalEjecutado / 1000).toFixed(1)}K km</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Eficiencia general:</span>
          <span className="font-bold text-green-600">{promedioGeneral}%</span>
        </div>
      </div>
    </div>
  )
})

KilometersMonthlyChart.displayName = "KilometersMonthlyChart"

// ============================================
// GRÁFICA DE BONIFICACIONES MENSUALES
// ============================================

export const BonusMonthlyChart: React.FC<PropsMensual> = memo(({ data, year, isLoading = false }) => {
  const datosMensuales = useMemo(() => {
    if (!data?.length) return []

    return MESES.map((mes, index) => { // Mostrar todos los meses disponibles
      const mesData = data.find(item =>
        item.month === index + 1 || item.monthNumber === index + 1
      )
      if (!mesData) return null

      const bonusBase = mesData.bonusValue || mesData.baseBonus || 0
      const bonusFinal = mesData.finalValue || mesData.finalBonus || 0

      if (bonusBase <= 0 && bonusFinal <= 0) return null

      const porcentaje = bonusBase > 0
        ? Math.min(100, (bonusFinal / bonusBase) * 100)
        : 0

      return {
        mes,
        mesNumero: index + 1,
        bonusBase,
        bonusFinal,
        porcentaje: Number(porcentaje.toFixed(1))
      }
    }).filter(Boolean) as any[]
  }, [data])

  if (isLoading) {
    return <EstadoCarga mensaje="Cargando bonificaciones..." />
  }

  if (!datosMensuales.length) {
    return <EstadoVacio mensaje="No hay datos de bonificaciones" anio={year} />
  }

  const maximo = Math.max(...datosMensuales.map(d => d.porcentaje))
  const totalBonusFinal = datosMensuales.reduce((sum, d) => sum + d.bonusFinal, 0)
  const totalBonusBase = datosMensuales.reduce((sum, d) => sum + d.bonusBase, 0)
  const eficiencia = totalBonusBase > 0 ? Math.round((totalBonusFinal / totalBonusBase) * 100) : 0

  return (
    <div className="space-y-4">
      <ContenedorGrafica titulo={`Bonificaciones ${year}`}>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosMensuales} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                domain={[0, 120]}
              />
              <Tooltip content={<TooltipPersonalizado />} />
              <Bar dataKey="porcentaje" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ContenedorGrafica>

      {/* Grid de meses */}
      <div className="grid grid-cols-4 gap-2">
        {datosMensuales.map((d) => (
          <TarjetaMes
            key={d.mes}
            mes={d.mes}
            porcentaje={d.porcentaje}
            subTexto={`$${(d.bonusFinal / 1000).toFixed(0)}K`}
            esActual={d.mesNumero === MES_ACTUAL}
            esMejor={d.porcentaje === maximo}
          />
        ))}
      </div>

      {/* Resumen */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total bonificado:</span>
            <div className="font-bold text-gray-800">${totalBonusFinal.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-gray-600">Eficiencia:</span>
            <div className="font-bold text-green-600">{eficiencia}%</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
          Meses con datos: {datosMensuales.length}/12
        </div>
      </div>
    </div>
  )
})

BonusMonthlyChart.displayName = "BonusMonthlyChart"

// Exportar tooltip para uso externo si es necesario
export const PerformanceTooltip = TooltipPersonalizado
