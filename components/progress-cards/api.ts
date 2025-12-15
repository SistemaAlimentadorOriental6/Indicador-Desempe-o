import type { DatosMes } from "./types"
import { obtenerNombreMes } from "./utils"

interface ParametrosConsulta {
    userCode: string
    year?: number
    month?: number
}

/**
 * API para consultas de kilómetros y bonificaciones
 */
export const api = {
    /**
     * Consulta los datos de kilómetros para un usuario
     */
    obtenerKilometros: async ({ userCode, year, month }: ParametrosConsulta) => {
        let url = `/api/user/kilometers?codigo=${userCode}`
        if (year) url += `&year=${year}`
        if (month) url += `&month=${month}`

        const respuesta = await fetch(url)
        if (!respuesta.ok) {
            throw new Error(`Error del servidor: ${respuesta.status}`)
        }

        const datosRespuesta = await respuesta.json()
        if (!datosRespuesta.success) {
            throw new Error(datosRespuesta.error || "Error al cargar los datos")
        }

        const datosApi = datosRespuesta.data || {}
        const datosProcesados = (datosApi.data || []).map((item: DatosMes) => ({
            ...item,
            percentage:
                item.percentage !== undefined
                    ? item.percentage
                    : item.valor_programacion > 0
                        ? Number(((item.valor_ejecucion / item.valor_programacion) * 100).toFixed(1))
                        : 0,
        }))

        return {
            monthlyData: datosProcesados,
            availableYears: datosApi.availableYears || [],
            availableMonths: datosApi.availableMonths || [],
            summary: datosApi.summary || null,
        }
    },

    /**
     * Consulta los datos de bonificaciones para un usuario
     */
    obtenerBonificaciones: async ({ userCode, year, month }: ParametrosConsulta) => {
        let url = `/api/user/bonuses?codigo=${userCode}`
        if (year) url += `&year=${year}`
        if (month) url += `&month=${month}`

        const respuesta = await fetch(url)
        if (!respuesta.ok) {
            throw new Error(`Error del servidor: ${respuesta.status}`)
        }

        const datosRespuesta = await respuesta.json()
        if (!datosRespuesta.success) {
            throw new Error(datosRespuesta.error || "Error al cargar los datos de bonos")
        }

        const data = datosRespuesta.data || {}

        // Si la respuesta es para un solo mes, los datos están directamente en `data`
        if (month && data && !data.availableYears) {
            const datosMes = {
                year: year,
                month: month,
                monthName: obtenerNombreMes(month),
                bonusValue: data.baseBonus,
                deductionAmount: data.deductionAmount,
                finalValue: data.finalBonus,
                ...data,
            }

            return {
                monthlyBonusData: [datosMes],
            }
        }

        const deduccionesFiltradas = data.deductions || []
        const totalDeduccion = deduccionesFiltradas.reduce(
            (sum: number, deduccion: { monto: number }) => sum + deduccion.monto,
            0,
        )
        const bonoBase = data.baseBonus || 130000
        const bonoFinal = deduccionesFiltradas.length === 0 ? bonoBase : bonoBase - totalDeduccion

        return {
            bonusData: {
                availableYears: data.availableYears || [],
                availableMonths: data.availableMonths || [],
                lastMonthData: data.lastMonthData || null,
            },
            monthlyBonusData: data.monthlyBonusData || [],
            summary: {
                baseBonus: bonoBase,
                finalBonus: bonoFinal,
                totalDeduction: totalDeduccion,
                deductions: deduccionesFiltradas,
            },
        }
    },
}
