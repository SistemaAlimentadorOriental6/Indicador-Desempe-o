import type { DeductionItem, DataItem, AfectacionProcesada } from "@/types/modal-detalle.types"
import { normalizarFecha, formatearFecha, calcularMes, calcularDias } from "./date-utils"
import { getDeductionRule } from '@/lib/deductions-config'

// Mapeo de códigos a tipos de iconos
const mapCodigoToTipoIcono = (codigo: string): "descargo" | "incapacidad" | "suspension" => {
  switch(codigo) {
    case "1":
      return "incapacidad"
    case "7":
    case "8":
      return "suspension"
    default:
      return "descargo"
  }
}

/**
 * Convierte una fecha ISO a formato DD/MM/YYYY directamente
 * Esta función es más simple y directa que formatearFecha
 * Si no puede convertir la fecha, devuelve 'Sin fecha'
 */
const convertirFechaIso = (fechaIso: string | Date | null | undefined): string => {
  console.log('convertirFechaIso - Entrada:', fechaIso, typeof fechaIso)
  
  if (!fechaIso) {
    console.log('convertirFechaIso - Fecha nula o indefinida')
    return 'Sin fecha'
  }
  
  try {
    let fecha: Date;
    
    // Convertir a objeto Date si es string
    if (typeof fechaIso === 'string') {
      fecha = new Date(fechaIso)
    } else if (fechaIso instanceof Date) {
      fecha = fechaIso
    } else {
      console.log('convertirFechaIso - Tipo de fecha no soportado')
      return 'Sin fecha'
    }
    
    // Verificar si la fecha es válida
    if (isNaN(fecha.getTime())) {
      console.log('convertirFechaIso - Fecha inválida')
      return 'Sin fecha'
    }
    
    // Formatear a DD/MM/YYYY
    const dia = fecha.getDate().toString().padStart(2, '0')
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
    const anio = fecha.getFullYear()
    
    const fechaFormateada = `${dia}/${mes}/${anio}`
    console.log('convertirFechaIso - Fecha formateada:', fechaFormateada)
    return fechaFormateada
  } catch (error) {
    console.error('convertirFechaIso - Error al formatear fecha:', error)
    return 'Sin fecha'
  }
}

/**
 * Transforma datos de deductions de la API a formato AfectacionProcesada
 */
export function transformDeductionsToAfectaciones(deductions: DeductionItem[]): AfectacionProcesada[] {
  console.log('Procesando deductions:', JSON.stringify(deductions, null, 2))
  
  // Log para verificar si las deductions tienen el campo observaciones
  deductions.forEach(item => {
    console.log(`Deduction ID ${item.id} - Observaciones: "${item.observaciones}", Concepto: "${item.concepto}"`);
  });
  
  return deductions.map(item => {
    const rule = getDeductionRule(item.codigo || '')
    
    // Asegurarse de que las fechas ISO se procesen correctamente
    console.log('Fecha inicio original:', item.fechaInicio, typeof item.fechaInicio)
    console.log('Fecha fin original:', item.fechaFin, typeof item.fechaFin)
    
    // Verificar si las fechas vienen en formato fecha_inicio_novedad (API original)
    const fechaInicio = item.fecha_inicio_novedad || item.fechaInicio
    const fechaFin = item.fecha_fin_novedad || item.fechaFin
    
    console.log('Fecha inicio después de verificar campos alternativos:', fechaInicio)
    console.log('Fecha fin después de verificar campos alternativos:', fechaFin)
    
    // Usar la función simplificada para convertir fechas ISO
    const fechaInicioFormateada = convertirFechaIso(fechaInicio)
    const fechaFinFormateada = convertirFechaIso(fechaFin)
    
    console.log('Fecha inicio formateada:', fechaInicioFormateada)
    console.log('Fecha fin formateada:', fechaFinFormateada)
    
    // Usar los días proporcionados por la API si están disponibles
    let cantidadDias = item.dias_novedad || item.dias || 0
    if (fechaInicioFormateada !== 'Sin fecha' && fechaFinFormateada !== 'Sin fecha' && !cantidadDias) {
      cantidadDias = calcularDias(fechaInicioFormateada, fechaFinFormateada)
    }
    
    const descripcionMostrar = rule?.causa || item.concepto || 'Sin descripción';
    
    // Log para verificar los valores que estamos procesando
    console.log(`transformDeductionsToAfectaciones - ID ${item.id} - Concepto: "${item.concepto}", Observaciones: "${item.observaciones}", Usando: "${descripcionMostrar}"`);
    
    return {
      id: item.id,
      fechaInicio: fechaInicioFormateada,
      fechaFin: fechaFinFormateada,
      fechaInicioOriginal: fechaInicio,
      fechaFinOriginal: fechaFin,
      cantidadDias,
      novedad: descripcionMostrar,
      descripcion: descripcionMostrar,
      porcentajeAfectacion: (rule && typeof rule.porcentajeRetirar === 'number') ? rule.porcentajeRetirar * 100 : 0,
      montoDescuento: item.monto || rule?.valorActual || 0,
      estado: 'finalizado' as const,
      tipoIcono: mapCodigoToTipoIcono(item.codigo || ''),
      mes: calcularMes(fechaInicioFormateada),
      falta: descripcionMostrar,
      codigo: item.codigo || '',
      afectaDesempeno: rule?.afectaDesempeno ?? false,
    }
  })
}

/**
 * Transforma datos de data de la API a formato AfectacionProcesada
 */
export const transformDataToAfectaciones = (data: DataItem[]): AfectacionProcesada[] => {
  console.log('Procesando data de API:', JSON.stringify(data, null, 2))
  
  return data.map(item => {
    const rule = getDeductionRule(item.codigo_factor || '')

    // Usar directamente las fechas de la API sin normalizar primero
    console.log('Fecha inicio API:', item.fecha_inicio_novedad, typeof item.fecha_inicio_novedad)
    console.log('Fecha fin API:', item.fecha_fin_novedad, typeof item.fecha_fin_novedad)
    
    // Usar la función simplificada para convertir fechas ISO
    const fechaInicioFormateada = convertirFechaIso(item.fecha_inicio_novedad)
    const fechaFinFormateada = convertirFechaIso(item.fecha_fin_novedad)
    
    console.log('Fecha inicio formateada:', fechaInicioFormateada)
    console.log('Fecha fin formateada:', fechaFinFormateada)
    
    // Calcular días solo si ambas fechas son válidas
    let cantidadDias = item.dias_novedad || 0
    if (fechaInicioFormateada !== 'Sin fecha' && fechaFinFormateada !== 'Sin fecha' && !cantidadDias) {
      cantidadDias = calcularDias(fechaInicioFormateada, fechaFinFormateada)
    }
    
    const descripcionMostrar = rule?.causa || item.observaciones || 'Sin observaciones';

    return {
      id: item.id || Math.random().toString(36).substring(7),
      fechaInicio: fechaInicioFormateada,
      fechaFin: fechaFinFormateada,
      fechaInicioOriginal: item.fecha_inicio_novedad,
      fechaFinOriginal: item.fecha_fin_novedad,
      cantidadDias,
      novedad: descripcionMostrar,
      descripcion: descripcionMostrar,
      porcentajeAfectacion: (rule && typeof rule.porcentajeRetirar === 'number') ? rule.porcentajeRetirar * 100 : 0,
      montoDescuento: rule?.valorActual || 0,
      estado: 'finalizado' as const,
      tipoIcono: mapCodigoToTipoIcono(item.codigo_factor || ''),
      mes: calcularMes(fechaInicioFormateada),
      falta: descripcionMostrar,
      codigo: item.codigo_factor || '',
      afectaDesempeno: rule?.afectaDesempeno ?? false,
    }
  })
}

/**
 * Procesa y normaliza afectaciones existentes
 */
export const processExistingAfectaciones = (afectaciones: any[]): AfectacionProcesada[] => {
  console.log('Procesando afectaciones existentes:', JSON.stringify(afectaciones, null, 2))
  
  return afectaciones.map(afectacion => {
    const codigo = afectacion.codigo || afectacion.codigo_factor || ''
    const rule = getDeductionRule(codigo)

    // Determinar fechas según el formato
    const fechaInicioOriginal = afectacion.fechaInicio || afectacion.fecha_inicio_novedad || null
    const fechaFinOriginal = afectacion.fechaFin || afectacion.fecha_fin_novedad || null
    
    console.log('Procesando afectación:', { 
      id: afectacion.id, 
      fechaInicio: fechaInicioOriginal, 
      fechaFin: fechaFinOriginal,
      codigo: afectacion.codigo || afectacion.codigo_factor
    })
    
    // Usar la función simplificada para convertir fechas
    const fechaInicioFormateada = convertirFechaIso(fechaInicioOriginal)
    const fechaFinFormateada = convertirFechaIso(fechaFinOriginal)
    
    console.log('Fechas formateadas:', { fechaInicioFormateada, fechaFinFormateada })
    
    // Calcular días solo si ambas fechas son válidas
    let cantidadDias = afectacion.cantidadDias || afectacion.dias || 0
    if (fechaInicioFormateada !== 'Sin fecha' && fechaFinFormateada !== 'Sin fecha' && !cantidadDias) {
      cantidadDias = calcularDias(fechaInicioFormateada, fechaFinFormateada)
    }
    
    let porcentaje = afectacion.porcentajeAfectacion || 0;
    if (rule && typeof rule.porcentajeRetirar === 'number') {
      porcentaje = rule.porcentajeRetirar * 100;
    }
    
    const descripcion = rule?.causa || afectacion.observaciones || afectacion.concepto || afectacion.descripcion || 'Sin descripción'
    
    // Determinar el tipo de icono basado en el código
    const tipoIcono = afectacion.tipoIcono || mapCodigoToTipoIcono(codigo)
    
    return {
      ...afectacion,
      fechaInicioOriginal: fechaInicioOriginal,
      fechaFinOriginal: fechaFinOriginal,
      fechaInicio: fechaInicioFormateada,
      fechaFin: fechaFinFormateada,
      cantidadDias,
      porcentajeAfectacion: porcentaje,
      montoDescuento: afectacion.montoDescuento || rule?.valorActual || 0,
      mes: calcularMes(fechaInicioFormateada),
      descripcion: descripcion,
      falta: rule?.causa || afectacion.concepto || afectacion.falta || afectacion.novedad || 'Sin clasificar',
      codigo,
      tipoIcono,
      afectaDesempeno: rule?.afectaDesempeno ?? false,
    }
  })
}
