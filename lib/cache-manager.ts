// Sistema de caché híbrido con Redis + fallback a memoria
import RedisCache, { CACHE_TTL } from './redis-cache'
import { OptimizedCache } from './cache'

export class CacheManager {
  private static instance: CacheManager
  private redisCache: RedisCache
  private memoryCache: OptimizedCache

  private constructor() {
    this.redisCache = RedisCache.getInstance()
    this.memoryCache = new OptimizedCache()
    // Ya no inicializamos aquí, dejamos que rediscache maneje su conexión
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  // Constantes TTL para compatibilidad
  public readonly TTL = {
    SHORT: 300,
    DEFAULT: 900,
    LONG: 1800,
    WEEKLY: 604800,
    HOURLY: 3600,
    DAILY: 86400
  }

  // Generar clave de caché para usuario
  getUserDataKey(userCode: string, dataType: string, params?: Record<string, any>): string {
    return this.memoryCache.getUserDataKey(userCode, dataType, params)
  }

  // Generar clave de caché para admin
  getAdminDataKey(dataType: string, params?: Record<string, any>): string {
    const baseKey = `admin:${dataType}`
    if (params && Object.keys(params).length > 0) {
      const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}:${params[key]}`)
        .join('|')
      return `${baseKey}:${sortedParams}`
    }
    return baseKey
  }

  // Obtener datos del cache (Redis primero, memoria como fallback)
  async get<T>(key: string): Promise<T | null> {
    // Intentar Redis siempre, RedisCache maneja su estado interno
    try {
      const result = await this.redisCache.get<T>(key)
      if (result !== null) return result
    } catch (error) {
      // Ignorar error de Redis, ir a memoria
    }

    const result = this.memoryCache.get(key)
    return (result !== undefined) ? result : null
  }

  // Establecer datos en cache (Redis + memoria para redundancia)
  async set(key: string, value: any, ttlSeconds: number = CACHE_TTL.WEEKLY, type: string = 'bonuses'): Promise<boolean> {
    let redisSuccess = false
    try {
      redisSuccess = await this.redisCache.set(key, value, ttlSeconds)
    } catch (error) {
      // Ignorar error de Redis
    }

    const memorySuccess = this.memoryCache.set(key, value, ttlSeconds, type)
    return redisSuccess || memorySuccess
  }

  // Eliminar clave específica
  async del(key: string): Promise<boolean> {
    let redisSuccess = false
    try {
      redisSuccess = await this.redisCache.del(key)
    } catch (error) { }
    const memorySuccess = this.memoryCache.delete(key)
    return redisSuccess || memorySuccess
  }

  // Eliminar por patrón
  async delPattern(pattern: string): Promise<number> {
    let count = 0
    try {
      count += await this.redisCache.delPattern(pattern)
    } catch (error) { }
    count += this.memoryCache.clearByPattern(pattern)
    return count
  }

  // Invalidar cache de usuario
  async invalidateUserCache(userCode: string): Promise<void> {
    const patterns = [
      `user:${userCode}:*`,
      `bonuses:${userCode}:*`,
      `kilometers:${userCode}:*`,
      `stats:${userCode}:*`,
      `faults:${userCode}:*`
    ]

    for (const pattern of patterns) {
      await this.delPattern(pattern)
    }
  }

  // Verificar si existe una clave
  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.redisCache.exists(key)
      if (exists) return true
    } catch (error) { }
    return this.memoryCache.has(key)
  }

  // Método getOrSet para obtener o establecer datos
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = CACHE_TTL.WEEKLY,
    type: string = 'bonuses'
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) return cached

    try {
      const result = await fetcher()
      await this.set(key, result, ttlSeconds, type)
      return result
    } catch (error) {
      console.error('Error in getOrSet:', error)
      throw error
    }
  }

  // Limpiar todo el cache
  async flushAll(): Promise<boolean> {
    let redisSuccess = false
    try {
      redisSuccess = await this.redisCache.flushAll()
    } catch (error) { }
    this.memoryCache.clear()
    return redisSuccess || true
  }

  // Obtener estadísticas
  async getStats(): Promise<any> {
    const redisStats = await this.redisCache.getStats().catch(() => null)
    return {
      redis: { stats: redisStats },
      memory: this.memoryCache.getStats()
    }
  }
}

export function getCacheManager(): CacheManager {
  return CacheManager.getInstance()
}
