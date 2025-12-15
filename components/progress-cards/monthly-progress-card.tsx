"use client"

import React, { useState, useMemo, memo, useEffect, useCallback } from "react"
import { BarChart3, TrendingUp, DollarSign, Target, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MonthlyPerformanceChart } from "../chart-components"

import { useKilometros, useBonificaciones, useDatosDisponibles } from "./hooks"
import { obtenerNombreMes, formatoNumeroSeguro, obtenerBonoBaseAnual } from "./utils"

interface PropsTarjetaProgresoMensual {
    userCode: string
}

const TarjetaProgresoMensualBase: React.FC<PropsTarjetaProgresoMensual> = ({ userCode }) => {
    const [anioSeleccionado, setAnioSeleccionado] = useState<number | null>(null)
    const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null)

    // Obtener años y meses disponibles (con cache compartido)
    const { aniosDisponibles, mesesDisponibles, estaCargando: cargandoDatos } = useDatosDisponibles(userCode)

    // Obtener datos del año seleccionado (con cache y deduplicación)
    const { data: dataKm, estaCargando: cargandoKm, error: errorKm, recargar } = useKilometros(
        userCode,
        anioSeleccionado || undefined
    )

    const { data: dataBonos, estaCargando: cargandoBonos, error: errorBonos } = useBonificaciones(
        userCode,
        anioSeleccionado || undefined
    )

    // Seleccionar primer año y mes disponible
    useEffect(() => {
        if (!anioSeleccionado && aniosDisponibles.length > 0) {
            setAnioSeleccionado(aniosDisponibles[0])
        }
    }, [aniosDisponibles, anioSeleccionado])

    useEffect(() => {
        if (!mesSeleccionado && mesesDisponibles.length > 0) {
            setMesSeleccionado(mesesDisponibles[mesesDisponibles.length - 1])
        }
    }, [mesesDisponibles, mesSeleccionado])

    // Procesar datos anuales para gráfico
    const datosAnuales = useMemo(() => {
        if (!dataKm?.monthlyData || !anioSeleccionado) return []

        const datosProcesados = []
        for (let month = 1; month <= 12; month++) {
            const datosKmMes = dataKm.monthlyData.find(
                (item: any) => item.month === month && item.year === anioSeleccionado
            )
            if (datosKmMes) {
                let porcentajeBono = 0
                const bonoBase = obtenerBonoBaseAnual(anioSeleccionado)

                const datosBonoMes = dataBonos?.monthlyBonusData?.find(
                    (item: any) => item.month === month && item.year === anioSeleccionado
                )

                if (datosBonoMes && bonoBase > 0) {
                    let bonoFinalParaCalc = bonoBase
                    if (datosBonoMes.finalValue !== undefined) {
                        bonoFinalParaCalc = datosBonoMes.finalValue
                    } else if (datosBonoMes.finalBonus !== undefined) {
                        bonoFinalParaCalc = datosBonoMes.finalBonus
                    }
                    porcentajeBono = Number(((bonoFinalParaCalc / bonoBase) * 100).toFixed(1))
                } else if (datosBonoMes) {
                    porcentajeBono = datosBonoMes.finalValue > 0 ? 100 : 0
                }

                let bonoFinal = bonoBase
                if (datosBonoMes?.finalValue !== undefined) {
                    bonoFinal = datosBonoMes.finalValue
                } else if (datosBonoMes?.finalBonus !== undefined) {
                    bonoFinal = datosBonoMes.finalBonus
                }

                datosProcesados.push({
                    month,
                    valor_ejecucion: datosKmMes.valor_ejecucion,
                    valor_programacion: datosKmMes.valor_programacion,
                    bonusPercentage: porcentajeBono,
                    baseBonus: bonoBase,
                    finalBonus: bonoFinal
                })
            }
        }
        return datosProcesados
    }, [dataKm?.monthlyData, dataBonos?.monthlyBonusData, anioSeleccionado])

    // Calcular rendimiento mensual combinado
    const datosMensuales = useMemo(() => {
        if (!dataKm || !dataBonos || !anioSeleccionado || !mesSeleccionado) return null

        const datosKmMes = dataKm.monthlyData?.find(
            (item: any) => item.year === anioSeleccionado && item.month === mesSeleccionado
        )

        let datosBonoMes = dataBonos?.monthlyBonusData?.find(
            (item: any) => item.year === anioSeleccionado && item.month === mesSeleccionado
        )

        if (!datosBonoMes && dataBonos?.bonusData) {
            datosBonoMes = {
                year: anioSeleccionado,
                month: mesSeleccionado,
                bonusValue: dataBonos.summary?.baseBonus || obtenerBonoBaseAnual(anioSeleccionado),
                baseBonus: dataBonos.summary?.baseBonus || obtenerBonoBaseAnual(anioSeleccionado),
                finalValue: dataBonos.summary?.finalBonus,
                finalBonus: dataBonos.summary?.finalBonus,
                deductionAmount: dataBonos.summary?.totalDeduction || 0,
            }
        }

        if (!datosKmMes && !datosBonoMes) return null

        const porcentajeKm = datosKmMes?.percentage || 0

        let bonoBase = datosBonoMes?.bonusValue || datosBonoMes?.baseBonus || 0
        if (!bonoBase && anioSeleccionado) {
            bonoBase = obtenerBonoBaseAnual(anioSeleccionado)
        }

        const montoDeduccion = datosBonoMes?.deductionAmount || 0
        const bonoFinal = bonoBase - montoDeduccion
        let porcentajeBono = 0

        if (bonoBase > 0) {
            porcentajeBono = Number(((bonoFinal / bonoBase) * 100).toFixed(1))
        } else if (datosBonoMes) {
            porcentajeBono = 100
        }

        const porcentajeCombinado = Number(((porcentajeKm + porcentajeBono) / 2).toFixed(1))

        return {
            year: anioSeleccionado,
            month: mesSeleccionado,
            monthName: obtenerNombreMes(mesSeleccionado),
            kilometers: {
                executed: datosKmMes?.valor_ejecucion || 0,
                programmed: datosKmMes?.valor_programacion || 0,
                percentage: porcentajeKm,
            },
            bonus: {
                base: bonoBase,
                final: bonoFinal,
                percentage: porcentajeBono,
                deduction: montoDeduccion,
            },
            combinedPercentage: porcentajeCombinado,
        }
    }, [dataKm, dataBonos, anioSeleccionado, mesSeleccionado])

    const handleAnioChange = useCallback((v: string) => {
        setAnioSeleccionado(Number(v))
        setMesSeleccionado(null) // Reset mes al cambiar año
    }, [])

    const handleMesChange = useCallback((v: string) => {
        setMesSeleccionado(Number(v))
    }, [])

    const estaCargando = cargandoDatos || (cargandoKm && !dataKm) || (cargandoBonos && !dataBonos)
    const error = errorKm || errorBonos
    const porcentajeCombinado = datosMensuales?.combinedPercentage || 0

    if (estaCargando) {
        return (
            <Card className="bg-white shadow-sm h-full">
                <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-56 mt-1" />
                </CardHeader>
                <CardContent className="pb-4">
                    <Skeleton className="h-40 w-full mb-4" />
                    <Skeleton className="h-8 w-full mb-4" />
                    <Skeleton className="h-32 w-full mb-4" />
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="bg-white shadow-sm h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                        Error al cargar datos mensuales
                    </CardTitle>
                    <CardDescription>Por favor, inténtalo de nuevo más tarde.</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                    <p className="text-green-600">{error}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={recargar}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reintentar
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-white shadow-sm h-full flex flex-col">
            <CardHeader className="pb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                            <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold text-green-700">
                                Progreso Mensual
                            </CardTitle>
                            <CardDescription className="text-green-600/70">
                                Evolución anual y detalle mensual
                            </CardDescription>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={recargar}
                        disabled={cargandoKm || cargandoBonos}
                        className="h-9 px-3 hover:bg-green-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${cargandoKm || cargandoBonos ? "animate-spin" : ""} text-green-600`} />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4 pb-4">
                {/* Selector de Año */}
                <Select value={anioSeleccionado?.toString() || ""} onValueChange={handleAnioChange}>
                    <SelectTrigger className="w-full h-9 text-sm">
                        <SelectValue placeholder="Seleccionar año para análisis" />
                    </SelectTrigger>
                    <SelectContent>
                        {aniosDisponibles.map((year: number) => (
                            <SelectItem key={year} value={year.toString()}>
                                {year}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Gráfico */}
                <div className="p-3">
                    <div className="text-sm font-medium text-green-700 mb-2">Evolución Anual {anioSeleccionado}</div>
                    <MonthlyPerformanceChart data={datosAnuales} year={anioSeleccionado || new Date().getFullYear()} isLoading={cargandoKm} />
                </div>
            </CardContent>
        </Card>
    )
}

export const TarjetaProgresoMensual = memo(TarjetaProgresoMensualBase)
