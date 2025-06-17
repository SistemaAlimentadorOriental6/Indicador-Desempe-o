import { useMemo } from "react"
import type { PersonaBono } from "@/types/bono-types"
import type { AfectacionProcesada } from "@/types/modal-detalle.types"
import { 
  transformDeductionsToAfectaciones, 
  transformDataToAfectaciones, 
  processExistingAfectaciones 
} from "@/utils/data-transformers"

export const useAfectacionesProcessor = (persona: PersonaBono) => {
  const afectacionesProcesadas = useMemo(() => {
    console.log('useAfectacionesProcessor - Datos recibidos:', JSON.stringify(persona, null, 2))
    
    // Asegurar que afectaciones sea un array
    if (!persona.afectaciones) {
      console.log('useAfectacionesProcessor - No hay afectaciones, inicializando array vacío')
      persona.afectaciones = []
    } else if (!Array.isArray(persona.afectaciones)) {
      console.log('useAfectacionesProcessor - afectaciones no es un array, convirtiendo')
      persona.afectaciones = [persona.afectaciones]
    }
    
    const tieneDeductions = Array.isArray(persona?.deductions) && persona.deductions?.length > 0
    const tieneData = Array.isArray(persona?.data) && persona.data?.length > 0
    
    console.log('useAfectacionesProcessor - Estado de datos:', { 
      tieneDeductions, 
      tieneData, 
      tieneAfectaciones: Array.isArray(persona?.afectaciones) && persona.afectaciones?.length > 0 
    })
    
    // Si tenemos datos de la API, procesarlos
    if (tieneDeductions || tieneData) {
      console.log('useAfectacionesProcessor - Datos de la API detectados')
      
      if (tieneDeductions && persona.deductions) {
        console.log(`useAfectacionesProcessor - Procesando ${persona.deductions.length} deductions...`)
        console.log('useAfectacionesProcessor - Muestra de deductions:', JSON.stringify(persona.deductions.slice(0, 2), null, 2))
        
        // Verificar si las deductions tienen el formato correcto para procesar fechas
        // IMPORTANTE: No modificar las observaciones originales que vienen de la base de datos
        const deductionsConDatos = persona.deductions.map(item => {
          // Asegurar que tengamos fechas en el formato correcto
          if (!item.fechaInicio && item.fecha_inicio_novedad) {
            item.fechaInicio = item.fecha_inicio_novedad;
          }
          if (!item.fechaFin && item.fecha_fin_novedad) {
            item.fechaFin = item.fecha_fin_novedad;
          }
          
          // Log para depurar las observaciones recibidas
          console.log(`Deduction ID ${item.id} - Observaciones originales: "${item.observaciones}", Concepto: "${item.concepto}"`);
          
          return item;
        });
        
        console.log('useAfectacionesProcessor - Deductions con datos normalizados:', JSON.stringify(deductionsConDatos.slice(0, 2), null, 2))
        const afectaciones = transformDeductionsToAfectaciones(deductionsConDatos)
        persona.afectaciones = afectaciones
        return afectaciones
      } else if (tieneData && persona.data) {
        console.log(`useAfectacionesProcessor - Procesando ${persona.data.length} data items...`)
        console.log('useAfectacionesProcessor - Muestra de data:', JSON.stringify(persona.data.slice(0, 2), null, 2))
        const afectaciones = transformDataToAfectaciones(persona.data)
        persona.afectaciones = afectaciones
        return afectaciones
      }
    }
    
    // Procesar afectaciones existentes
    if (!Array.isArray(persona.afectaciones)) {
      console.warn('useAfectacionesProcessor - persona.afectaciones no es un array')
      return []
    }
    
    console.log(`useAfectacionesProcessor - Procesando ${persona.afectaciones.length} afectaciones existentes...`)
    console.log('useAfectacionesProcessor - Muestra de afectaciones:', JSON.stringify(persona.afectaciones.slice(0, 2), null, 2))
    
    const afectaciones = processExistingAfectaciones(persona.afectaciones)
    persona.afectaciones = afectaciones
    return afectaciones
  }, [persona])
  
  const estadisticas = useMemo(() => {
    const totalDescargos = afectacionesProcesadas.filter(a => a.tipoIcono === "descargo").length
    const totalIncapacidades = afectacionesProcesadas.filter(a => a.tipoIcono === "incapacidad").length
    const totalSuspensiones = afectacionesProcesadas.filter(a => a.tipoIcono === "suspension").length
    const totalDias = afectacionesProcesadas.reduce((sum, a) => sum + (a.cantidadDias || 0), 0)
    
    return {
      totalDescargos,
      totalIncapacidades,
      totalSuspensiones,
      totalDias
    }
  }, [afectacionesProcesadas])
  
  return {
    afectacionesProcesadas,
    estadisticas
  }
}
