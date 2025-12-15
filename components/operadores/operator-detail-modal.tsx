"use client"

import React, { useState, useMemo, useCallback, useEffect, memo } from "react"
import {
    X,
    DollarSign,
    MapPin,
    BarChart3,
    TrendingUp,
    TrendingDown,
    Minus,
    Route,
    Crown,
    Shield,
    KeyRound,
    Activity,
    Calendar,
    CalendarCheck,
    CalendarX,
    Cake,
    Fingerprint,
    Briefcase,
    CheckCircle,
    AlertTriangle,
    Loader2,
    Percent,
} from "lucide-react"
import type { Operator } from "@/types/operator-types"
import KmDetailsTab from "./km-details-tab"
import BonusDetailsTab from "./bonus-details-tab"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { CartesianGrid, XAxis, YAxis, Line, LineChart, Bar, BarChart, LabelList } from "recharts"

// Obtener nivel de rendimiento
const obtenerNivelRendimiento = (porcentaje: number) => {
    if (porcentaje >= 95) return { nivel: "Excelente", icono: CheckCircle, color: "text-green-600", bgColor: "bg-green-500" }
    if (porcentaje >= 85) return { nivel: "Bueno", icono: CheckCircle, color: "text-green-500", bgColor: "bg-green-400" }
    if (porcentaje >= 70) return { nivel: "Regular", icono: AlertTriangle, color: "text-gray-600", bgColor: "bg-gray-400" }
    return { nivel: "Necesita Mejora", icono: AlertTriangle, color: "text-gray-500", bgColor: "bg-gray-500" }
}

// Obtener ícono de tendencia
const obtenerIconoTendencia = (tendencia?: string) => {
    if (tendencia === "up") return <TrendingUp className="w-4 h-4 text-green-600" />
    if (tendencia === "down") return <TrendingDown className="w-4 h-4 text-gray-500" />
    return <Minus className="w-4 h-4 text-gray-400" />
}

// Calcular edad
const calcularEdad = (fechaNacimiento: string | null | undefined): string => {
    if (!fechaNacimiento) return "No disponible"
    try {
        const hoy = new Date()
        const nacimiento = new Date(fechaNacimiento)
        if (isNaN(nacimiento.getTime())) return "Fecha inválida"
        let años = hoy.getFullYear() - nacimiento.getFullYear()
        const m = hoy.getMonth() - nacimiento.getMonth()
        if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) años--
        return `${años} años`
    } catch {
        return "Error"
    }
}

// Calcular antigüedad
const calcularAntiguedad = (fechaIngreso: string | null | undefined): string => {
    if (!fechaIngreso) return "No disponible"
    try {
        const hoy = new Date()
        const inicio = new Date(fechaIngreso)
        if (isNaN(inicio.getTime())) return "Fecha inválida"
        let años = hoy.getFullYear() - inicio.getFullYear()
        let meses = hoy.getMonth() - inicio.getMonth()
        if (meses < 0) { años--; meses += 12 }
        if (años > 0) return `${años} año${años > 1 ? "s" : ""}, ${meses} mes${meses !== 1 ? "es" : ""}`
        return `${meses} mes${meses !== 1 ? "es" : ""}`
    } catch {
        return "Error"
    }
}

// Formatear fecha
const formatearFecha = (fecha: string | null | undefined): string => {
    if (!fecha) return "No disponible"
    try {
        const d = new Date(fecha)
        if (isNaN(d.getTime())) return "Fecha inválida"
        return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d)
    } catch {
        return "Fecha inválida"
    }
}

// Formatear moneda
const formatearMoneda = (monto: number): string =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(monto)

// Componente de información
const InfoItem = memo(({ icono: Icono, etiqueta, valor, colorValor }: {
    icono: React.ElementType
    etiqueta: string
    valor: string
    colorValor?: string
}) => (
    <div className="flex items-center gap-2 text-xs">
        <Icono className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-gray-500">{etiqueta}:</span>
        <span className={`font-medium ${colorValor || "text-gray-800"}`}>{valor}</span>
    </div>
))
InfoItem.displayName = "InfoItem"

// Componente de tarjeta de estadística
const TarjetaEstadistica = memo(({ icono: Icono, titulo, valor, subtitulo, porcentaje, tendencia }: {
    icono: React.ElementType
    titulo: string
    valor: string
    subtitulo: string
    porcentaje: number
    tendencia?: "up" | "down" | "stable"
}) => (
    <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Icono className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{valor}</div>
                <div className="text-sm text-green-600 font-medium flex items-center justify-end gap-1">
                    {tendencia && obtenerIconoTendencia(tendencia)}
                    {subtitulo}
                </div>
            </div>
        </div>
        <div className="space-y-1">
            <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="h-2.5 rounded-full bg-green-500 transition-all duration-500" style={{ width: `${Math.min(porcentaje, 100)}%` }} />
            </div>
            <div className="text-xs text-gray-500">{titulo}</div>
        </div>
    </div>
))
TarjetaEstadistica.displayName = "TarjetaEstadistica"



// Tarjeta de categoría
const TarjetaCategoria = memo(({ categoria, categoriaBonos, categoriaKm }: {
    categoria: string
    categoriaBonos?: string
    categoriaKm?: string
}) => (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
        <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
                <h4 className="font-semibold text-gray-900">Categoría Final</h4>
                <p className="text-xs text-gray-500">Clasificación del operador</p>
            </div>
        </div>
        <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{categoria}</div>
            {categoriaBonos && categoriaKm && (
                <div className="mt-2 flex justify-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-gray-50 rounded text-gray-600">Bonos: {categoriaBonos}</span>
                    <span className="px-2 py-1 bg-gray-50 rounded text-gray-600">KM: {categoriaKm}</span>
                </div>
            )}
        </div>
    </div>
))
TarjetaCategoria.displayName = "TarjetaCategoria"

// Skeleton para tarjetas KPI
const SkeletonTarjetaKPI = memo(() => (
    <div className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
        <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl" />
            <div className="text-right space-y-2">
                <div className="h-7 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded ml-auto" />
            </div>
        </div>
        <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
    </div>
))
SkeletonTarjetaKPI.displayName = "SkeletonTarjetaKPI"

// Skeleton para gráfica
const SkeletonGrafica = memo(() => (
    <div className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
        <div className="mb-4 p-3 bg-gray-100 rounded-lg">
            <div className="flex gap-4">
                <div className="h-5 w-32 bg-gray-200 rounded" />
                <div className="h-5 w-24 bg-gray-200 rounded" />
                <div className="h-5 w-24 bg-gray-200 rounded" />
            </div>
        </div>
        <div className="h-80 flex items-end justify-between gap-4 px-8">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-t" style={{ height: `${Math.random() * 60 + 20}%` }} />
                    <div className="h-3 w-8 bg-gray-200 rounded" />
                </div>
            ))}
        </div>
    </div>
))
SkeletonGrafica.displayName = "SkeletonGrafica"

// Skeleton para header de eficiencia
const SkeletonEficiencia = memo(() => (
    <div className="bg-gray-300 rounded-xl p-4 min-w-[160px] animate-pulse">
        <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-20 bg-gray-400 rounded" />
            <div className="h-4 w-24 bg-gray-400 rounded" />
            <div className="h-5 w-16 bg-gray-400 rounded-full" />
        </div>
    </div>
))
SkeletonEficiencia.displayName = "SkeletonEficiencia"

interface OperatorDetailModalProps {
    operator: Operator
    onClose: () => void
}

function OperatorDetailModalBase({ operator, onClose }: OperatorDetailModalProps) {
    const [pestañaActiva, setPestañaActiva] = useState<"overview" | "kilometers" | "bonuses">("overview")
    const [errorImagen, setErrorImagen] = useState(false)
    const [mostrarImagenModal, setMostrarImagenModal] = useState(false)
    const [operadorActual, setOperadorActual] = useState<Operator>(operator)
    const [cargando, setCargando] = useState(false)
    const [eficienciaGlobal, setEficienciaGlobal] = useState<number | null>(null)
    const [cargandoEficienciaGlobal, setCargandoEficienciaGlobal] = useState(true)
    const [añoSeleccionado, setAñoSeleccionado] = useState<number>(new Date().getFullYear())
    const [mesSeleccionado, setMesSeleccionado] = useState<number>(new Date().getMonth() + 1)
    const [tipoFiltro, setTipoFiltro] = useState<"month" | "year">("month")
    const [fechasDisponibles, setFechasDisponibles] = useState<{ years: number[]; months: { [year: number]: number[] } }>({ years: [], months: {} })
    const [cargandoFechas, setCargandoFechas] = useState(true)

    // Estados de gráficas
    const [tipoGrafica, setTipoGrafica] = useState<"monthly" | "yearly">("monthly")
    const [añoGrafica, setAñoGrafica] = useState<number>()
    const [datosRendimientoMensual, setDatosRendimientoMensual] = useState<Array<{ mes: string; eficiencia: number; numeroMes: number }>>([])
    const [datosRendimientoAnual, setDatosRendimientoAnual] = useState<Array<{ año: number; eficiencia: number }>>([])
    const [cargandoRendimiento, setCargandoRendimiento] = useState(false)
    const [eficienciaGlobalGrafica, setEficienciaGlobalGrafica] = useState<number | null>(null)

    const codigoOperador = operator.codigo

    // Cargar fechas disponibles
    useEffect(() => {
        const cargarFechas = async () => {
            if (!codigoOperador) return
            setCargandoFechas(true)
            try {
                const response = await fetch(`/api/user/available-dates?userCode=${codigoOperador}`)
                const resultado = await response.json()
                if (resultado.success && resultado.data) {
                    const { years, months } = resultado.data
                    setFechasDisponibles({ years, months })
                    if (years.length > 0) {
                        setAñoSeleccionado(years[0])
                        setAñoGrafica(years[0])
                        if (months[years[0]]?.length > 0) setMesSeleccionado(months[years[0]][0])
                    }
                }
            } catch {
                const año = new Date().getFullYear()
                const mes = new Date().getMonth() + 1
                setFechasDisponibles({ years: [año], months: { [año]: [mes] } })
                setAñoGrafica(año)
            } finally {
                setCargandoFechas(false)
            }
        }
        cargarFechas()
    }, [codigoOperador])

    // Cargar eficiencia global
    useEffect(() => {
        const cargarEficienciaGlobal = async () => {
            if (!codigoOperador || !añoSeleccionado) return
            setCargandoEficienciaGlobal(true)
            try {
                const response = await fetch(`/api/user/global-efficiency?userCode=${codigoOperador}&year=${añoSeleccionado}`)
                const resultado = await response.json()
                setEficienciaGlobal(resultado.success ? resultado.data.efficiency : 0)
            } catch {
                setEficienciaGlobal(0)
            } finally {
                setCargandoEficienciaGlobal(false)
            }
        }
        cargarEficienciaGlobal()
    }, [codigoOperador, añoSeleccionado])

    // Cargar datos del operador
    useEffect(() => {
        const cargarDatos = async () => {
            if (!codigoOperador || !añoSeleccionado) return
            if (tipoFiltro === "month" && !mesSeleccionado) return

            setCargando(true)
            try {
                const url = tipoFiltro === "year"
                    ? `/api/user/rankings?filterType=year&filterValue=${añoSeleccionado}&userCode=${codigoOperador}`
                    : `/api/user/rankings?filterType=month&filterValue=${añoSeleccionado}-${String(mesSeleccionado).padStart(2, "0")}&userCode=${codigoOperador}`

                const response = await fetch(url)
                const resultado = await response.json()

                if (resultado.success && resultado.data?.length > 0) {
                    setOperadorActual(resultado.data[0])
                } else {
                    setOperadorActual({
                        ...operator,
                        bonus: { percentage: 0, total: 0, category: "Taller Conciencia", trend: "stable", date: null },
                        km: { percentage: 0, total_ejecutado: 0, total_programado: 0, category: "Taller Conciencia", trend: "stable", date: null },
                        efficiency: 0,
                        weeklyPerformance: [],
                        consistency: 0,
                    })
                }
            } catch {
                // Error silencioso
            } finally {
                setCargando(false)
            }
        }

        if (pestañaActiva === "overview") cargarDatos()
    }, [añoSeleccionado, mesSeleccionado, tipoFiltro, codigoOperador, pestañaActiva, operator])

    // Cargar datos mensuales para gráfica
    useEffect(() => {
        const cargarRendimientoMensual = async () => {
            if (!codigoOperador || !añoGrafica || tipoGrafica !== "monthly") return

            setCargandoRendimiento(true)
            try {
                // Cargar eficiencia global del año
                const globalRes = await fetch(`/api/user/global-efficiency?userCode=${codigoOperador}&year=${añoGrafica}`)
                const globalResult = await globalRes.json()
                setEficienciaGlobalGrafica(globalResult.success ? globalResult.data.efficiency : null)

                const mesesDisponibles = fechasDisponibles.months[añoGrafica] || []
                if (mesesDisponibles.length === 0) {
                    setDatosRendimientoMensual([])
                    return
                }

                const promesas = mesesDisponibles.map(mes => {
                    const mesStr = `${añoGrafica}-${String(mes).padStart(2, "0")}`
                    return fetch(`/api/user/rankings?filterType=month&filterValue=${mesStr}&userCode=${codigoOperador}`)
                        .then(res => res.json())
                        .then(result => ({
                            mes: new Date(0, mes - 1).toLocaleString("es-CO", { month: "short" }),
                            numeroMes: mes,
                            eficiencia: result.success && result.data?.length > 0 ? result.data[0].efficiency : 0,
                        }))
                })

                const datos = await Promise.all(promesas)
                setDatosRendimientoMensual(datos.filter(d => d.eficiencia > 0).sort((a, b) => a.numeroMes - b.numeroMes))
            } catch {
                setDatosRendimientoMensual([])
                setEficienciaGlobalGrafica(null)
            } finally {
                setCargandoRendimiento(false)
            }
        }

        cargarRendimientoMensual()
    }, [codigoOperador, añoGrafica, tipoGrafica, fechasDisponibles.months])

    // Cargar datos anuales para gráfica
    useEffect(() => {
        const cargarRendimientoAnual = async () => {
            if (!codigoOperador || tipoGrafica !== "yearly") return

            setCargandoRendimiento(true)
            try {
                const promesas = fechasDisponibles.years.map(año =>
                    fetch(`/api/user/rankings?filterType=year&filterValue=${año}&userCode=${codigoOperador}`)
                        .then(res => res.json())
                        .then(result => ({
                            año,
                            eficiencia: result.success && result.data?.length > 0 ? result.data[0].efficiency : 0,
                        }))
                )

                const datos = await Promise.all(promesas)
                setDatosRendimientoAnual(datos.filter(d => d.eficiencia > 0).sort((a, b) => a.año - b.año))
            } catch {
                setDatosRendimientoAnual([])
            } finally {
                setCargandoRendimiento(false)
            }
        }

        cargarRendimientoAnual()
    }, [codigoOperador, tipoGrafica, fechasDisponibles.years])

    const nivelRendimiento = useMemo(() => obtenerNivelRendimiento(operadorActual.efficiency || 0), [operadorActual.efficiency])
    const nivelGlobal = useMemo(() => obtenerNivelRendimiento(eficienciaGlobal ?? 0), [eficienciaGlobal])

    const urlImagen = useMemo(() => {
        const doc = operator.cedula || operator.document || String(operator.id)
        return doc ? `https://admon.sao6.com.co/web/uploads/empleados/${doc}.jpg` : null
    }, [operator])

    const iniciales = useMemo(() => {
        if (operator.name) {
            const partes = operator.name.split(" ")
            return partes.length >= 2 ? (partes[0][0] + partes[1][0]).toUpperCase() : operator.name.substring(0, 2).toUpperCase()
        }
        return "OP"
    }, [operator.name])

    // Valores calculados
    const bonoTotal = operadorActual.bonus?.total ?? 0
    const bonoPorcentaje = operadorActual.bonus?.percentage ?? 0
    const kmEjecutados = operadorActual.km?.total_ejecutado ?? operadorActual.km?.total ?? 0
    const kmProgramados = operadorActual.km?.total_programado ?? operadorActual.km?.total ?? 0
    const kmDiferencia = kmEjecutados - kmProgramados
    const kmEficiencia = kmProgramados > 0 ? (kmEjecutados / kmProgramados) * 100 : 0

    const consistencia = operadorActual.consistency ??
        (operadorActual.weeklyPerformance?.length > 0
            ? 100 - (Math.max(...operadorActual.weeklyPerformance) - Math.min(...operadorActual.weeklyPerformance))
            : 0)
    const rangoMin = operadorActual.weeklyPerformance?.length > 0 ? Math.min(...operadorActual.weeklyPerformance) : undefined
    const rangoMax = operadorActual.weeklyPerformance?.length > 0 ? Math.max(...operadorActual.weeklyPerformance) : undefined

    const manejarTecla = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Escape") onClose()
    }, [onClose])

    const chartConfig = { eficiencia: { label: "Eficiencia", color: "#22c55e" } } satisfies ChartConfig

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                onKeyDown={manejarTecla}
            >
                <div className="bg-white rounded-xl max-w-[95vw] w-full h-[90vh] flex flex-col overflow-hidden shadow-xl">
                    {/* Header */}
                    <header className="relative bg-gray-50 border-b border-gray-100 p-4 flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 z-20"
                            aria-label="Cerrar"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>

                        <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4">
                            {/* Foto y datos básicos */}
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative">
                                    {urlImagen && !errorImagen ? (
                                        <div
                                            className="w-20 h-20 rounded-xl overflow-hidden shadow-md border-2 border-white cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => setMostrarImagenModal(true)}
                                            title="Click para ver imagen completa"
                                        >
                                            <Image
                                                src={urlImagen}
                                                alt={operator.name || "Operador"}
                                                width={80}
                                                height={80}
                                                className="object-cover w-full h-full"
                                                onError={() => setErrorImagen(true)}
                                                priority
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 bg-green-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
                                            {iniciales}
                                        </div>
                                    )}
                                    {operator.category === "Oro" && (
                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center shadow border-2 border-white">
                                            <Crown className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h1 className="text-2xl font-bold text-gray-900 truncate">{operator.name}</h1>
                                    {operator.position && <p className="text-sm text-green-600 font-medium mb-2">{operator.position}</p>}

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
                                        <InfoItem icono={KeyRound} etiqueta="Código" valor={operator.codigo || "N/A"} />
                                        <InfoItem icono={Fingerprint} etiqueta="Cédula" valor={operator.cedula || operator.document || "N/A"} />
                                        <InfoItem icono={Cake} etiqueta="Edad" valor={calcularEdad(operator.birthDate)} />
                                        <InfoItem icono={Calendar} etiqueta="Ingreso" valor={formatearFecha(operator.joinDate)} />
                                        <InfoItem icono={Briefcase} etiqueta="Antigüedad" valor={calcularAntiguedad(operator.joinDate)} />
                                        <InfoItem
                                            icono={operator.retirementDate ? CalendarX : CalendarCheck}
                                            etiqueta="Estado"
                                            valor={operator.retirementDate ? `Retirado (${formatearFecha(operator.retirementDate)})` : "Vigente"}
                                            colorValor={operator.retirementDate ? "text-gray-500" : "text-green-600"}
                                        />
                                        <InfoItem icono={MapPin} etiqueta="Zona" valor={operator.zona || "Sin zona"} />
                                        <InfoItem icono={Shield} etiqueta="Padrino" valor={operator.padrino || "Sin padrino"} />
                                    </div>
                                </div>
                            </div>

                            {/* Tarjetas de eficiencia */}
                            <div className="flex gap-3 w-full xl:w-auto">
                                <div className={`${nivelRendimiento.bgColor} rounded-xl p-4 text-white min-w-[160px] text-center shadow-md`}>
                                    <div className="text-3xl font-bold">{(operadorActual.efficiency || 0).toFixed(1)}%</div>
                                    <div className="text-sm text-white/90">Eficiencia {tipoFiltro === "year" ? "Anual" : "Mensual"}</div>
                                    <div className="mt-2 inline-flex items-center gap-1 text-xs bg-white/20 rounded-full px-3 py-1">
                                        <nivelRendimiento.icono className="w-3 h-3" />
                                        {nivelRendimiento.nivel}
                                    </div>
                                </div>

                                <div className={`${nivelGlobal.bgColor} rounded-xl p-4 text-white min-w-[160px] text-center shadow-md`}>
                                    {cargandoEficienciaGlobal ? (
                                        <div className="flex items-center justify-center h-[76px]">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-3xl font-bold">{(eficienciaGlobal ?? 0).toFixed(1)}%</div>
                                            <div className="text-sm text-white/90">Ef. Global {añoSeleccionado}</div>
                                            <div className="mt-2 inline-flex items-center gap-1 text-xs bg-white/20 rounded-full px-3 py-1">
                                                <nivelGlobal.icono className="w-3 h-3" />
                                                {nivelGlobal.nivel}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Tabs de navegación */}
                    <nav className="bg-white border-b border-gray-100 px-4 flex gap-1 flex-shrink-0" role="tablist">
                        {[
                            { id: "overview", label: "Vista General", icono: BarChart3 },
                            { id: "kilometers", label: "Kilómetros", icono: Route },
                            { id: "bonuses", label: "Bonos", icono: DollarSign },
                        ].map(tab => {
                            const Icono = tab.icono
                            const activo = pestañaActiva === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setPestañaActiva(tab.id as any)}
                                    className={`flex items-center gap-2 py-3 px-4 font-medium text-sm transition-colors ${activo ? "text-green-600 border-b-2 border-green-500 bg-green-50" : "text-gray-600 hover:text-green-600 hover:bg-gray-50"
                                        }`}
                                    role="tab"
                                    aria-selected={activo}
                                >
                                    <Icono className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            )
                        })}
                    </nav>

                    {/* Contenido */}
                    <main className="flex-1 overflow-y-auto bg-gray-50 p-4 min-h-0">
                        {pestañaActiva === "overview" && (
                            <div className="space-y-6">
                                {/* Sección 1: Filtros e indicadores */}
                                <section>
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-green-600" />
                                            Indicadores Clave de Rendimiento
                                        </h2>

                                        <div className="flex items-center gap-2">
                                            <Select value={tipoFiltro} onValueChange={(v: "month" | "year") => {
                                                setTipoFiltro(v)
                                                if (v === "year") setMesSeleccionado(0)
                                                else if (fechasDisponibles.months[añoSeleccionado]?.length > 0) {
                                                    setMesSeleccionado(fechasDisponibles.months[añoSeleccionado][0])
                                                }
                                            }} disabled={cargando || cargandoFechas}>
                                                <SelectTrigger className="w-24 h-9"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="month">Mes</SelectItem>
                                                    <SelectItem value="year">Año</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <Select value={String(añoSeleccionado)} onValueChange={v => {
                                                const nuevoAño = Number(v)
                                                setAñoSeleccionado(nuevoAño)
                                                if (tipoFiltro === "month" && fechasDisponibles.months[nuevoAño]?.length > 0) {
                                                    setMesSeleccionado(fechasDisponibles.months[nuevoAño][0])
                                                }
                                            }} disabled={cargando || cargandoFechas}>
                                                <SelectTrigger className="w-24 h-9"><SelectValue placeholder="Año" /></SelectTrigger>
                                                <SelectContent>
                                                    {fechasDisponibles.years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                                </SelectContent>
                                            </Select>

                                            {tipoFiltro === "month" && (
                                                <Select value={String(mesSeleccionado)} onValueChange={v => setMesSeleccionado(Number(v))} disabled={cargando || cargandoFechas}>
                                                    <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Mes" /></SelectTrigger>
                                                    <SelectContent>
                                                        {(fechasDisponibles.months[añoSeleccionado] || []).map(m => (
                                                            <SelectItem key={m} value={String(m)}>
                                                                {new Date(0, m - 1).toLocaleString("es-CO", { month: "long" })}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    </div>

                                    {/* Grid de tarjetas KPI */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {cargando ? (
                                            <>
                                                <SkeletonTarjetaKPI />
                                                <SkeletonTarjetaKPI />
                                                <SkeletonTarjetaKPI />
                                                <SkeletonTarjetaKPI />
                                            </>
                                        ) : (
                                            <>
                                                <TarjetaEstadistica
                                                    icono={DollarSign}
                                                    titulo={`Bonos ${tipoFiltro === "year" ? "Anuales" : "Mensuales"}`}
                                                    valor={formatearMoneda(bonoTotal)}
                                                    subtitulo={`${bonoPorcentaje.toFixed(1)}% del objetivo`}
                                                    porcentaje={bonoPorcentaje}
                                                    tendencia={operadorActual.bonus?.trend}
                                                />

                                                <TarjetaEstadistica
                                                    icono={Route}
                                                    titulo={`KM ${tipoFiltro === "year" ? "Anuales" : "Mensuales"}`}
                                                    valor={kmEjecutados.toLocaleString("es-CO")}
                                                    subtitulo={`${kmDiferencia >= 0 ? "+" : ""}${kmDiferencia.toLocaleString("es-CO")} vs objetivo`}
                                                    porcentaje={kmEficiencia}
                                                    tendencia={operadorActual.km?.trend}
                                                />



                                                <TarjetaCategoria
                                                    categoria={operadorActual.category || operator.category}
                                                    categoriaBonos={operadorActual.bonus?.category}
                                                    categoriaKm={operadorActual.km?.category}
                                                />
                                            </>
                                        )}
                                    </div>
                                </section>

                                {/* Sección 2: Gráfica de rendimiento */}
                                <section>
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-green-600" />
                                                Rendimiento {tipoGrafica === "yearly" ? "Histórico" : "Anual"}
                                            </h2>
                                            <p className="text-sm text-gray-500">
                                                {tipoGrafica === "yearly" ? "Comparación de eficiencia por año" : "Evolución mensual del porcentaje de eficiencia"}
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            <Select value={tipoGrafica} onValueChange={(v: "monthly" | "yearly") => setTipoGrafica(v)} disabled={cargandoRendimiento}>
                                                <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="monthly">Por Mes</SelectItem>
                                                    <SelectItem value="yearly">Por Año</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {tipoGrafica === "monthly" && (
                                                <Select value={String(añoGrafica)} onValueChange={v => setAñoGrafica(Number(v))} disabled={cargandoRendimiento}>
                                                    <SelectTrigger className="w-28 h-9"><SelectValue placeholder="Año" /></SelectTrigger>
                                                    <SelectContent>
                                                        {fechasDisponibles.years.map(y => <SelectItem key={y} value={String(y)}>Año {y}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                                        {/* Resumen del año */}
                                        {tipoGrafica === "monthly" && eficienciaGlobalGrafica !== null && (
                                            <div className="mb-4 flex flex-wrap items-center gap-4 p-3 bg-green-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Percent className="w-5 h-5 text-green-600" />
                                                    <span className="text-sm font-medium text-gray-700">Promedio Anual {añoGrafica}:</span>
                                                    <span className="text-lg font-bold text-green-600">{eficienciaGlobalGrafica.toFixed(1)}%</span>
                                                </div>
                                                {datosRendimientoMensual.length > 0 && (
                                                    <>
                                                        <div className="text-sm text-gray-600">
                                                            <span className="font-medium">Mejor mes:</span> {datosRendimientoMensual.reduce((a, b) => a.eficiencia > b.eficiencia ? a : b).eficiencia.toFixed(1)}%
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            <span className="font-medium">Peor mes:</span> {datosRendimientoMensual.reduce((a, b) => a.eficiencia < b.eficiencia ? a : b).eficiencia.toFixed(1)}%
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {cargandoRendimiento ? (
                                            <SkeletonGrafica />
                                        ) : (tipoGrafica === "monthly" ? datosRendimientoMensual.length > 0 : datosRendimientoAnual.length > 0) ? (
                                            <ChartContainer config={chartConfig} className="h-80 w-full">
                                                {tipoGrafica === "monthly" ? (
                                                    <LineChart data={datosRendimientoMensual} margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
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
                                                ) : (
                                                    <BarChart data={datosRendimientoAnual} margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                        <XAxis dataKey="año" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                                        <YAxis domain={[0, 120]} tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={v => `${v}%`} />
                                                        <ChartTooltip content={<ChartTooltipContent />} />
                                                        <Bar dataKey="eficiencia" fill="#22c55e" radius={[4, 4, 0, 0]}>
                                                            <LabelList dataKey="eficiencia" position="top" formatter={(v: number) => `${v.toFixed(1)}%`} className="text-xs fill-green-600 font-bold" />
                                                        </Bar>
                                                    </BarChart>
                                                )}
                                            </ChartContainer>
                                        ) : (
                                            <div className="flex items-center justify-center h-80 text-gray-500">
                                                No hay datos disponibles para este período
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}

                        {pestañaActiva === "kilometers" && codigoOperador && (
                            <KmDetailsTab userCode={codigoOperador} />
                        )}

                        {pestañaActiva === "bonuses" && codigoOperador && (
                            <BonusDetailsTab userCode={codigoOperador} />
                        )}
                    </main>
                </div>
            </div>

            {/* Modal de imagen completa */}
            {mostrarImagenModal && urlImagen && (
                <div
                    className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
                    onClick={() => setMostrarImagenModal(false)}
                >
                    <div className="relative max-w-2xl max-h-[80vh]">
                        <button
                            onClick={() => setMostrarImagenModal(false)}
                            className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <Image
                            src={urlImagen}
                            alt={operator.name || "Operador"}
                            width={600}
                            height={600}
                            className="object-contain rounded-xl max-h-[80vh]"
                        />
                    </div>
                </div>
            )}
        </>
    )
}

export const OperatorDetailModal = memo(OperatorDetailModalBase)
export const EnhancedOperatorDetailModal = OperatorDetailModal
export default OperatorDetailModal
