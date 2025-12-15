import { NextRequest } from 'next/server'
import { withErrorHandling, apiResponse, QueryValidator, commonParams, ApiError } from '@/lib/api-helpers'
import { getKilometersService } from '@/lib/services/kilometers.service'
import { getDatabase } from '@/lib/database'

// Interfaces para tipado
interface DatoKilometro {
  codigo_empleado?: string
  'CÓDIGO EMPLEADO'?: string
  codigo_variable?: string
  'CÓDIGO VARIABLE DE CONTROL'?: string
  valor_programacion?: string | number
  'VALOR VAR. PROGRAMACIÓN'?: string | number
  valor_ejecucion?: string | number
  'VALOR VAR. EJECUCIÓN'?: string | number
  fecha_inicio_programacion?: string
  'FECHA INICIO PROGRAMACIÓN (YYYY-MM-DD)'?: string
  fecha_fin_programacion?: string
  'FECHA FIN PROGRAMACIÓN (YYYY-MM-DD)'?: string
  fecha_inicio_ejecucion?: string
  'FECHA INICIO EJECUCIÓN (YYYY-MM-DD)'?: string
  fecha_fin_ejecucion?: string
  'FECHA FIN EJECUCIÓN (YYYY-MM-DD)'?: string
}

interface ResultadoCarga {
  cambios: DatoKilometro[]
  sinCambios: DatoKilometro[]
  errores: { dato: DatoKilometro; motivo: string }[]
}

/**
 * Obtiene el valor de un campo con mapeo flexible de nombres
 */
function obtenerValor(obj: DatoKilometro, claves: string[]): any {
  for (const clave of claves) {
    if (obj[clave as keyof DatoKilometro] !== undefined) {
      return obj[clave as keyof DatoKilometro]
    }
    // Buscar por nombre insensible a mayúsculas
    const claveEncontrada = Object.keys(obj).find(
      k => k.toLowerCase() === clave.toLowerCase()
    )
    if (claveEncontrada) {
      return obj[claveEncontrada as keyof DatoKilometro]
    }
  }
  return undefined
}

/**
 * Valida y parsea una fecha
 */
function parsearFecha(valor: string | undefined): string | null {
  if (!valor) return null

  // Intentar parsear varios formatos
  const fecha = new Date(valor)
  if (isNaN(fecha.getTime())) return null

  // Retornar en formato YYYY-MM-DD
  return fecha.toISOString().split('T')[0]
}

/**
 * Valida un registro individual de kilómetros
 */
function validarRegistro(dato: DatoKilometro): { valido: boolean; motivo?: string; datos?: any } {
  const codigoEmpleado = obtenerValor(dato, ['codigo_empleado', 'CÓDIGO EMPLEADO'])
  const codigoVariable = obtenerValor(dato, ['codigo_variable', 'CÓDIGO VARIABLE DE CONTROL'])
  const fechaInicioProg = obtenerValor(dato, ['fecha_inicio_programacion', 'FECHA INICIO PROGRAMACIÓN (YYYY-MM-DD)'])
  const fechaFinProg = obtenerValor(dato, ['fecha_fin_programacion', 'FECHA FIN PROGRAMACIÓN (YYYY-MM-DD)'])

  // Validar campos obligatorios
  if (!codigoEmpleado || !codigoVariable) {
    return { valido: false, motivo: 'Faltan campos obligatorios (código empleado o variable)' }
  }

  if (!fechaInicioProg || !fechaFinProg) {
    return { valido: false, motivo: 'Faltan campos obligatorios (fechas de programación)' }
  }

  // Parsear y validar fechas
  const fechaInicioProgParsed = parsearFecha(fechaInicioProg)
  const fechaFinProgParsed = parsearFecha(fechaFinProg)

  if (!fechaInicioProgParsed || !fechaFinProgParsed) {
    return { valido: false, motivo: 'Formato de fecha inválido' }
  }

  // Parsear valores numéricos
  const valorProgramacion = parseFloat(
    obtenerValor(dato, ['valor_programacion', 'VALOR VAR. PROGRAMACIÓN']) || '0'
  )
  const valorEjecucion = parseFloat(
    obtenerValor(dato, ['valor_ejecucion', 'VALOR VAR. EJECUCIÓN']) || '0'
  )

  return {
    valido: true,
    datos: {
      codigo_empleado: codigoEmpleado,
      codigo_variable: codigoVariable,
      valor_programacion: isNaN(valorProgramacion) ? 0 : valorProgramacion,
      valor_ejecucion: isNaN(valorEjecucion) ? 0 : valorEjecucion,
      fecha_inicio_programacion: fechaInicioProgParsed,
      fecha_fin_programacion: fechaFinProgParsed,
      fecha_inicio_ejecucion: parsearFecha(
        obtenerValor(dato, ['fecha_inicio_ejecucion', 'FECHA INICIO EJECUCIÓN (YYYY-MM-DD)'])
      ),
      fecha_fin_ejecucion: parsearFecha(
        obtenerValor(dato, ['fecha_fin_ejecucion', 'FECHA FIN EJECUCIÓN (YYYY-MM-DD)'])
      ),
    }
  }
}

/**
 * GET - Obtener datos agregados de kilómetros (para panel admin)
 */
async function handleGet(request: Request) {
  const { searchParams } = new URL(request.url)

  // Validar parámetros opcionales
  const validator = new QueryValidator(searchParams)
  validator
    .optionalNumber('year', 'Año')
    .optionalNumber('month', 'Mes')
    .optionalNumber('limit', 'Límite')

  validator.throwIfErrors()

  // Extraer parámetros
  const { year, month } = commonParams.getDateFilters(searchParams)
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

  console.log(`[Admin Kilómetros] GET - año: ${year || 'todos'}, mes: ${month || 'todos'}`)

  // Usar el servicio de kilómetros para datos agregados
  const kilometrosService = getKilometersService()
  const datos = await kilometrosService.getAggregatedKilometers({ year, month, limit })

  return apiResponse.success({
    data: datos.data,
    summary: datos.summary,
    availableYears: datos.availableYears,
    availableMonths: datos.availableMonths,
  })
}

/**
 * POST - Carga masiva de kilómetros
 */
async function handlePost(request: Request) {
  const body = await request.json()
  const datos = body.kilometros as DatoKilometro[]
  const preview = body.preview !== false // Por defecto es preview

  // Validar que los datos sean un array
  if (!Array.isArray(datos)) {
    throw new ApiError('El campo "kilometros" debe ser un array de datos', 400)
  }

  if (datos.length === 0) {
    throw new ApiError('No se proporcionaron datos para cargar', 400)
  }

  console.log(`[Admin Kilómetros] POST - ${datos.length} registros, preview: ${preview}`)

  const resultado: ResultadoCarga = {
    cambios: [],
    sinCambios: [],
    errores: [],
  }

  // Validar todos los registros primero
  const registrosValidos: any[] = []

  for (const dato of datos) {
    const validacion = validarRegistro(dato)

    if (!validacion.valido) {
      resultado.errores.push({ dato, motivo: validacion.motivo! })
    } else {
      registrosValidos.push(validacion.datos)
    }
  }

  // Si es solo preview, retornar validación sin guardar
  if (preview) {
    return apiResponse.success({
      cambios: registrosValidos,
      sinCambios: resultado.sinCambios,
      errores: resultado.errores,
      resumen: {
        total: datos.length,
        validos: registrosValidos.length,
        errores: resultado.errores.length,
      },
      preview: true,
    }, 'Vista previa generada correctamente')
  }

  // Guardar registros válidos en la base de datos
  const db = getDatabase()
  let guardados = 0

  for (const registro of registrosValidos) {
    try {
      await db.executeQuery(
        `INSERT INTO variables_control 
          (codigo_empleado, codigo_variable, valor_programacion, valor_ejecucion, 
           fecha_inicio_programacion, fecha_fin_programacion, 
           fecha_inicio_ejecucion, fecha_fin_ejecucion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           valor_programacion = VALUES(valor_programacion),
           valor_ejecucion = VALUES(valor_ejecucion),
           fecha_inicio_ejecucion = VALUES(fecha_inicio_ejecucion),
           fecha_fin_ejecucion = VALUES(fecha_fin_ejecucion)`,
        [
          registro.codigo_empleado,
          registro.codigo_variable,
          registro.valor_programacion,
          registro.valor_ejecucion,
          registro.fecha_inicio_programacion,
          registro.fecha_fin_programacion,
          registro.fecha_inicio_ejecucion,
          registro.fecha_fin_ejecucion,
        ]
      )

      resultado.cambios.push(registro)
      guardados++
    } catch (error) {
      console.error(`[Admin Kilómetros] Error al guardar registro:`, error)
      resultado.errores.push({
        dato: registro,
        motivo: error instanceof Error ? error.message : 'Error desconocido al guardar',
      })
    }
  }

  // Invalidar caché de kilómetros para los usuarios afectados
  const kilometrosService = getKilometersService()
  const usuariosAfectados = [...new Set(registrosValidos.map(r => r.codigo_empleado))]

  for (const codigo of usuariosAfectados) {
    await kilometrosService.invalidateUserCache(codigo)
  }

  console.log(`[Admin Kilómetros] Guardados: ${guardados}/${registrosValidos.length}`)

  return apiResponse.success({
    cambios: resultado.cambios,
    sinCambios: resultado.sinCambios,
    errores: resultado.errores,
    resumen: {
      total: datos.length,
      guardados,
      errores: resultado.errores.length,
      usuariosAfectados: usuariosAfectados.length,
    },
    preview: false,
  }, `Se guardaron ${guardados} registros correctamente`)
}

// Exportar handlers con manejo de errores
export const GET = withErrorHandling(handleGet)
export const POST = withErrorHandling(handlePost)