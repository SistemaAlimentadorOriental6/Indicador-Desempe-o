import { createClient, RedisClientType } from 'redis'

// Configuración Redis
const REDIS_CONFIG = {
  host: '192.168.90.33',
  port: 6379,
  password: 'Sao6*2025'
}

// TTL configurations (en segundos)
export const CACHE_TTL = {
  WEEKLY: 7 * 24 * 60 * 60, // 7 días (604800 segundos)
  DAILY: 24 * 60 * 60, // 1 día
  HOURLY: 60 * 60, // 1 hora
  SHORT: 15 * 60 // 15 minutos
}

class RedisCache {
  private static instance: RedisCache
  private client: RedisClientType | null = null
  private isConnected = false

  private constructor() {}

  public static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache
    }
    return RedisCache.instance
  }

  // Inicializar conexión a Redis
  async connect(): Promise<void> {
    if (this.isConnected && this.client?.isOpen) {
      return
    }

    try {
      this.client = createClient({
        socket: {
          host: REDIS_CONFIG.host,
          port: REDIS_CONFIG.port
        },
        password: REDIS_CONFIG.password
      })

      this.client.on('error', (err: Error) => {
        console.error('Redis Client Error:', err)
        this.isConnected = false
      })

      this.client.on('connect', () => {
        console.log('Connected to Redis server')
        this.isConnected = true
      })

      this.client.on('disconnect', () => {
        console.log('Disconnected from Redis server')
        this.isConnected = false
      })

      await this.client.connect()
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      throw error
    }
  }

  // Verificar conexión
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected || !this.client?.isOpen) {
      await this.connect()
    }
  }

  // Obtener valor del cache
  async get<T>(key: string): Promise<T | null> {
    try {
      await this.ensureConnection()
      
      const value = await this.client!.get(key)
      if (!value) return null
      
      return JSON.parse(value) as T
    } catch (error) {
      console.error(`Error getting cache key ${key}:`, error)
      return null
    }
  }

  // Establecer valor en cache con TTL
  async set(key: string, value: any, ttl: number = CACHE_TTL.WEEKLY): Promise<boolean> {
    try {
      await this.ensureConnection()
      
      const serializedValue = JSON.stringify(value)
      await this.client!.setEx(key, ttl, serializedValue)
      
      console.log(`Cache set for key: ${key} with TTL: ${ttl}s`)
      return true
    } catch (error) {
      console.error(`Error setting cache key ${key}:`, error)
      return false
    }
  }

  // Eliminar clave del cache
  async del(key: string): Promise<boolean> {
    try {
      await this.ensureConnection()
      
      const result = await this.client!.del(key)
      return result > 0
    } catch (error) {
      console.error(`Error deleting cache key ${key}:`, error)
      return false
    }
  }

  // Eliminar múltiples claves por patrón
  async delPattern(pattern: string): Promise<number> {
    try {
      await this.ensureConnection()
      
      const keys = await this.client!.keys(pattern)
      if (keys.length === 0) return 0
      
      const result = await this.client!.del(keys)
      console.log(`Deleted ${result} keys matching pattern: ${pattern}`)
      return result
    } catch (error) {
      console.error(`Error deleting cache pattern ${pattern}:`, error)
      return 0
    }
  }

  // Verificar si existe una clave
  async exists(key: string): Promise<boolean> {
    try {
      await this.ensureConnection()
      
      const result = await this.client!.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Error checking cache key ${key}:`, error)
      return false
    }
  }

  // Obtener TTL de una clave
  async ttl(key: string): Promise<number> {
    try {
      await this.ensureConnection()
      
      return await this.client!.ttl(key)
    } catch (error) {
      console.error(`Error getting TTL for key ${key}:`, error)
      return -1
    }
  }

  // Limpiar todo el cache
  async flushAll(): Promise<boolean> {
    try {
      await this.ensureConnection()
      
      await this.client!.flushAll()
      console.log('Cache cleared completely')
      return true
    } catch (error) {
      console.error('Error flushing cache:', error)
      return false
    }
  }

  // Invalidar cache de usuario específico
  async invalidateUserCache(userCode: string): Promise<void> {
    try {
      const patterns = [
        `user:${userCode}:*`,
        `bonuses:${userCode}:*`,
        `kilometers:${userCode}:*`,
        `stats:${userCode}:*`
      ]

      for (const pattern of patterns) {
        await this.delPattern(pattern)
      }

      console.log(`Invalidated cache for user: ${userCode}`)
    } catch (error) {
      console.error(`Error invalidating user cache for ${userCode}:`, error)
    }
  }

  // Cerrar conexión
  async disconnect(): Promise<void> {
    try {
      if (this.client?.isOpen) {
        await this.client.disconnect()
      }
      this.isConnected = false
    } catch (error) {
      console.error('Error disconnecting from Redis:', error)
    }
  }

  // Obtener estadísticas de Redis
  async getStats(): Promise<any> {
    try {
      await this.ensureConnection()
      
      const info = await this.client!.info('memory')
      return {
        connected: this.isConnected,
        memory: info
      }
    } catch (error) {
      console.error('Error getting Redis stats:', error)
      return { connected: false, error: error instanceof Error ? error.message : String(error) }
    }
  }
}

export default RedisCache
