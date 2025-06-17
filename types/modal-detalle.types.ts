export interface AfectacionProcesada {
    id: string | number
    fechaInicio: string
    fechaFin: string
    fechaInicioOriginal: string | null
    fechaFinOriginal: string | null
    cantidadDias: number
    novedad: string
    descripcion: string
    porcentajeAfectacion: number
    montoDescuento: number
    estado: 'finalizado' | 'activo' | 'pendiente'
    tipoIcono: 'descargo' | 'incapacidad' | 'suspension'
    mes: string
    falta: string
    codigo: string
  }
  
  export interface DeductionItem {
    id: string | number
    fechaInicio: any
    fechaFin: any
    dias: number
    concepto: string
    porcentaje: string | number
    monto: number
    codigo: string
    fecha_inicio_novedad?: string
    fecha_fin_novedad?: string
    dias_novedad?: number
    descripcion_factor?: string
    valor_novedad?: number
    porcentaje_afectacion?: number
    codigo_factor?: string
    factorCode?: string
    observaciones?: string
  }
  
  export interface DataItem {
    id: string | number
    fecha_inicio_novedad: any
    fecha_fin_novedad: any
    dias_novedad: number
    observaciones: string
    codigo_factor: string
  }
  