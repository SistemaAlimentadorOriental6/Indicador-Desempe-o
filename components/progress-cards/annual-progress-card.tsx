"use client"

import React, { useState, useMemo, useCallback, memo, useEffect } from "react"
import { TrendingUp, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ThreeYearComparisonChart } from "../chart-components"

import { useKilometros, useBonificaciones, useDatosDisponibles } from "./hooks"
import { obtenerBonoBaseAnual } from "./utils"

interface PropsTarjetaProgresoAnual {
    userCode: string
}

const TarjetaProgresoAnualBase: React.FC<PropsTarjetaProgresoAnual> = ({ userCode }) => {
    const [anioSeleccionado, setAnioSeleccionado] = useState<number | null>(null)

    // Obtener años disponibles (con cache compartido)
    const { aniosDisponibles, estaCargando: cargandoAnios } = useDatosDisponibles(userCode)

    // Obtener datos del año seleccionado (con cache y deduplicación)
    const { data: dataKm, estaCargando: cargandoKm, error: errorKm, recargar: recargarKm } = useKilometros(
        userCode,
        anioSeleccionado || undefined
    )

    const { data: dataBonos, estaCargando: cargandoBonos, error: errorBonos } = useBonificaciones(
        userCode,
        anioSeleccionado || undefined
    )

    // Cargar datos de últimos 3 años para la gráfica comparativa
    const anioActual = new Date().getFullYear()
    const aniosComparar = useMemo(() => [anioActual - 3, anioActual - 2, anioActual - 1], [anioActual])

    // Hooks para cada año de comparación (cache evita llamadas duplicadas)
    const { data: dataKm1 } = useKilometros(userCode, aniosComparar[0])
    const { data: dataBonos1 } = useBonificaciones(userCode, aniosComparar[0])
    const { data: dataKm2 } = useKilometros(userCode, aniosComparar[1])
    const { data: dataBonos2 } = useBonificaciones(userCode, aniosComparar[1])
    const { data: dataKm3 } = useKilometros(userCode, aniosComparar[2])
    const { data: dataBonos3 } = useBonificaciones(userCode, aniosComparar[2])

    // Seleccionar primer año disponible cuando se cargan
    useEffect(() => {
        if (!anioSeleccionado && aniosDisponibles.length > 0) {
            setAnioSeleccionado(aniosDisponibles[0])
        }
    }, [aniosDisponibles, anioSeleccionado])

    // Calcular datos de últimos 3 años para gráfica
    const datosUltimosTresAnios = useMemo(() => {
        const procesarAnio = (year: number, dataKmYear: any, dataBonosYear: any) => {
            const datosKmAnio = dataKmYear?.monthlyData?.filter((item: any) => item.year === year) || []
            const totalKmEjecutado = datosKmAnio.reduce((sum: number, item: any) => sum + Number(item.valor_ejecucion || 0), 0)
            const totalKmProgramado = datosKmAnio.reduce((sum: number, item: any) => sum + Number(item.valor_programacion || 0), 0)
            const porcentajeKm = totalKmProgramado > 0 ? Number(((totalKmEjecutado / totalKmProgramado) * 100).toFixed(1)) : 0

            const mesesConDatos = datosKmAnio.length
            const baseParaAnio = obtenerBonoBaseAnual(year)
            const totalBonoBase = baseParaAnio * mesesConDatos
            const totalDeducciones = dataBonosYear?.summary?.totalDeduction || 0
            const totalBonoFinal = totalBonoBase - totalDeducciones
            const porcentajeBono = totalBonoBase > 0 ? Math.min(100, Math.max(0, Number(((totalBonoFinal / totalBonoBase) * 100).toFixed(1)))) : 100

            return {
                year,
                'eficiencia km (%)': porcentajeKm,
                'eficiencia bonus (%)': porcentajeBono,
                'rendimiento general (%)': Number(((porcentajeKm + porcentajeBono) / 2).toFixed(1))
            }
        }

        if (!dataKm1 && !dataKm2 && !dataKm3) return []

        return [
            procesarAnio(aniosComparar[0], dataKm1, dataBonos1),
            procesarAnio(aniosComparar[1], dataKm2, dataBonos2),
            procesarAnio(aniosComparar[2], dataKm3, dataBonos3),
        ]
    }, [aniosComparar, dataKm1, dataBonos1, dataKm2, dataBonos2, dataKm3, dataBonos3])

    // Calcular datos anuales del año seleccionado
    const datosAnuales = useMemo(() => {
        if (!dataKm?.monthlyData || !dataBonos || !anioSeleccionado) return null

        const datosKmAnio = dataKm.monthlyData.filter((item: any) => item.year === anioSeleccionado)
        const totalKmEjecutado = datosKmAnio.reduce((sum: number, item: any) => sum + Number(item.valor_ejecucion || 0), 0)
        const totalKmProgramado = datosKmAnio.reduce((sum: number, item: any) => sum + Number(item.valor_programacion || 0), 0)
        const porcentajeKm = totalKmProgramado > 0 ? Number(((totalKmEjecutado / totalKmProgramado) * 100).toFixed(1)) : 0

        const mesesConDatos = datosKmAnio.length
        const baseParaAnio = obtenerBonoBaseAnual(anioSeleccionado)
        const totalBonoBase = baseParaAnio * mesesConDatos
        const totalDeducciones = dataBonos.summary?.totalDeduction ?? 0
        const totalBonoFinal = totalBonoBase - totalDeducciones
        const porcentajeBono = totalBonoBase > 0 ? Math.min(100, Number(((totalBonoFinal / totalBonoBase) * 100).toFixed(1))) : 100

        return {
            year: anioSeleccionado,
            kilometers: { percentage: porcentajeKm },
            bonus: { percentage: porcentajeBono },
            combinedPercentage: Number(((porcentajeKm + porcentajeBono) / 2).toFixed(1)),
            monthsWithData: mesesConDatos,
        }
    }, [dataKm?.monthlyData, dataBonos, anioSeleccionado])

    const handleAnioChange = useCallback((v: string) => {
        setAnioSeleccionado(Number(v))
    }, [])

    const estaCargando = cargandoAnios || (cargandoKm && !dataKm) || (cargandoBonos && !dataBonos)
    const error = errorKm || errorBonos

    if (estaCargando) {
        return (
            <Card className="bg-white shadow-sm h-full">
                <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-48 mt-1" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-32 w-full mb-3" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="bg-white shadow-sm h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center text-red-600">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Error al cargar
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-green-600 text-sm">{error}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={recargarKm}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reintentar
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-white shadow-sm h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-500 rounded-md">
                            <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold text-green-700">Progreso Anual</CardTitle>
                            <CardDescription className="text-green-600/70 text-xs">Últimos 3 años</CardDescription>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={recargarKm}
                        className="h-8 px-2 hover:bg-green-50"
                        disabled={cargandoKm}
                    >
                        <RefreshCw className={`h-3.5 w-3.5 text-green-600 ${cargandoKm ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <Select value={anioSeleccionado?.toString() || ""} onValueChange={handleAnioChange}>
                    <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                        {aniosDisponibles.map((year: number) => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <ThreeYearComparisonChart
                    data={datosUltimosTresAnios}
                    isLoading={false}
                    currentYearPerformance={datosAnuales?.combinedPercentage}
                />

                <div className="space-y-3">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">{datosAnuales?.combinedPercentage || 0}%</div>
                        <div className="text-xs text-green-600/70">Rendimiento {anioSeleccionado}</div>
                    </div>

                    <div className="space-y-2">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-green-700">Kilómetros</span>
                                <span className="font-medium text-green-700">{datosAnuales?.kilometers.percentage || 0}%</span>
                            </div>
                            <div className="w-full bg-green-100 rounded-full h-1.5">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, datosAnuales?.kilometers.percentage || 0)}%` }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-green-700">Bonificaciones</span>
                                <span className="font-medium text-green-700">{datosAnuales?.bonus.percentage || 0}%</span>
                            </div>
                            <div className="w-full bg-green-100 rounded-full h-1.5">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, datosAnuales?.bonus.percentage || 0)}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-2">
                        <span className="text-xs text-green-600/70">Meses con datos: </span>
                        <span className="text-sm font-medium text-green-700">{datosAnuales?.monthsWithData || 0}/12</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export const TarjetaProgresoAnual = memo(TarjetaProgresoAnualBase)
