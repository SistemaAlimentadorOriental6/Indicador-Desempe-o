"use client"

import React, { useEffect, useState, useMemo } from "react"
import {
    Loader2,
    X,
    DollarSign,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Calculator,
    Percent,
    ChevronDown,
    ChevronUp,
    Calendar,
    TrendingUp,
    BarChart3,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { CartesianGrid, XAxis, YAxis, Line, LineChart, LabelList } from "recharts"

interface BonusDetailsTabProps {
    userCode: string
}

interface Deduction {
    id: number
    codigo: string
    concepto: string
    porcentaje: number | string
    monto: number
    fechaInicio: string
    fechaFin: string | null
    dias?: number
    observaciones?: string
}

interface BonusResponse {
    baseBonus: number
    finalBonus: number
    deductionPercentage: number
    deductionAmount: number
    summary: { totalProgrammed: number; totalExecuted: number; percentage: number }
    deductions: Deduction[]
    availableYears: number[]
    availableMonths: number[]
}

interface FaultRecord {
    codigo: string
    descripcion: string
    years: { [year: number]: number }
}

interface FaultsResponse {
    data: FaultRecord[]
    availableYears: number[]
    totalByYear: { [year: number]: number }
}

interface MonthlyPerformance {
    month: string
    monthNumber: number
    percentage: number
    baseBonus: number
    finalBonus: number
    deductionAmount: number
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount)

const obtenerNombreMes = (numeroMes: number): string => {
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
    return meses[numeroMes - 1] || ""
}

// Skeleton de carga
const SkeletonCarga = () => (
    <div className="space-y-6 animate-pulse p-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex gap-4 mb-4">
                <div className="h-8 w-24 bg-gray-200 rounded" />
                <div className="h-8 w-24 bg-gray-200 rounded" />
            </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3" />
                    <div className="h-6 w-20 bg-gray-200 rounded mb-2" />
                    <div className="h-2 w-full bg-gray-200 rounded" />
                </div>
            ))}
        </div>
    </div>
)

// Tarjeta de resumen
const TarjetaResumen = ({ icono: Icono, titulo, valor, destacado }: {
    icono: React.ElementType
    titulo: string
    valor: string
    destacado?: boolean
}) => (
    <div className={`rounded-xl p-4 border ${destacado ? "bg-green-50 border-green-200" : "bg-white border-gray-100"}`}>
        <div className="flex items-center justify-between mb-2">
            <div className={`w-10 h-10 ${destacado ? "bg-green-500" : "bg-gray-100"} rounded-lg flex items-center justify-center`}>
                <Icono className={`w-5 h-5 ${destacado ? "text-white" : "text-green-600"}`} />
            </div>
            <div className="text-right">
                <div className="text-xs text-gray-600 mb-0.5">{titulo}</div>
                <div className={`text-lg font-bold ${destacado ? "text-green-700" : "text-gray-900"}`}>{valor}</div>
            </div>
        </div>
        <div className={`h-1 ${destacado ? "bg-green-500" : "bg-gray-200"} rounded-full`} />
    </div>
)

export default function BonusDetailsTab({ userCode }: BonusDetailsTabProps) {
    const [datos, setDatos] = useState<BonusResponse | null>(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [añoSeleccionado, setAñoSeleccionado] = useState<number | null>(null)
    const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null)
    const [añosDisponibles, setAñosDisponibles] = useState<number[]>([])
    const [mesesDisponibles, setMesesDisponibles] = useState<number[]>([])

    const [datosNovedades, setDatosNovedades] = useState<FaultsResponse | null>(null)
    const [cargandoNovedades, setCargandoNovedades] = useState(false)
    const [mostrarNovedades, setMostrarNovedades] = useState(true)

    const [rendimientoMensual, setRendimientoMensual] = useState<MonthlyPerformance[]>([])
    const [añoGrafica, setAñoGrafica] = useState<number>(new Date().getFullYear())
    const [cargandoRendimiento, setCargandoRendimiento] = useState(false)

    // Estado para modal de detalle de faltas
    const [modalDetalle, setModalDetalle] = useState<{ codigo: string; descripcion: string; year?: number } | null>(null)
    const [detallesFalta, setDetallesFalta] = useState<any[]>([])
    const [cargandoDetalle, setCargandoDetalle] = useState(false)

    // Función para cargar detalle de una falta
    const cargarDetalleFalta = async (codigo: string, descripcion: string, year?: number) => {
        setModalDetalle({ codigo, descripcion, year })
        setCargandoDetalle(true)
        setDetallesFalta([])
        try {
            let url = `/api/user/faults?codigo=${userCode}&codigoFalta=${codigo}&detalle=1`
            if (year) url += `&year=${year}`
            const res = await fetch(url)
            if (res.ok) {
                const json = await res.json()
                setDetallesFalta(json?.data ?? json ?? [])
            }
        } catch {
            setDetallesFalta([])
        } finally {
            setCargandoDetalle(false)
        }
    }

    // Inicializar con fecha actual
    useEffect(() => {
        const hoy = new Date()
        if (!añoSeleccionado && !mesSeleccionado) {
            setAñoSeleccionado(hoy.getFullYear())
            setMesSeleccionado(hoy.getMonth() + 1)
        }
    }, [])

    // Cargar datos de bonos
    useEffect(() => {
        const cargarBonos = async () => {
            try {
                setCargando(true)
                setError(null)
                let url = `/api/user/bonuses?codigo=${userCode}`
                if (añoSeleccionado) url += `&year=${añoSeleccionado}`
                if (mesSeleccionado) url += `&month=${mesSeleccionado}`

                const res = await fetch(url)
                if (!res.ok) throw new Error("Error al obtener datos")
                const json = await res.json()
                const payload = json?.data ?? json

                setDatos({
                    ...payload,
                    deductions: Array.isArray(payload.deductions) ? payload.deductions : [],
                })
                setAñosDisponibles(payload.availableYears || [])
                setMesesDisponibles(payload.availableMonths || [])
            } catch (err: any) {
                setError(err.message ?? "Error desconocido")
            } finally {
                setCargando(false)
            }
        }

        const cargarNovedades = async () => {
            try {
                setCargandoNovedades(true)
                const res = await fetch(`/api/user/faults?codigo=${userCode}`)
                if (res.ok) {
                    const json = await res.json()
                    setDatosNovedades(json?.data ?? json)
                }
            } catch {
                setDatosNovedades(null)
            } finally {
                setCargandoNovedades(false)
            }
        }

        if (userCode) {
            cargarBonos()
            cargarNovedades()
        }
    }, [userCode, añoSeleccionado, mesSeleccionado])

    // Cargar rendimiento mensual para gráfica
    useEffect(() => {
        const cargarRendimiento = async () => {
            if (!añoGrafica) return
            setCargandoRendimiento(true)

            try {
                const meses = Array.from({ length: 12 }, (_, i) => i + 1)
                const datos: MonthlyPerformance[] = []

                for (const mes of meses) {
                    try {
                        const res = await fetch(`/api/user/bonuses?codigo=${userCode}&year=${añoGrafica}&month=${mes}`)
                        if (res.ok) {
                            const json = await res.json()
                            const payload = json?.data ?? json
                            if (payload.baseBonus && payload.baseBonus > 0) {
                                datos.push({
                                    month: obtenerNombreMes(mes).substring(0, 3),
                                    monthNumber: mes,
                                    percentage: Math.round((payload.finalBonus / payload.baseBonus) * 1000) / 10,
                                    baseBonus: payload.baseBonus,
                                    finalBonus: payload.finalBonus,
                                    deductionAmount: payload.deductionAmount || 0,
                                })
                            }
                        }
                    } catch {
                        // Skip
                    }
                }

                setRendimientoMensual(datos.sort((a, b) => a.monthNumber - b.monthNumber))
            } catch {
                setRendimientoMensual([])
            } finally {
                setCargandoRendimiento(false)
            }
        }

        if (userCode && añoGrafica) cargarRendimiento()
    }, [userCode, añoGrafica])

    const chartConfig = { percentage: { label: "% Bono", color: "#22c55e" } } satisfies ChartConfig

    // Estados de carga, error y sin datos
    if (cargando) return <SkeletonCarga />

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

    if (!datos) {
        return (
            <div className="p-4">
                <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Sin datos disponibles</h3>
                    <p className="text-gray-600">
                        {añoSeleccionado && mesSeleccionado
                            ? `No se encontraron registros para ${obtenerNombreMes(mesSeleccionado)} ${añoSeleccionado}`
                            : "No se encontraron registros de bonificaciones"}
                    </p>
                </div>
            </div>
        )
    }

    const sinDeducciones = (datos.deductionAmount ?? 0) === 0

    return (
        <div className="p-4 space-y-6">
            {/* Filtros */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-700">Filtros:</span>
                    </div>

                    <Select
                        value={añoSeleccionado ? String(añoSeleccionado) : "all"}
                        onValueChange={v => setAñoSeleccionado(v === "all" ? null : Number(v))}
                    >
                        <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Año" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los años</SelectItem>
                            {añosDisponibles.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select
                        value={mesSeleccionado ? String(mesSeleccionado) : "all"}
                        onValueChange={v => setMesSeleccionado(v === "all" ? null : Number(v))}
                    >
                        <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Mes" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los meses</SelectItem>
                            {mesesDisponibles.map(m => (
                                <SelectItem key={m} value={String(m)}>{obtenerNombreMes(m)}</SelectItem>
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

                    {añoSeleccionado && mesSeleccionado && (
                        <div className={`ml-auto px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${sinDeducciones ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                            }`}>
                            {sinDeducciones ? <CheckCircle className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {sinDeducciones ? "Bono Completo" : "Con Deducciones"}
                        </div>
                    )}
                </div>
            </div>

            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <TarjetaResumen icono={Calculator} titulo="Bono Base" valor={formatCurrency(datos.baseBonus ?? 0)} />
                <TarjetaResumen icono={TrendingDown} titulo="Deducción" valor={formatCurrency(datos.deductionAmount ?? 0)} />
                <TarjetaResumen icono={Percent} titulo="% Descuento" valor={`${(datos.deductionPercentage ?? 0).toFixed(1)}%`} />
                <TarjetaResumen icono={CheckCircle} titulo="Bono Final" valor={formatCurrency(datos.finalBonus ?? 0)} destacado={sinDeducciones} />
            </div>

            {/* Banner de bono completo */}
            {añoSeleccionado && mesSeleccionado && sinDeducciones && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-green-800">Bono Completo en {obtenerNombreMes(mesSeleccionado)} {añoSeleccionado}</h4>
                        <p className="text-sm text-green-700">No se registraron deducciones que afecten este mes.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-green-700">{formatCurrency(datos.baseBonus ?? 0)}</div>
                        <div className="text-xs text-green-600">Bono íntegro</div>
                    </div>
                </div>
            )}

            {/* Gráfica de rendimiento mensual */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-gray-900">Rendimiento de Bonos</h3>
                    </div>

                    <Select value={String(añoGrafica)} onValueChange={v => setAñoGrafica(Number(v))}>
                        <SelectTrigger className="w-28 h-8"><SelectValue placeholder="Año" /></SelectTrigger>
                        <SelectContent>
                            {añosDisponibles.map(y => <SelectItem key={y} value={String(y)}>Año {y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {cargandoRendimiento ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                    </div>
                ) : rendimientoMensual.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-64 w-full">
                        <LineChart data={rendimientoMensual} margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                            <YAxis domain={[0, 110]} tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={v => `${v}%`} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line
                                type="monotone"
                                dataKey="percentage"
                                stroke="#22c55e"
                                strokeWidth={3}
                                dot={{ fill: "#22c55e", strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 7 }}
                            >
                                <LabelList dataKey="percentage" position="top" formatter={(v: number) => `${v.toFixed(1)}%`} className="text-xs fill-green-600 font-medium" />
                            </Line>
                        </LineChart>
                    </ChartContainer>
                ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                        <div className="text-center">
                            <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>No hay datos para mostrar</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Historial de novedades */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                    onClick={() => setMostrarNovedades(!mostrarNovedades)}
                    className="w-full bg-green-500 px-4 py-3 flex items-center justify-between text-white"
                >
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        <h3 className="font-semibold">Historial de Novedades</h3>
                        {datosNovedades?.data && (
                            <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{datosNovedades.data.length} tipos</span>
                        )}
                    </div>
                    {mostrarNovedades ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {mostrarNovedades && (
                    <div className="p-4">
                        {cargandoNovedades ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                                <span className="ml-2 text-gray-600">Cargando novedades...</span>
                            </div>
                        ) : datosNovedades?.data && datosNovedades.data.length > 0 ? (
                            <div className="space-y-4">
                                {/* Resumen estadístico */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-green-50 rounded-lg">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900">
                                            {Object.values(datosNovedades.totalByYear).reduce((a, b) => a + b, 0)}
                                        </div>
                                        <div className="text-xs text-gray-600">Total Novedades</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900">{datosNovedades.availableYears.length}</div>
                                        <div className="text-xs text-gray-600">Años con Registro</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900">{datosNovedades.data.length}</div>
                                        <div className="text-xs text-gray-600">Tipos Diferentes</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900">
                                            {(Object.values(datosNovedades.totalByYear).reduce((a, b) => a + b, 0) / datosNovedades.availableYears.length).toFixed(1)}
                                        </div>
                                        <div className="text-xs text-gray-600">Promedio Anual</div>
                                    </div>
                                </div>

                                {/* Distribución por año */}
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-green-600" />
                                        Distribución por Año
                                    </h4>
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                        {datosNovedades.availableYears.map(year => {
                                            const total = datosNovedades.totalByYear[year] || 0
                                            const max = Math.max(...Object.values(datosNovedades.totalByYear))
                                            const pct = max > 0 ? (total / max) * 100 : 0
                                            return (
                                                <div key={year} className="bg-gray-50 rounded-lg p-3 text-center">
                                                    <div className="text-xl font-bold text-gray-900">{total}</div>
                                                    <div className="text-xs text-gray-600 mb-2">{year}</div>
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                        <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Tabla de novedades */}
                                <div className="overflow-x-auto rounded-lg border border-gray-100">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Tipo de Falta</th>
                                                {datosNovedades.availableYears.map(year => (
                                                    <th key={year} className="px-3 py-2 text-center text-xs font-semibold text-gray-600">{year}</th>
                                                ))}
                                                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 bg-green-50">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {datosNovedades.data.map((falta, idx) => {
                                                const total = Object.values(falta.years).reduce((a, b) => a + b, 0)
                                                return (
                                                    <tr
                                                        key={idx}
                                                        className="hover:bg-green-50 cursor-pointer transition-colors"
                                                        onClick={() => cargarDetalleFalta(falta.codigo, falta.descripcion)}
                                                    >
                                                        <td className="px-3 py-2">
                                                            <div className="font-medium text-gray-900 flex items-center gap-1">
                                                                {falta.codigo}
                                                                <span className="text-xs text-green-600">→</span>
                                                            </div>
                                                            <div className="text-xs text-gray-500 truncate max-w-[200px]">{falta.descripcion}</div>
                                                        </td>
                                                        {datosNovedades.availableYears.map(year => (
                                                            <td
                                                                key={year}
                                                                className="px-3 py-2 text-center"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    if (falta.years[year] > 0) {
                                                                        cargarDetalleFalta(falta.codigo, falta.descripcion, year)
                                                                    }
                                                                }}
                                                            >
                                                                <span className={`inline-block min-w-[24px] px-1.5 py-0.5 rounded text-xs font-medium ${falta.years[year] > 0 ? "bg-green-100 text-green-700 hover:bg-green-200" : "text-gray-400"}`}>
                                                                    {falta.years[year] || 0}
                                                                </span>
                                                            </td>
                                                        ))}
                                                        <td className="px-3 py-2 text-center bg-green-50">
                                                            <span className="font-bold text-green-700">{total}</span>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>No hay novedades registradas</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Tabla de deducciones del mes actual */}
            {datos.deductions && datos.deductions.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-green-600" />
                            Deducciones del Período ({datos.deductions.length})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Código</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Concepto</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">%</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Monto</th>
                                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {datos.deductions.map((ded, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 font-medium text-gray-900">{ded.codigo}</td>
                                        <td className="px-4 py-2 text-gray-700">{ded.concepto}</td>
                                        <td className="px-4 py-2 text-right text-gray-700">
                                            {typeof ded.porcentaje === "number" ? `${(ded.porcentaje * 100).toFixed(1)}%` : ded.porcentaje}
                                        </td>
                                        <td className="px-4 py-2 text-right font-medium text-gray-900">{formatCurrency(ded.monto)}</td>
                                        <td className="px-4 py-2 text-center text-gray-600">
                                            {new Date(ded.fechaInicio).toLocaleDateString("es-CO")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de detalle de falta */}
            {modalDetalle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalDetalle(null)}>
                    <div className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-green-500 px-4 py-3 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-white">{modalDetalle.codigo}</h3>
                                <p className="text-sm text-green-100">{modalDetalle.descripcion}</p>
                                {modalDetalle.year && <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Año {modalDetalle.year}</span>}
                            </div>
                            <button onClick={() => setModalDetalle(null)} className="text-white hover:bg-white/20 p-1 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            {cargandoDetalle ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                                    <span className="ml-2 text-gray-600">Cargando detalles...</span>
                                </div>
                            ) : detallesFalta.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="text-sm text-gray-600 mb-2">
                                        {detallesFalta.length} incidencia{detallesFalta.length !== 1 ? 's' : ''} encontrada{detallesFalta.length !== 1 ? 's' : ''}
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Fecha Inicio</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Fecha Fin</th>
                                                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Días</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Observaciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {detallesFalta.map((det, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 text-gray-900">
                                                        {det.fechaInicio ? new Date(det.fechaInicio).toLocaleDateString("es-CO") : '-'}
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-900">
                                                        {det.fechaFin ? new Date(det.fechaFin).toLocaleDateString("es-CO") : '-'}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                                                            {det.dias || 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-600 text-xs">
                                                        {det.observaciones || det.concepto || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>No se encontraron detalles para esta falta</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
