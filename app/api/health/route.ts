import { withErrorHandling, apiResponse } from '@/lib/api-helpers'
import { getDatabase } from '@/lib/database'
import { getCache } from '@/lib/cache'

async function handleGet() {
  const startTime = Date.now()
  
  try {
    // Verificar estado de la base de datos
    const db = getDatabase()
    const dbHealth = await db.healthCheck()
    
    // Verificar estado del caché
    const cache = getCache()
    const cacheStats = cache.getStats()
    
    // Calcular tiempo de respuesta
    const responseTime = Date.now() - startTime
    
    // Verificar variables de entorno críticas
    const envVars = {
      DB_HOST: !!process.env.DB_HOST,
      DB_USER: !!process.env.DB_USER,
      DB_PASSWORD: !!process.env.DB_PASSWORD,
      DB_NAME: !!process.env.DB_NAME,
      NODE_ENV: process.env.NODE_ENV || 'development',
    }
    
    // Estado general del sistema
    const isHealthy = dbHealth.mysql && Object.values(envVars).every(Boolean)
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: {
          mysql: dbHealth.mysql ? 'connected' : 'disconnected',
        },
        cache: {
          status: 'active',
          keys: cacheStats.keys,
          hits: cacheStats.hits,
          misses: cacheStats.misses,
          hitRate: cacheStats.hits > 0 ? 
            `${Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100)}%` : '0%',
        },
        environment: {
          variables: envVars,
          complete: Object.values(envVars).filter(Boolean).length === Object.keys(envVars).length - 1, // -1 for NODE_ENV
        },
      },
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      },
    }
    
    // Usar código de estado apropiado
    if (isHealthy) {
      return apiResponse.success(healthData, 'Sistema funcionando correctamente')
    } else {
      return apiResponse.error('Sistema con problemas', 503, healthData)
    }
    
  } catch (error) {
    console.error('[Health Check] Error:', error)
    
    const errorData = {
      status: 'error',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
    
    return apiResponse.error('Error en health check', 500, errorData)
  }
}

// Exportar el handler
export const GET = withErrorHandling(handleGet) 