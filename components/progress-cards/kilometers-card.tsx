"use client"

import React, { useState, useMemo, useCallback, memo, useEffect } from "react"
import { Car, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { KilometersMonthlyChart } from "../chart-components"

import { useKilometros, useDatosDisponibles } from "./hooks"
import { formatearNumero } from "./utils"
import type { DatosMes } from "./types"

interface PropsTarjetaKilometros {
    userCode: string
}

const TarjetaKilometrosBase: React.FC<PropsTarjetaKilometros> = ({ userCode }) => {
    const [anioSeleccionado, setAnioSeleccionado] = useState<number | null>(null)

    // Obtener años disponibles (con cache compartido)
    const { aniosDisponibles, estaCargando: cargandoAnios } = useDatosDisponibles(userCode)

    // Obtener datos del año seleccionado (con cache y deduplicación)
    const { data, estaCargando, error, recargar } = useKilometros(
        userCode,
        anioSeleccionado || undefined
    )

    // Seleccionar primer año disponible cuando se cargan
    useEffect(() => {
        if (!anioSeleccionado && aniosDisponibles.length > 0) {
            setAnioSeleccionado(aniosDisponibles[0])
        }
    }, [aniosDisponibles, anioSeleccionado])

    const datosMensualesAnio = useMemo(() => {
        if (!data?.monthlyData || !anioSeleccionado) return []
        return data.monthlyData
            .filter((item: DatosMes) => item.year === anioSeleccionado)
            .sort((a: DatosMes, b: DatosMes) => a.month - b.month)
    }, [data?.monthlyData, anioSeleccionado])

    const totalesAnio = useMemo(() => {
        if (!data?.summary) return { ejecutado: 0, programado: 0, porcentaje: 0 }
        return {
            ejecutado: data.summary.totalExecuted,
            programado: data.summary.totalProgrammed,
            porcentaje: data.summary.percentage
        }
    }, [data?.summary])

    const handleAnioChange = useCallback((v: string) => {
        setAnioSeleccionado(Number(v))
    }, [])

    // Mostrar skeleton mientras carga inicialmente
    if (cargandoAnios || (estaCargando && !data)) {
        return (
            <Card className="bg-white shadow-sm h-full">
                <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-40 mt-1" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-32 w-full mb-3" />
                    <Skeleton className="h-16 w-full" />
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
                    <Button variant="outline" size="sm" className="mt-3" onClick={recargar}>
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
                            <Car className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold text-green-700">Kilómetros</CardTitle>
                            <CardDescription className="text-green-600/70 text-xs">Desempeño mensual</CardDescription>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={recargar}
                        className="h-8 px-2 hover:bg-green-50"
                        disabled={estaCargando}
                    >
                        <RefreshCw className={`h-3.5 w-3.5 text-green-600 ${estaCargando ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <Select value={anioSeleccionado?.toString() || ""} onValueChange={handleAnioChange}>
                    <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleccionar Año" />
                    </SelectTrigger>
                    <SelectContent>
                        {aniosDisponibles.map((year: number) => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {anioSeleccionado && datosMensualesAnio.length > 0 && (
                    <div>
                        <div className="text-xs font-medium text-green-700 mb-2">Rendimiento {anioSeleccionado}</div>
                        <KilometersMonthlyChart data={datosMensualesAnio} year={anioSeleccionado} isLoading={false} />
                    </div>
                )}

                <div className="text-center space-y-2">
                    <div>
                        <div className="text-2xl font-bold text-green-700">{formatearNumero(totalesAnio.ejecutado)}</div>
                        <div className="text-xs text-green-600/70">de {formatearNumero(totalesAnio.programado)} km</div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-green-700">Progreso</span>
                        <Badge className="bg-green-100 text-green-700 text-xs">{totalesAnio.porcentaje}%</Badge>
                    </div>
                    <div className="w-full bg-green-100 rounded-full h-1.5">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, totalesAnio.porcentaje)}%` }} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export const TarjetaKilometros = memo(TarjetaKilometrosBase)
