"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Loader2, Calendar, TrendingUp, Target, CheckCircle, Filter, BarChart3, MapPin, Clock, X } from "lucide-react"

interface KmDetailsTabProps {
  userCode: string
}

interface KmRecord {
  year: number
  month: number
  monthName: string
  valor_programacion: string | number
  valor_ejecucion: string | number
  percentage: number
}

interface KmSummary {
  totalProgrammed: string | number
  totalExecuted: string | number
  percentage: number
}

interface KmResponse {
  data: KmRecord[]
  summary: KmSummary
  availableYears?: number[]
  availableMonths?: number[]
}

const KmDetailsTab: React.FC<KmDetailsTabProps> = ({ userCode }) => {
  const [data, setData] = useState<KmResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [availableMonths, setAvailableMonths] = useState<number[]>([])
  const [selectedRow, setSelectedRow] = useState<KmRecord | null>(null)

  useEffect(() => {
    const fetchKm = async () => {
      try {
        setLoading(true)
        setError(null)
        let url = `/api/user/kilometers?codigo=${userCode}`
        if (selectedYear) url += `&year=${selectedYear}`
        if (selectedMonth) url += `&month=${selectedMonth}`
        const res = await fetch(url)
        if (!res.ok) throw new Error("Error al obtener datos de kilómetros")
        const json = await res.json()
        const payload = json?.data ?? json
        setData(payload)
        setAvailableYears(payload.availableYears || [])
        setAvailableMonths(payload.availableMonths || [])
      } catch (err: any) {
        setError(err.message ?? "Error desconocido")
      } finally {
        setLoading(false)
      }
    }
    if (userCode) fetchKm()
  }, [userCode, selectedYear, selectedMonth])

  const getEfficiencyColor = (percentage: number) => {
    if (percentage >= 100) return "text-emerald-600"
    if (percentage >= 80) return "text-blue-600"
    if (percentage >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const getEfficiencyBg = (percentage: number) => {
    if (percentage >= 100) return "bg-emerald-50 border-emerald-200"
    if (percentage >= 80) return "bg-blue-50 border-blue-200"
    if (percentage >= 60) return "bg-amber-50 border-amber-200"
    return "bg-red-50 border-red-200"
  }

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
        <p className="text-slate-600 font-medium">Cargando datos de kilómetros...</p>
      </div>
    )

  if (error)
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <X className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-red-800 mb-2">Error al cargar datos</h3>
        <p className="text-red-600">{error}</p>
      </div>
    )

  if (!data)
    return (
      <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-600 mb-2">Sin datos disponibles</h3>
        <p className="text-slate-500">No se encontraron registros de kilómetros</p>
      </div>
    )

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Análisis de Kilómetros</h2>
          <p className="text-slate-600">Seguimiento detallado del rendimiento operativo</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Filtros de Búsqueda</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-blue-500" />
              Año
            </label>
            <select
              className="w-full appearance-none bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
              value={selectedYear ?? ""}
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Todos los años</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Clock className="w-4 h-4 text-emerald-500" />
              Mes
            </label>
            <select
              className="w-full appearance-none bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition-all"
              value={selectedMonth ?? ""}
              onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Todos los meses</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            {(selectedYear || selectedMonth) && (
              <button
                className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={() => {
                  setSelectedYear(null)
                  setSelectedMonth(null)
                }}
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 font-medium">Programado</p>
              <p className="text-2xl font-bold text-slate-800">
                {Number(data.summary?.totalProgrammed ?? 0).toLocaleString("es-CO")}
              </p>
            </div>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full w-full"></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Kilómetros planificados</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 font-medium">Ejecutado</p>
              <p className="text-2xl font-bold text-slate-800">
                {Number(data.summary?.totalExecuted ?? 0).toLocaleString("es-CO")}
              </p>
            </div>
          </div>
          <div className="w-full bg-emerald-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(data.summary?.percentage ?? 0, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Kilómetros completados</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 font-medium">Eficiencia</p>
              <p className={`text-2xl font-bold ${getEfficiencyColor(data.summary?.percentage ?? 0)}`}>
                {(data.summary?.percentage ?? 0).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="w-full bg-purple-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(data.summary?.percentage ?? 0, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Porcentaje de cumplimiento</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Registro Detallado por Período</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-4 text-right text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Programado
                </th>
                <th className="px-6 py-4 text-right text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Ejecutado
                </th>
                <th className="px-6 py-4 text-right text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Eficiencia
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {data.data?.map((rec) => (
                <tr
                  key={`${rec.year}-${rec.month}`}
                  className={`hover:bg-slate-50 transition-all duration-200 cursor-pointer ${
                    selectedRow === rec ? "bg-blue-50 border-l-4 border-blue-500" : ""
                  }`}
                  onClick={() => setSelectedRow(selectedRow === rec ? null : rec)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{`${rec.monthName} ${rec.year}`}</div>
                        <div className="text-xs text-slate-500">Período de análisis</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold text-slate-800">
                      {Number(rec.valor_programacion).toLocaleString("es-CO")}
                    </div>
                    <div className="text-xs text-slate-500">km</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold text-slate-800">
                      {Number(rec.valor_ejecucion).toLocaleString("es-CO")}
                    </div>
                    <div className="text-xs text-slate-500">km</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={`text-sm font-bold ${getEfficiencyColor(rec.percentage)}`}>
                      {rec.percentage.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 ${getEfficiencyBg(rec.percentage)}`}
                    >
                      {rec.percentage >= 100 ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                          <span className="text-emerald-700">Excelente</span>
                        </>
                      ) : rec.percentage >= 80 ? (
                        <>
                          <TrendingUp className="w-3 h-3 mr-1 text-blue-600" />
                          <span className="text-blue-700">Bueno</span>
                        </>
                      ) : rec.percentage >= 60 ? (
                        <>
                          <Target className="w-3 h-3 mr-1 text-amber-600" />
                          <span className="text-amber-700">Regular</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3 mr-1 text-red-600" />
                          <span className="text-red-700">Bajo</span>
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Row Details */}
      {selectedRow && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-blue-800">Detalle del Período Seleccionado</h4>
                <p className="text-sm text-blue-600">{`${selectedRow.monthName} ${selectedRow.year}`}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedRow(null)}
              className="p-2 bg-blue-200 hover:bg-blue-300 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-blue-700" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Año</span>
              </div>
              <p className="text-xl font-bold text-slate-800">{selectedRow.year}</p>
            </div>

            <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Mes</span>
              </div>
              <p className="text-xl font-bold text-slate-800">{selectedRow.monthName}</p>
            </div>

            <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Programado</span>
              </div>
              <p className="text-xl font-bold text-slate-800">
                {Number(selectedRow.valor_programacion).toLocaleString("es-CO")} km
              </p>
            </div>

            <div className="bg-white/70 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Ejecutado</span>
              </div>
              <p className="text-xl font-bold text-slate-800">
                {Number(selectedRow.valor_ejecucion).toLocaleString("es-CO")} km
              </p>
            </div>

            <div className="bg-white/70 rounded-xl p-4 border border-blue-200 md:col-span-2 lg:col-span-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Análisis de Eficiencia</span>
              </div>
              <div className="flex items-center gap-4">
                <p className={`text-2xl font-bold ${getEfficiencyColor(selectedRow.percentage)}`}>
                  {selectedRow.percentage.toFixed(1)}%
                </p>
                <div className="flex-1 bg-blue-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      selectedRow.percentage >= 100
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                        : selectedRow.percentage >= 80
                          ? "bg-gradient-to-r from-blue-500 to-blue-600"
                          : selectedRow.percentage >= 60
                            ? "bg-gradient-to-r from-amber-500 to-amber-600"
                            : "bg-gradient-to-r from-red-500 to-red-600"
                    }`}
                    style={{ width: `${Math.min(selectedRow.percentage, 100)}%` }}
                  ></div>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    selectedRow.percentage >= 100
                      ? "text-emerald-700"
                      : selectedRow.percentage >= 80
                        ? "text-blue-700"
                        : selectedRow.percentage >= 60
                          ? "text-amber-700"
                          : "text-red-700"
                  }`}
                >
                  {selectedRow.percentage >= 100
                    ? "Excelente"
                    : selectedRow.percentage >= 80
                      ? "Bueno"
                      : selectedRow.percentage >= 60
                        ? "Regular"
                        : "Necesita Mejora"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default KmDetailsTab