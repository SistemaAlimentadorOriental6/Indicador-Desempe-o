import { withErrorHandling, apiResponse, QueryValidator, commonParams } from '@/lib/api-helpers'
import { getFaultsService } from '@/lib/services/faults.service'

async function handleGet(request: Request) {
  const { searchParams } = new URL(request.url)

  // Si se solicitan detalles de una falta específica
  if (searchParams.has('detalle') && searchParams.has('codigo') && searchParams.has('year')) {
    const userCode = commonParams.getUserCode(searchParams)!
    const code = searchParams.get('codigo')!
    const year = parseInt(searchParams.get('year')!)
    const faultsService = getFaultsService()
    const detalles = await faultsService.getUserFaultDetails({ userCode, code, year })
    return apiResponse.success(detalles)
  }

  // Validar parámetros
  const validator = new QueryValidator(searchParams)
  validator
    .required('codigo', 'Código de usuario')
    .optionalNumber('year', 'Año')

  validator.throwIfErrors()

  // Extraer parámetros validados
  const userCode = commonParams.getUserCode(searchParams)!
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined

  console.log(`[Faults] Solicitud para usuario: ${userCode}, año: ${year || 'todos'}`)

  // Obtener servicio de Novedades
  const faultsService = getFaultsService()

  try {
    // Obtener datos usando el servicio
    const result = await faultsService.getUserFaults({
      userCode,
      year,
    })

    console.log(`[Faults] Datos obtenidos: ${result.data.length} tipos de Novedades`)

    // Respuesta exitosa
    return apiResponse.success({
      success: true,
      data: result.data,
      availableYears: result.availableYears,
      totalByYear: result.totalByYear,
    })

  } catch (error) {
    console.error('[Faults] Error al obtener datos:', error)
    throw error // Se manejará en withErrorHandling
  }
}

// Exportar el handler envuelto con manejo de errores
export const GET = withErrorHandling(handleGet) 