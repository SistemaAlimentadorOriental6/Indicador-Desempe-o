"use client"

import React, { useState, useMemo, useCallback, memo, useEffect } from "react"
import { TrendingUp, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ThreeYearComparisonChart } from "../chart-components"

import { useKilometros, useBonificaciones, useDatosDisponibles } from "./hooks"

interface PropsTarjetaProgresoAnual {
    userCode: string
}

const TarjetaProgresoAnualBase: React.FC<PropsTarjetaProgresoAnual> = ({ userCode }) => {
    const [anioSeleccionado, setAnioSeleccionado] = useState<number | null>(null)

    // 1. Obtener años disponibles
    const { aniosDisponibles, estaCargando: cargandoAnios } = useDatosDisponibles(userCode)

    // 2. Determinar el "Año Actual" real (el mas reciente con datos)
    const anioActualReal = useMemo(() => {
        if (aniosDisponibles.length === 0) return new Date().getFullYear();
        return Math.max(...aniosDisponibles);
    }, [aniosDisponibles]);

    // 3. Determinar los años HISTÓRICOS a mostrar en la gráfica (excluyendo el actual)
    const aniosGrafica = useMemo(() => {
        if (aniosDisponibles.length === 0) return []
        // Filtrar para excluir el año actual real, tomar los 3 siguientes más recientes y ordenar cronológicamente
        return aniosDisponibles
            .filter(y => y < anioActualReal)
            .sort((a, b) => b - a)
            .slice(0, 3)
            .reverse()
    }, [aniosDisponibles, anioActualReal])

    // 4. Autoseleccionar el año más reciente al cargar (para el dropdown y dato principal)
    useEffect(() => {
        if (!anioSeleccionado && aniosDisponibles.length > 0) {
            setAnioSeleccionado(anioActualReal)
        }
    }, [aniosDisponibles, anioSeleccionado, anioActualReal])

    // 5. Hooks para los datos de los 3 años HISTÓRICOS de la gráfica
    const hY1 = useKilometros(userCode, aniosGrafica[0])
    const hB1 = useBonificaciones(userCode, aniosGrafica[0])
    const hY2 = useKilometros(userCode, aniosGrafica[1])
    const hB2 = useBonificaciones(userCode, aniosGrafica[1])
    const hY3 = useKilometros(userCode, aniosGrafica[2])
    const hB3 = useBonificaciones(userCode, aniosGrafica[2])

    // Hook para el año actual real (para mantener la barra 2025 siempre visible en la gráfica)
    const hKmCurrent = useKilometros(userCode, anioActualReal)
    const hBoCurrent = useBonificaciones(userCode, anioActualReal)

    // 5. Hook para el año seleccionado en el dropdown (para los indicadores grandes)
    const hKmSel = useKilometros(userCode, anioSeleccionado || undefined)
    const hBoSel = useBonificaciones(userCode, anioSeleccionado || undefined)

    // Calcular rendimiento del año actual para la gráfica
    const performanceActual = useMemo(() => {
        const kmData = hKmCurrent.data
        const boData = hBoCurrent.data
        if (!kmData && !boData) return undefined

        // Kilómetros
        const kmList = kmData?.data || kmData?.monthlyData || []
        const tKmE = kmList.reduce((s: number, i: any) => s + Number(i.valor_ejecucion || 0), 0)
        const tKmP = kmList.reduce((s: number, i: any) => s + Number(i.valor_programacion || 0), 0)
        const pKm = tKmP > 0 ? (tKmE / tKmP) * 100 : (kmData?.summary?.percentage ?? 0)

        // Bonificaciones
        const boList = boData?.monthlyBonusData || []
        const tBoBase = boList.reduce((s: number, i: any) => s + Number(i.bonusValue || 0), 0)
        const tBoFinal = boList.reduce((s: number, i: any) => s + Number(i.finalValue || 0), 0)
        const pBo = tBoBase > 0 ? (tBoFinal / tBoBase) * 100 : (boData?.summary?.percentage ?? 100)

        return Number(((pKm + pBo) / 2).toFixed(1))
    }, [hKmCurrent.data, hBoCurrent.data])

    // Procesar datos para la comparativa (años históricos)
    const datosComparativa = useMemo(() => {
        const calcularRendimiento = (kmResponse: any, boResponse: any) => {
            if (!kmResponse && !boResponse) return 0

            const kmList = kmResponse?.data || kmResponse?.monthlyData || []
            const tKmE = kmList.reduce((s: number, i: any) => s + Number(i.valor_ejecucion || 0), 0)
            const tKmP = kmList.reduce((s: number, i: any) => s + Number(i.valor_programacion || 0), 0)
            const pKm = tKmP > 0 ? (tKmE / tKmP) * 100 : (kmResponse?.summary?.percentage ?? 0)

            const boList = boResponse?.monthlyBonusData || []
            const tBoBase = boList.reduce((s: number, i: any) => s + Number(i.bonusValue || 0), 0)
            const tBoFinal = boList.reduce((s: number, i: any) => s + Number(i.finalValue || 0), 0)
            const pBo = tBoBase > 0 ? (tBoFinal / tBoBase) * 100 : (boResponse?.summary?.percentage ?? 100)

            return Number(((pKm + pBo) / 2).toFixed(1))
        }

        const hooks = [
            { year: aniosGrafica[0], km: hY1.data, bo: hB1.data },
            { year: aniosGrafica[1], km: hY2.data, bo: hB2.data },
            { year: aniosGrafica[2], km: hY3.data, bo: hB3.data },
        ]

        return hooks
            .map(({ year, km, bo }) => {
                if (!year) return null
                return {
                    year,
                    rendimiento: calcularRendimiento(km, bo)
                }
            })
            .filter(Boolean)
    }, [aniosGrafica, hY1.data, hB1.data, hY2.data, hB2.data, hY3.data, hB3.data])

    // Datos para la sección de indicadores
    const indicadores = useMemo(() => {
        const kmData = hKmSel.data
        const boData = hBoSel.data
        if (!kmData && !boData || !anioSeleccionado) return null

        const kmList = kmData?.data || kmData?.monthlyData || []
        const tKmE = kmList.reduce((s: number, i: any) => s + Number(i.valor_ejecucion || 0), 0)
        const tKmP = kmList.reduce((s: number, i: any) => s + Number(i.valor_programacion || 0), 0)
        const pKm = tKmP > 0 ? (tKmE / tKmP) * 100 : (kmData?.summary?.percentage ?? 0)

        const boList = boData?.monthlyBonusData || []
        const tBoBase = boList.reduce((s: number, i: any) => s + Number(i.bonusValue || 0), 0)
        const tBoFinal = boList.reduce((s: number, i: any) => s + Number(i.finalValue || 0), 0)
        const pBo = tBoBase > 0 ? (tBoFinal / tBoBase) * 100 : (boData?.summary?.percentage ?? 100)

        return {
            combined: Number(((pKm + pBo) / 2).toFixed(1)),
            km: Number((pKm || 0).toFixed(1)),
            bo: Number((pBo || 0).toFixed(1)),
            months: kmList.length > 0 ? kmList.length : (boList.length || 0)
        }
    }, [hKmSel.data, hBoSel.data, anioSeleccionado])

    const estaCargando = cargandoAnios || (hKmSel.estaCargando && !hKmSel.data)
    const error = hKmSel.error || hBoSel.error

    if (estaCargando) return <SkeletonTarjeta />

    return (
        <Card className="bg-white shadow-sm border-gray-100 h-full overflow-hidden">
            <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-500 rounded-lg shadow-sm">
                            <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold text-gray-800">Progreso Anual</CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Historial de Evolución</CardDescription>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => hKmSel.recargar()} className="h-8 w-8 hover:bg-green-50 rounded-full">
                        <RefreshCw className={`h-4 w-4 text-green-600 ${hKmSel.estaCargando ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="px-4 pb-5 space-y-4">
                <div className="pt-2">
                    <Select value={anioSeleccionado?.toString()} onValueChange={(v) => setAnioSeleccionado(Number(v))}>
                        <SelectTrigger className="h-9 border-gray-200 bg-gray-50/50 font-medium text-sm">
                            <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                            {aniosDisponibles.map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="bg-gray-50/30 rounded-2xl p-2 border border-gray-100/50">
                    <ThreeYearComparisonChart
                        data={datosComparativa}
                        currentYearPerformance={performanceActual}
                        referenceYear={anioActualReal}
                    />
                </div>

                {indicadores && (
                    <div className="space-y-4 pt-2">
                        <div className="text-center relative">
                            <div className="text-4xl font-black text-gray-800 tracking-tighter">
                                {indicadores.combined}%
                            </div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                Rendimiento Promedio {anioSeleccionado}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-2">
                                <div className="flex justify-between items-end px-1">
                                    <span className="text-[11px] font-bold text-gray-500 uppercase">Kilómetros</span>
                                    <span className="text-sm font-black text-green-600">{indicadores.km}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                                        style={{ width: `${Math.min(100, indicadores.km)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-end px-1">
                                    <span className="text-[11px] font-bold text-gray-500 uppercase">Bonificaciones</span>
                                    <span className="text-sm font-black text-green-600">{indicadores.bo}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                                        style={{ width: `${Math.min(100, indicadores.bo)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-green-50/50 rounded-xl p-3 border border-green-100/50">
                            <span className="text-[10px] font-bold text-green-600/70 uppercase">Meses procesados</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-black text-green-700">{indicadores.months}</span>
                                <span className="text-[10px] font-bold text-green-600/40">/ 12</span>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <p className="text-[11px] text-red-600 font-medium leading-tight">{error}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

const SkeletonTarjeta = () => (
    <Card className="bg-white shadow-sm h-full">
        <CardHeader className="pb-3 px-4 pt-4">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
        </CardHeader>
        <CardContent className="px-4 pb-5 space-y-4">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/2 mx-auto rounded-lg" />
                <div className="space-y-3">
                    <Skeleton className="h-5 w-full rounded-full" />
                    <Skeleton className="h-5 w-full rounded-full" />
                </div>
            </div>
        </CardContent>
    </Card>
)

export const TarjetaProgresoAnual = memo(TarjetaProgresoAnualBase)
