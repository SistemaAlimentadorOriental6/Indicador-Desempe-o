import { withErrorHandling, apiResponse, QueryValidator, commonParams } from '@/lib/api-helpers'
import { getDatabase } from '@/lib/database'
import { getCache } from '@/lib/cache'

interface AdminStatistics {
  totalUsers: number
  activeUsers: number
  totalKilometers: number
  averageKilometers: number
}

async function handleGet(request: Request) {
  const { searchParams } = new URL(request.url)
  
  // Validar parámetros opcionales
  const validator = new QueryValidator(searchParams)
  validator
    .optionalNumber('month', 'Mes')
    .optionalNumber('year', 'Año')
  
  validator.throwIfErrors()

  // Extraer parámetros con valores por defecto
  const { year, month } = commonParams.getDateFilters(searchParams)
  const currentDate = new Date()
  const targetYear = year || currentDate.getFullYear()
  const targetMonth = month || (currentDate.getMonth() + 1)

  console.log(`[Admin Stats] Solicitud para año: ${targetYear}, mes: ${targetMonth}`)

  // Obtener servicios
  const db = getDatabase()
  const cache = getCache()

  // Generar clave de caché
  const cacheKey = cache.getAdminDataKey('statistics', {
    year: targetYear,
    month: targetMonth,
  })

  try {
    // Intentar obtener de caché primero
    const cached = await cache.get<AdminStatistics>(cacheKey)
    if (cached) {
      console.log('[Admin Stats] Datos obtenidos de caché')
      return apiResponse.success({
        statistics: cached,
        fromCache: true,
      })
    }

    console.log('[Admin Stats] Obteniendo datos de base de datos...')

    // Ejecutar todas las consultas en paralelo para mejor rendimiento
    const [totalUsersResult, activeUsersResult, kilometersResult] = await Promise.all([
      // Total de usuarios
      db.executeQuery<Array<{ total: number }>>('SELECT COUNT(*) as total FROM operadores_sao6'),
      
      // Usuarios activos (con kilómetros en el mes seleccionado)
      db.executeQuery<Array<{ active: number }>>(`
        SELECT COUNT(DISTINCT codigo_empleado) as active
        FROM variables_control
        WHERE codigo_variable = 'KMS'
        AND MONTH(fecha_inicio_programacion) = ?
        AND YEAR(fecha_inicio_programacion) = ?
        AND valor_ejecucion > 0
      `, [targetMonth, targetYear]),
      
      // Total de kilómetros
      db.executeQuery<Array<{ total: number }>>(`
        SELECT SUM(valor_ejecucion) as total
        FROM variables_control
        WHERE codigo_variable = 'KMS'
        AND MONTH(fecha_inicio_programacion) = ?
        AND YEAR(fecha_inicio_programacion) = ?
      `, [targetMonth, targetYear])
    ])

    // Procesar resultados con valores por defecto
    const totalUsers = totalUsersResult[0]?.total || 0
    const activeUsers = activeUsersResult[0]?.active || 0
    const totalKilometers = kilometersResult[0]?.total || 0
    const averageKilometers = activeUsers > 0 ? Math.round(totalKilometers / activeUsers) : 0

    const statistics: AdminStatistics = {
      totalUsers,
      activeUsers,
      totalKilometers,
      averageKilometers,
    }

    console.log('[Admin Stats] Estadísticas calculadas:', statistics)

    // Guardar en caché por 5 minutos
    await cache.set(cacheKey, statistics, cache.TTL.DEFAULT)

    // Respuesta exitosa
    return apiResponse.success({
      statistics,
      fromCache: false,
      period: {
        year: targetYear,
        month: targetMonth,
        monthName: new Date(targetYear, targetMonth - 1).toLocaleDateString('es-ES', { month: 'long' }),
      },
    })

  } catch (error) {
    console.error('[Admin Stats] Error al obtener estadísticas:', error)
    throw error // Se manejará en withErrorHandling
  }
}

// Exportar el handler envuelto con manejo de errores
export const GET = withErrorHandling(handleGet)
