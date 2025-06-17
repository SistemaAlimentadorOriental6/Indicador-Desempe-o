export interface BonoAfectacion {
    id: number
    fechaInicio: string
    fechaFin: string
    cantidadDias: number
    novedad: string
    descripcion: string
    porcentajeAfectacion: number
    montoDescuento: number
    estado: "activo" | "finalizado" | "suspendido"
    tipoIcono: "descargo" | "incapacidad" | "suspension" | "retardo" | "daño"
    mes: string
    falta: string
    codigo?: string  // Código de afectación (numérico o alfabético) - opcional para compatibilidad con datos existentes
  }
  
  export interface HistorialMensual {
    mes: string
    montoInicial: number
    descuentos: number
    montoFinal: number
    afectaciones: BonoAfectacion[]
  }
  
  // Interfaz para los datos originales de la API
export interface DeductionItem {
    id: number
    codigo: string
    concepto: string
    fechaInicio: string
    fechaFin: string
    dias: number
    porcentaje: string
    monto: number
    // Propiedades adicionales de la API original
    fecha_inicio_novedad?: string
    fecha_fin_novedad?: string
    dias_novedad?: number
    descripcion_factor?: string
    valor_novedad?: number
    porcentaje_afectacion?: number
    codigo_factor?: string
    factorCode?: string
    observaciones?: string // Campo para las observaciones de la novedad
}

export interface DataItem {
    id: number
    fecha_inicio_novedad: string
    fecha_fin_novedad: string
    codigo_empleado: string
    codigo_factor: string
    observaciones: string
    dias_novedad: number
}

export interface PersonaBono {
    id: number
    codigo: string
    nombre: string
    cedula: string
    montoBase: number
    montoActual: number
    totalDescuentosAcumulados: number
    afectaciones: BonoAfectacion[]
    historialMensual: HistorialMensual[]
    ultimaActualizacion: string
    departamento: string
    cargo: string
    eficiencia: number
    foto: string
    // Datos del último mes
    lastMonthData?: {
      finalValue: number
      deductionAmount: number
      bonusValue: number
      year: number
      month: number
      monthName: string
    }
    // Propiedades adicionales de la API
    availableYears?: number[]
    bonusesByYear?: Record<string, number>
    baseBonus?: number
    deductionAmount?: number
    deductionPercentage?: number
    finalBonus?: number
    // Datos originales de la API
    deductions?: DeductionItem[]
    data?: DataItem[]
    summary?: {
      availableBonuses?: number
      totalProgrammed?: number
      totalExecuted?: number
      percentage?: number
      lastMonthFinalValue?: number
    }
  }