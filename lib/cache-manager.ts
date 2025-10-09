// Sistema de caché híbrido con Redis + fallback a memoria
import RedisCache, { CACHE_TTL } from './redis-cache'
import { OptimizedCache } from './cache'

export class CacheManager {
  private static instance: CacheManager
  private redisCache: RedisCache
  private memoryCache: OptimizedCache
  private redisAvailable: boolean = false

  private constructor() {
    this.redisCache = RedisCache.getInstance()
    this.memoryCache = new OptimizedCache()
    this.initializeRedis()
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  // Inicializar Redis de forma asíncrona
  private async initializeRedis(): Promise<void> {
    try {
      await this.redisCache.connect()
      this.redisAvailable = true
      console.log('Redis cache initialized successfully')
    } catch (error) {
      console.warn('Redis not available, using memory cache fallback:', error)
      this.redisAvailable = false
    }
  }

  // Método público para forzar reconexión a Redis
  async reconnectRedis(): Promise<boolean> {
    try {
      await this.redisCache.connect()
      this.redisAvailable = true
      console.log('Redis reconnected successfully')
      return true
    } catch (error) {
      console.warn('Redis reconnection failed:', error)
      this.redisAvailable = false
      return false
    }
  }

  // Obtener datos del cache (Redis primero, memoria como fallback)
  async get<T>(key: string): Promise<T | null> {
    // Intentar Redis primero
    if (this.redisAvailable) {
      try {
        const result = await this.redisCache.get<T>(key)
        if (result !== null) {
          return result
        }
      } catch (error) {
        console.warn(`Redis get failed for key ${key}:`, error)
        this.redisAvailable = false
      }
    }

    // Fallback a memoria
    const result = this.memoryCache.get(key)
    if (result !== undefined) {
      return result
    }

    console.log(`Cache MISS: ${key}`)
    return null
  }

  // Establecer datos en cache (Redis + memoria para redundancia)
  async set(key: string, value: any, ttlSeconds: number = CACHE_TTL.WEEKLY, type: string = 'bonuses'): Promise<boolean> {
    let redisSuccess = false
    let memorySuccess = false

    // Intentar guardar en Redis
    if (this.redisAvailable) {
      try {
        redisSuccess = await this.redisCache.set(key, value, ttlSeconds)
        if (redisSuccess) {
          console.log(`Cache SET (Redis): ${key} with TTL ${ttlSeconds}s`)
        }
      } catch (error) {
        console.warn(`Redis set failed for key ${key}:`, error)
        this.redisAvailable = false
      }
    }

    // Guardar también en memoria como backup
    memorySuccess = this.memoryCache.set(key, value, ttlSeconds, type)
    if (memorySuccess) {
      console.log(`Cache SET (Memory): ${key}`)
    }

    return redisSuccess || memorySuccess
  }

  // Eliminar clave específica
  async del(key: string): Promise<boolean> {
    let redisSuccess = false
    let memorySuccess = false

    // Eliminar de Redis
    if (this.redisAvailable) {
      try {
        redisSuccess = await this.redisCache.del(key)
      } catch (error) {
        console.warn(`Redis del failed for key ${key}:`, error)
        this.redisAvailable = false
      }
    }

    // Eliminar de memoria
    memorySuccess = this.memoryCache.delete(key)

    return redisSuccess || memorySuccess
  }

  // Eliminar por patrón
  async delPattern(pattern: string): Promise<number> {
    let count = 0

    // Eliminar de Redis
    if (this.redisAvailable) {
      try {
        count += await this.redisCache.delPattern(pattern)
      } catch (error) {
        console.warn(`Redis delPattern failed for pattern ${pattern}:`, error)
        this.redisAvailable = false
      }
    }

    // Eliminar de memoria
    count += this.memoryCache.clearByPattern(pattern)

    return count
  }

  // Invalidar cache de usuario
  async invalidateUserCache(userCode: string): Promise<void> {
    const patterns = [
      `user:${userCode}:*`,
      `bonuses:${userCode}:*`, 
      `kilometers:${userCode}:*`,
      `stats:${userCode}:*`
    ]

    for (const pattern of patterns) {
      await this.delPattern(pattern)
    }

    console.log(`Invalidated all cache for user: ${userCode}`)
  }

  // Verificar si existe una clave
  async exists(key: string): Promise<boolean> {
    // Verificar en Redis primero
    if (this.redisAvailable) {
      try {
        const exists = await this.redisCache.exists(key)
        if (exists) return true
      } catch (error) {
        console.warn(`Redis exists failed for key ${key}:`, error)
        this.redisAvailable = false
      }
    }

    // Verificar en memoria
    return this.memoryCache.has(key)
  }

  // Método getOrSet para obtener o establecer datos
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttlSeconds: number = CACHE_TTL.WEEKLY,
    type: string = 'bonuses'
  ): Promise<T> {
    // Intentar obtener del cache
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Si no está en cache, ejecutar fetcher
    try {
      const result = await fetcher()
      
      // Guardar en cache
      await this.set(key, result, ttlSeconds, type)
      
      return result
    } catch (error) {
      console.error('Error in getOrSet:', error)
      throw error
    }
  }

  // Obtener estadísticas del cache
  async getStats(): Promise<any> {
    const redisStats = this.redisAvailable ? await this.redisCache.getStats() : null
    
    return {
      redis: {
        available: this.redisAvailable,
        stats: redisStats
      },
      memory: {
        size: this.memoryCache['cache']?.size || 0,
        hitCount: this.memoryCache['hitCount'] || 0,
        missCount: this.memoryCache['missCount'] || 0
      }
    }
  }

  // Limpiar todo el cache
  async flushAll(): Promise<boolean> {
    let redisSuccess = false
    let memorySuccess = false

    if (this.redisAvailable) {
      try {
        redisSuccess = await this.redisCache.flushAll()
      } catch (error) {
        console.warn('Redis flush failed:', error)
        this.redisAvailable = false
      }
    }

    this.memoryCache.clear()
    memorySuccess = true

    return redisSuccess || memorySuccess
  }
}

// Función para obtener la instancia del cache manager
export function getCacheManager(): CacheManager {
  return CacheManager.getInstance()
}
