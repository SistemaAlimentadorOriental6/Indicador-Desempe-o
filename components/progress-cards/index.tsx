"use client"

import React from "react"

// Importar componentes de tarjetas
import { TarjetaProgresoAnual } from "./annual-progress-card"
import { TarjetaProgresoMensual } from "./monthly-progress-card"
import { TarjetaKilometros } from "./kilometers-card"
import { TarjetaBonificaciones } from "./bonus-card"

// Exportar componentes individuales
export { TarjetaProgresoAnual } from "./annual-progress-card"
export { TarjetaProgresoMensual } from "./monthly-progress-card"
export { TarjetaKilometros } from "./kilometers-card"
export { TarjetaBonificaciones } from "./bonus-card"

// Exportar utilidades
export { api } from "./api"
export {
    registroDebug,
    obtenerNombreMes,
    formatoNumeroSeguro,
    obtenerBonoBaseAnual,
    formatearNumero,
    formatearMoneda
} from "./utils"

// Exportar hooks optimizados
export {
    useKilometros,
    useBonificaciones,
    useDatosDisponibles,
    useContadorAnimado,
    invalidarCacheUsuario,
    limpiarCache
} from "./hooks"

// Exportar tipos
export type {
    DatosAnuales,
    Deduccion,
    DatosUltimoMes,
    DatosBonificacion,
    DatosMes,
    RespuestaApi,
    PropsTarjetasProgreso
} from "./types"

interface PropsTarjetasProgresoOptimizadas {
    userCode: string
}

/**
 * Componente principal que muestra todas las tarjetas de progreso
 */
const TarjetasProgresoOptimizadas: React.FC<PropsTarjetasProgresoOptimizadas> = ({ userCode }) => {
    return (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TarjetaProgresoAnual userCode={userCode} />
                <TarjetaProgresoMensual userCode={userCode} />
                <TarjetaKilometros userCode={userCode} />
                <TarjetaBonificaciones userCode={userCode} />
            </div>
        </div>
    )
}

export default TarjetasProgresoOptimizadas
