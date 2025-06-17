/**
 * Normaliza fechas que pueden venir en diferentes formatos
 */
export const normalizarFecha = (fecha: any): string | null => {
    if (!fecha) {
      return null
    }
    
    if (typeof fecha === 'string') {
      // Verificar si es una fecha válida
      const testDate = new Date(fecha)
      if (!isNaN(testDate.getTime())) {
        return fecha
      }
      return fecha // Devolver el string original incluso si no es una fecha válida
    }
    
    if (fecha instanceof Date) {
      return fecha.toISOString()
    }
    
    try {
      return String(fecha)
    } catch (e) {
      return null
    }
  }
  
  /**
 * Formatea una fecha en formato DD/MM/YYYY
 */
export const formatearFecha = (fecha: string | Date | null | undefined): string => {
  if (!fecha) {
    console.log('formatearFecha: fecha es nula o indefinida')
    return 'Sin fecha'
  }

  try {
    console.log('formatearFecha: procesando fecha:', fecha, typeof fecha)
    
    // Si ya está en formato DD/MM/YYYY, devolverla tal cual
    if (typeof fecha === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
      console.log('formatearFecha: ya está en formato DD/MM/YYYY')
      return fecha
    }

    // Convertir a Date si es string
    let fechaObj: Date
    if (typeof fecha === 'string') {
      // Manejar formato ISO con o sin Z
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/.test(fecha)) {
        console.log('formatearFecha: detectada fecha ISO')
        fechaObj = new Date(fecha)
      } else {
        // Intentar otros formatos
        const parts = fecha.split(/[-\/]/);
        if (parts.length === 3) {
          // Determinar si es DD/MM/YYYY o YYYY-MM-DD
          if (parseInt(parts[0]) > 31) {
            // Formato YYYY-MM-DD
            console.log('formatearFecha: detectado formato YYYY-MM-DD')
            fechaObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
          } else {
            // Formato DD/MM/YYYY o DD-MM-YYYY
            console.log('formatearFecha: detectado formato DD/MM/YYYY o DD-MM-YYYY')
            fechaObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
          }
        } else {
          // Intentar como timestamp o fecha simple YYYY-MM-DD
          console.log('formatearFecha: intentando como timestamp o fecha simple')
          if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Formato YYYY-MM-DD sin hora
            const [year, month, day] = fecha.split('-').map(Number)
            fechaObj = new Date(year, month - 1, day)
          } else {
            fechaObj = new Date(fecha)
          }
        }
      }
    } else {
      fechaObj = fecha
    }

    // Verificar si la fecha es válida
    if (isNaN(fechaObj.getTime())) {
      console.log('formatearFecha: fecha inválida')
      return 'Sin fecha'
    }

    // Formatear como DD/MM/YYYY
    const dia = fechaObj.getDate().toString().padStart(2, '0')
    const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0')
    const anio = fechaObj.getFullYear()

    const resultado = `${dia}/${mes}/${anio}`
    console.log('formatearFecha: resultado final:', resultado)
    return resultado
  } catch (error) {
    console.error('Error al formatear fecha:', error)
    return 'Sin fecha'
  }
}
  
  /**
   * Calcula el mes en formato "Mes Año" a partir de una fecha DD/MM/YYYY
   */
  export const calcularMes = (fechaFormateada: string): string => {
    if (fechaFormateada === 'Sin fecha') return 'Sin fecha'
    
    try {
      const [dia, mes, anio] = fechaFormateada.split('/')
      const fecha = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia))
      
      if (isNaN(fecha.getTime())) return 'Sin fecha'
      
      const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ]
      return `${nombresMeses[fecha.getMonth()]} ${fecha.getFullYear()}`
    } catch (error) {
      return 'Sin fecha'
    }
  }
  
  /**
   * Calcula días entre dos fechas DD/MM/YYYY
   */
  export const calcularDias = (fechaInicio: string, fechaFin: string): number => {
    if (fechaInicio === 'Sin fecha' || fechaFin === 'Sin fecha') return 0
    
    try {
      const [diaInicio, mesInicio, anioInicio] = fechaInicio.split('/')
      const [diaFin, mesFin, anioFin] = fechaFin.split('/')
      
      const inicio = new Date(parseInt(anioInicio), parseInt(mesInicio) - 1, parseInt(diaInicio))
      const fin = new Date(parseInt(anioFin), parseInt(mesFin) - 1, parseInt(diaFin))
      
      if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return 0
      
      const diferencia = fin.getTime() - inicio.getTime()
      return Math.round(diferencia / (1000 * 60 * 60 * 24)) + 1
    } catch (error) {
      return 0
    }
  }
  