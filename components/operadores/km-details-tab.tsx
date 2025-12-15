"use client"

import React, { useEffect, useState, useMemo, memo } from "react"
import {
    Loader2,
    Calendar,
    TrendingUp,
    Target,
    CheckCircle,
    Route,
    X,
    AlertTriangle,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { CartesianGrid, XAxis, YAxis, Line, LineChart, LabelList } from "recharts"

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

// Skeleton de carga
const SkeletonCarga = memo(() => (
    <div className="space-y-6 animate-pulse">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex gap-4 mb-4">
                <div className="h-8 w-24 bg-gray-200 rounded" />
                <div className="h-8 w-24 bg-gray-200 rounded" />
            </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3" />
                    <div className="h-6 w-20 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-full bg-gray-200 rounded" />
                </div>
            ))}
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 h-80">
            <div className="flex items-end justify-between h-full gap-4 px-8">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="flex-1 bg-gray-200 rounded-t" style={{ height: `${Math.random() * 60 + 20}%` }} />
                ))}
            </div>
        </div>
    </div>
))
SkeletonCarga.displayName = "SkeletonCarga"

// Tarjeta de resumen
const TarjetaResumen = memo(({ icono: Icono, titulo, valor, subtitulo, porcentaje }: {
    icono: React.ElementType
    titulo: string
    valor: string
    subtitulo: string
    porcentaje?: number
}) => (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Icono className="w-5 h-5 text-white" />
            </div>
            <div className="text-right">
                <div className="text-xl font-bold text-gray-900">{valor}</div>
                <div className="text-xs text-green-600">{subtitulo}</div>
            </div>
        </div>
        {porcentaje !== undefined && (
            <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                    className="h-2 rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${Math.min(porcentaje, 100)}%` }}
                />
            </div>
        )}
        <div className="text-xs text-gray-500 mt-2">{titulo}</div>
    </div>
))
TarjetaResumen.displayName = "TarjetaResumen"

// Obtener color según eficiencia
const obtenerColorEficiencia = (porcentaje: number) => {
    if (porcentaje >= 100) return "text-green-600"
    if (porcentaje >= 80) return "text-green-500"
    if (porcentaje >= 60) return "text-gray-600"
    return "text-gray-500"
}

// Obtener estado según eficiencia
const obtenerEstado = (porcentaje: number) => {
    if (porcentaje >= 100) return { texto: "Excelente", color: "bg-green-100 text-green-700" }
    if (porcentaje >= 80) return { texto: "Bueno", color: "bg-green-50 text-green-600" }
    if (porcentaje >= 60) return { texto: "Regular", color: "bg-gray-100 text-gray-600" }
    return { texto: "Bajo", color: "bg-gray-50 text-gray-500" }
}

function KmDetailsTabBase({ userCode }: KmDetailsTabProps) {
    const [datos, setDatos] = useState<KmResponse | null>(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [añoSeleccionado, setAñoSeleccionado] = useState<number | null>(null)
    const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null)
    const [añosDisponibles, setAñosDisponibles] = useState<number[]>([])
    const [mesesDisponibles, setMesesDisponibles] = useState<number[]>([])
    const [añoGrafica, setAñoGrafica] = useState<number | null>(null)

    // Cargar datos
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setCargando(true)
                setError(null)
                let url = `/api/user/kilometers?codigo=${userCode}`
                if (añoSeleccionado) url += `&year=${añoSeleccionado}`
                if (mesSeleccionado) url += `&month=${mesSeleccionado}`

                const res = await fetch(url)
                if (!res.ok) throw new Error("Error al obtener datos")

                const json = await res.json()
                const payload = json?.data ?? json
                setDatos(payload)
                setAñosDisponibles(payload.availableYears || [])
                setMesesDisponibles(payload.availableMonths || [])
            } catch (err: any) {
                setError(err.message ?? "Error desconocido")
            } finally {
                setCargando(false)
            }
        }

        if (userCode) cargarDatos()
    }, [userCode, añoSeleccionado, mesSeleccionado])

    // Inicializar año de gráfica
    useEffect(() => {
        if (añosDisponibles.length > 0 && añoGrafica === null) {
            setAñoGrafica(añosDisponibles[0])
        }
    }, [añosDisponibles, añoGrafica])

    // Datos filtrados para gráfica
    const datosGrafica = useMemo(() => {
        if (!datos?.data) return []
        let filtrados = [...datos.data]
        if (añoGrafica) {
            filtrados = filtrados.filter(d => d.year === añoGrafica)
        }
        return filtrados
            .sort((a, b) => a.month - b.month)
            .map(d => ({
                mes: d.monthName.substring(0, 3),
                eficiencia: d.percentage,
                programado: Number(d.valor_programacion),
                ejecutado: Number(d.valor_ejecucion),
            }))
    }, [datos, añoGrafica])

    const chartConfig = {
        eficiencia: { label: "Eficiencia", color: "#22c55e" },
    } satisfies ChartConfig

    // Estado de carga
    if (cargando) {
        return (
            <div className="p-4">
                <SkeletonCarga />
            </div>
        )
    }

    // Estado de error
    if (error) {
        return (
            <div className="p-4">
                <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Error al cargar datos</h3>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        )
    }

    // Sin datos
    if (!datos) {
        return (
            <div className="p-4">
                <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Route className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Sin datos disponibles</h3>
                    <p className="text-gray-600">No se encontraron registros de kilómetros</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6">
            {/* Filtros */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Route className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-700">Filtros:</span>
                    </div>

                    <Select
                        value={añoSeleccionado ? String(añoSeleccionado) : "all"}
                        onValueChange={v => setAñoSeleccionado(v === "all" ? null : Number(v))}
                    >
                        <SelectTrigger className="w-32 h-9">
                            <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los años</SelectItem>
                            {añosDisponibles.map(y => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={mesSeleccionado ? String(mesSeleccionado) : "all"}
                        onValueChange={v => setMesSeleccionado(v === "all" ? null : Number(v))}
                    >
                        <SelectTrigger className="w-32 h-9">
                            <SelectValue placeholder="Mes" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los meses</SelectItem>
                            {mesesDisponibles.map(m => (
                                <SelectItem key={m} value={String(m)}>
                                    {new Date(0, m - 1).toLocaleString("es-CO", { month: "long" })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {(añoSeleccionado || mesSeleccionado) && (
                        <button
                            onClick={() => { setAñoSeleccionado(null); setMesSeleccionado(null) }}
                            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                        >
                            <X className="w-4 h-4" />
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TarjetaResumen
                    icono={Target}
                    titulo="Kilómetros planificados"
                    valor={Number(datos.summary?.totalProgrammed ?? 0).toLocaleString("es-CO")}
                    subtitulo="Programado"
                    porcentaje={100}
                />
                <TarjetaResumen
                    icono={CheckCircle}
                    titulo="Kilómetros completados"
                    valor={Number(datos.summary?.totalExecuted ?? 0).toLocaleString("es-CO")}
                    subtitulo="Ejecutado"
                    porcentaje={datos.summary?.percentage}
                />
                <TarjetaResumen
                    icono={TrendingUp}
                    titulo="Porcentaje de cumplimiento"
                    valor={`${(datos.summary?.percentage ?? 0).toFixed(1)}%`}
                    subtitulo="Eficiencia"
                    porcentaje={datos.summary?.percentage}
                />
            </div>

            {/* Gráfica */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-gray-900">Rendimiento Mensual</h3>
                    </div>

                    <Select
                        value={añoGrafica ? String(añoGrafica) : ""}
                        onValueChange={v => setAñoGrafica(Number(v))}
                    >
                        <SelectTrigger className="w-28 h-8">
                            <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                            {añosDisponibles.map(y => (
                                <SelectItem key={y} value={String(y)}>Año {y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {datosGrafica.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-72 w-full">
                        <LineChart data={datosGrafica} margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                            <YAxis domain={[0, 120]} tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={v => `${v}%`} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line
                                type="monotone"
                                dataKey="eficiencia"
                                stroke="#22c55e"
                                strokeWidth={3}
                                dot={{ fill: "#22c55e", strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 7 }}
                            >
                                <LabelList dataKey="eficiencia" position="top" formatter={(v: number) => `${v.toFixed(1)}%`} className="text-xs fill-green-600 font-medium" />
                            </Line>
                        </LineChart>
                    </ChartContainer>
                ) : (
                    <div className="flex items-center justify-center h-72 text-gray-500">
                        <div className="text-center">
                            <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>No hay datos para mostrar</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabla de registros */}
            {datos?.data && datos.data.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-green-500 px-4 py-3">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Registro Detallado ({datos.data.length} registros)
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Período</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Programado</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ejecutado</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Eficiencia</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {datos.data.map((rec, idx) => {
                                    const estado = obtenerEstado(rec.percentage)
                                    return (
                                        <tr key={`${rec.year}-${rec.month}`} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium text-gray-900">{rec.monthName} {rec.year}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="font-medium text-gray-900">{Number(rec.valor_programacion).toLocaleString("es-CO")}</span>
                                                <span className="text-xs text-gray-500 ml-1">km</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="font-medium text-gray-900">{Number(rec.valor_ejecucion).toLocaleString("es-CO")}</span>
                                                <span className="text-xs text-gray-500 ml-1">km</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-bold ${obtenerColorEficiencia(rec.percentage)}`}>
                                                    {rec.percentage.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${estado.color}`}>
                                                    {estado.texto}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function KmDetailsTab(props: KmDetailsTabProps) {
    return <KmDetailsTabBase {...props} />
}
