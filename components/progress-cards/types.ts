// Interfaces y tipos para las tarjetas de progreso

export interface DatosAnuales {
    year: number
    kilometers: number
    bonuses: number
    score: number
}

export interface Deduccion {
    id: number
    codigo: string
    concepto: string
    fechaInicio: string
    fechaFin: string | null
    dias: number
    porcentaje: number | string
    monto: number
}

export interface DatosUltimoMes {
    year: number
    month: number
    monthName: string
    bonusValue: number
    deductionAmount: number
    finalValue: number
    isLastAvailableMonth?: boolean
}

export interface DatosBonificacion {
    baseBonus: number | null
    deductionPercentage: number | null
    deductionAmount: number | null
    finalBonus: number | null
    expiresInDays: number | null
    bonusesByYear: Record<string, number> | null
    deductions: Deduccion[] | null
    lastMonthData?: DatosUltimoMes | null
    isLastAvailableMonth?: boolean
    availableYears?: number[]
    availableMonths?: number[]
    summary?: {
        totalProgrammed: number
        totalExecuted: number
        percentage: number
    }
}

export interface DatosMes {
    year: number
    month: number
    monthName: string
    valor_programacion: number
    valor_ejecucion: number
    percentage?: number
    registros?: any[]
}

export interface RespuestaApi {
    success: boolean
    data: DatosMes[]
    summary: {
        totalProgrammed: number
        totalExecuted: number
        percentage: number
    }
    availableYears: number[]
    availableMonths: number[]
    message?: string
    error?: string
}

export interface PropsTarjetasProgreso {
    kilometersData?: {
        total: number
        goal: number
        percentage: number
        isLastAvailableMonth?: boolean
        lastMonthInfo?: {
            year: number
            month: number
            monthName: string
        }
        monthlyData?: DatosMes[]
        availableMonths?: number[]
        availableYears?: number[]
    }
    bonusesData?: {
        available: number
        total: number
        goal: number
        percentage: number
        isLastAvailableMonth?: boolean
        lastMonthInfo?: DatosUltimoMes
        monthlyData?: {
            year: number
            month: number
            monthName: string
            bonusValue: number
            deductionAmount: number
            finalValue: number
        }[]
    }
    userCode?: string
    error?: string
}
