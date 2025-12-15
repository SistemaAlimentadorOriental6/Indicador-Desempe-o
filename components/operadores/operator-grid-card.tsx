"use client"

import React, { useState, memo, useCallback } from "react"
import {
    MapPin,
    Flame,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    Minus,
    Medal,
    Award,
    AlertTriangle,
    AlertCircle,
    Crown,
    CheckCircle2,
} from "lucide-react"
import Image from "next/image"

// Tipos
interface Operator {
    id: string | number
    codigo?: string
    name: string
    cedula?: string
    document?: string
    position: string
    zona?: string
    padrino?: string
    category: string
    avatar?: string
    streak?: number
    trend?: "up" | "down" | "stable"
    km: {
        total: number
        total_programado?: number
        total_ejecutado?: number
        percentage: number
        category?: string
    }
    bonus: {
        total: number
        percentage: number
        category?: string
    }
    efficiency?: number
    annualEfficiency?: number
}

interface OperatorCardProps {
    operator: Operator
    rank: number
    onClick?: () => void
}

// Obtener ícono de categoría
const obtenerIconoCategoria = (categoria: string) => {
    switch (categoria) {
        case "Oro": return <Crown className="w-4 h-4" />
        case "Plata": return <Medal className="w-4 h-4" />
        case "Bronce": return <Award className="w-4 h-4" />
        case "Mejorar": return <AlertTriangle className="w-4 h-4" />
        case "Taller Conciencia": return <AlertCircle className="w-4 h-4" />
        default: return <Award className="w-4 h-4" />
    }
}

// Obtener color de categoría (todos en tonos verdes)
const obtenerColorCategoria = (categoria: string) => {
    switch (categoria) {
        case "Oro": return "bg-green-600"
        case "Plata": return "bg-green-500"
        case "Bronce": return "bg-green-400"
        case "Mejorar": return "bg-green-300"
        case "Taller Conciencia": return "bg-gray-400"
        default: return "bg-green-500"
    }
}

// Obtener ícono de tendencia
const obtenerIconoTendencia = (tendencia?: string) => {
    if (tendencia === "up") return <TrendingUp className="w-3 h-3 text-green-600" />
    if (tendencia === "down") return <TrendingDown className="w-3 h-3 text-gray-500" />
    return <Minus className="w-3 h-3 text-gray-400" />
}

// Obtener color de badge de ranking
const obtenerColorRanking = (rank: number) => {
    if (rank <= 3) return "bg-green-600 text-white"
    if (rank <= 10) return "bg-green-500 text-white"
    return "bg-gray-500 text-white"
}

// Formatear número
const formatearNumero = (num: number, abreviado = false, decimales = 0) => {
    if (abreviado && num >= 1000000) return `${(num / 1000000).toFixed(decimales)}M`
    if (abreviado && num >= 1000) return `${(num / 1000).toFixed(decimales)}K`
    return num.toLocaleString("es-CO", { maximumFractionDigits: decimales })
}

// Formatear porcentaje
const formatearPorcentaje = (num: number, decimales = 1) => `${num.toFixed(decimales)}%`

// Componente principal de tarjeta
function OperatorCardBase({ operator, rank, onClick }: OperatorCardProps) {
    const [errorImagen, setErrorImagen] = useState(false)

    const documentoId = operator.cedula || operator.document || String(operator.id)
    const urlImagen = `https://admon.sao6.com.co/web/uploads/empleados/${documentoId}.jpg`

    const iniciales = operator.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()

    const manejarErrorImagen = useCallback(() => setErrorImagen(true), [])

    // Valores seguros
    const eficiencia = operator.efficiency ?? 0
    const eficienciaAnual = operator.annualEfficiency
    const bonoPorcentaje = operator.bonus?.percentage ?? 0
    const bonoTotal = operator.bonus?.total ?? 0
    const kmPorcentaje = operator.km?.percentage ?? 0
    const kmTotal = operator.km?.total_ejecutado ?? operator.km?.total ?? 0

    return (
        <div
            className="relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-green-200"
            onClick={onClick}
        >
            {/* Badge de ranking */}
            <div className={`absolute top-4 right-4 z-20 w-10 h-10 rounded-full ${obtenerColorRanking(rank)} flex items-center justify-center text-sm font-bold shadow-md`}>
                #{rank}
            </div>

            {/* Badge de racha (streak) */}
            {(operator.streak ?? 0) >= 30 && (
                <div className="absolute top-4 left-4 z-20 bg-green-600 text-white rounded-full px-2.5 py-1 shadow-md flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{operator.streak}</span>
                </div>
            )}

            <div className="p-5">
                {/* Sección de foto e información */}
                <div className="flex flex-col items-center mb-5">
                    {/* Contenedor estilo tarjeta de identificación */}
                    <div className="relative mb-4">
                        <div className="w-28 h-36 rounded-xl overflow-hidden bg-gray-100 relative shadow-md">
                            {/* Foto del operador */}
                            <div className="w-full h-28 relative overflow-hidden">
                                {!errorImagen ? (
                                    <Image
                                        src={urlImagen}
                                        alt={operator.name}
                                        fill
                                        className="object-cover object-center"
                                        onError={manejarErrorImagen}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-green-500 text-white font-bold text-lg">
                                        {iniciales}
                                    </div>
                                )}
                            </div>

                            {/* Banda inferior con categoría */}
                            <div className={`absolute bottom-0 left-0 right-0 h-8 ${obtenerColorCategoria(operator.category)} flex items-center justify-center text-white`}>
                                <div className="flex items-center gap-1.5">
                                    {obtenerIconoCategoria(operator.category)}
                                    <span className="text-xs font-bold uppercase tracking-wide">
                                        {operator.category === "Taller Conciencia" ? "TALLER" : operator.category.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nombre y cargo */}
                    <div className="text-center mb-2">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 text-lg leading-tight">
                                {operator.name}
                            </h3>
                            {eficiencia >= 95 && (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            )}
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                            {operator.position}
                        </p>
                    </div>

                    {/* Zona y tendencia */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-green-500" />
                            <span className="font-medium">{operator.zona || "Sin zona"}</span>
                        </div>
                        {operator.trend && (
                            <div className="flex items-center gap-1">
                                {obtenerIconoTendencia(operator.trend)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Grid de estadísticas */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                    {/* Eficiencia Actual */}
                    <div className="text-center p-3 rounded-xl bg-green-50">
                        <div className="text-xs text-green-600 mb-1 font-semibold">Eficiencia</div>
                        <div className={`font-bold text-base ${eficiencia >= 100 ? "text-green-600" : "text-gray-900"}`}>
                            {formatearPorcentaje(eficiencia)}
                        </div>
                    </div>

                    {/* Eficiencia Anual */}
                    <div className="text-center p-3 rounded-xl bg-green-50">
                        <div className="text-xs text-green-600 mb-1 font-semibold">Ef. Anual</div>
                        {eficienciaAnual !== undefined ? (
                            <div className={`font-bold text-base ${eficienciaAnual >= 100 ? "text-green-600" : "text-gray-900"}`}>
                                {formatearPorcentaje(eficienciaAnual)}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-6">
                                <div className="w-4 h-4 border-2 border-green-200 border-t-green-500 rounded-full animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Bonos */}
                    <div className="text-center p-3 rounded-xl bg-gray-50">
                        <div className="text-xs text-gray-600 mb-1 font-semibold">Bonos</div>
                        <div className="font-bold text-base text-gray-900">
                            ${formatearNumero(bonoTotal, true)}
                        </div>
                    </div>

                    {/* Kilómetros */}
                    <div className="text-center p-3 rounded-xl bg-gray-50">
                        <div className="text-xs text-gray-600 mb-1 font-semibold">KM</div>
                        <div className="font-bold text-base text-gray-900">
                            {formatearNumero(kmTotal, true, 1)}
                        </div>
                    </div>
                </div>

                {/* Barras de progreso */}
                <div className="space-y-3 mb-5">
                    {/* Kilómetros */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-gray-700">Kilómetros</span>
                            <span className={`text-xs font-bold ${kmPorcentaje >= 100 ? "text-green-600" : "text-gray-700"}`}>
                                {formatearPorcentaje(kmPorcentaje)}
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                                className="h-2 rounded-full bg-green-500 transition-all duration-500"
                                style={{ width: `${Math.min(kmPorcentaje, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Bonos */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-gray-700">Bonos</span>
                            <span className={`text-xs font-bold ${bonoPorcentaje >= 100 ? "text-green-600" : "text-gray-700"}`}>
                                {formatearPorcentaje(bonoPorcentaje)}
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                                className="h-2 rounded-full bg-green-400 transition-all duration-500"
                                style={{ width: `${Math.min(bonoPorcentaje, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Botón de detalles */}
                <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <span>Ver Detalles</span>
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

export const OperatorCard = memo(OperatorCardBase)
export default OperatorCard
