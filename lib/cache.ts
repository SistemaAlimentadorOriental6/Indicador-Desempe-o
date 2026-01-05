// Sistema de caché híbrido: Redis + fallback en memoria
import RedisCache, { CACHE_TTL } from './redis-cache';
import { getCacheManager } from './cache-manager';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  compressed: boolean;
}

// Configuración de caché con TTLs ajustados para Redis (en segundos)
const cacheConfigs = {
  default: {
    ttl: CACHE_TTL.SHORT, // 15 minutos por defecto
    compress: true
  },
  users: {
    ttl: CACHE_TTL.WEEKLY, // 7 días para usuarios (como solicitado)
    compress: false
  },
  statistics: {
    ttl: CACHE_TTL.SHORT, // 15 minutos para estadísticas
    compress: true
  },
  bonuses: {
    ttl: CACHE_TTL.WEEKLY, // 7 días para bonos (como solicitado)
    compress: true
  },
  kilometers: {
    ttl: CACHE_TTL.WEEKLY, // 7 días para kilómetros (como solicitado)
    compress: true
  }
};

// Función para comprimir datos grandes (mantenida para compatibilidad)
function compressData(data: any): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error al comprimir datos:', error);
    return JSON.stringify({ error: 'Compression failed' });
  }
}

// Función para descomprimir datos
function decompressData(compressedData: string): any {
  try {
    return JSON.parse(compressedData);
  } catch (error) {
    console.error('Error al descomprimir datos:', error);
    return null;
  }
}

// Función para generar claves de caché inteligentes
function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');

  return `${prefix}:${sortedParams}`;
}

// Función para obtener configuración específica
function getConfigForType(type: string) {
  return cacheConfigs[type as keyof typeof cacheConfigs] || cacheConfigs.default;
}

// Clase de caché optimizado nativo
export class OptimizedCache {
  private cache: Map<string, CacheEntry>;
  private hitCount: number = 0;
  private missCount: number = 0;
  private compressionEnabled: boolean = true;
  private maxSize: number = 500;
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Constantes TTL para compatibilidad con servicios
  public readonly TTL = {
    SHORT: 300, // 5 minutos en segundos
    DEFAULT: 900, // 15 minutos en segundos
    LONG: 1800, // 30 minutos en segundos
  };

  constructor() {
    this.cache = new Map();
    this.startCleanupInterval();
  }

  // Iniciar limpieza automática de elementos expirados
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Limpiar cada minuto
  }

  // Limpiar elementos expirados
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    // Si el caché está muy lleno, eliminar elementos más antiguos
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toDelete = entries.slice(0, this.cache.size - this.maxSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Generar clave de caché específica para datos de usuario
  getUserDataKey(userCode: string, dataType: string, params?: Record<string, any>): string {
    const baseKey = `user:${userCode}:${dataType}`;
    if (params && Object.keys(params).length > 0) {
      return generateCacheKey(baseKey, params);
    }
    return baseKey;
  }

  // Obtener datos del caché
  get(key: string): any {
    const entry = this.cache.get(key);

    if (entry) {
      const now = Date.now();

      // Verificar si el elemento ha expirado
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.missCount++;
        return undefined;
      }

      this.hitCount++;

      // Si los datos están comprimidos, descomprimirlos
      if (entry.compressed) {
        return decompressData(entry.data);
      }

      return entry.data;
    }

    this.missCount++;
    return undefined;
  }

  // Guardar datos en el caché
  set(key: string, value: any, ttlSeconds?: number, type: string = 'default'): boolean {
    try {
      const config = getConfigForType(type);
      const ttl = ttlSeconds ? ttlSeconds * 1000 : config.ttl;

      let dataToStore = value;
      let compressed = false;

      // Comprimir datos grandes si está habilitado
      if (config.compress && this.compressionEnabled) {
        const serialized = JSON.stringify(value);
        if (serialized.length > 1024) { // Comprimir si es mayor a 1KB
          dataToStore = compressData(value);
          compressed = true;
        }
      }

      const entry: CacheEntry = {
        data: dataToStore,
        timestamp: Date.now(),
        ttl,
        compressed
      };

      this.cache.set(key, entry);

      // Limpiar si el caché está lleno
      if (this.cache.size > this.maxSize) {
        this.cleanup();
      }

      return true;
    } catch (error) {
      console.error('Error al guardar en caché:', error);
      return false;
    }
  }

  // Método getOrSet para obtener datos o ejecutar función si no existe
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds?: number,
    type: string = 'default'
  ): Promise<T> {
    // Intentar obtener del caché primero
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Si no está en caché, ejecutar la función fetcher
    try {
      const result = await fetcher();

      // Guardar en caché el resultado
      this.set(key, result, ttlSeconds, type);

      return result;
    } catch (error) {
      console.error('Error en getOrSet:', error);
      throw error;
    }
  }

  // Verificar si existe una clave
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Eliminar una clave específica
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Limpiar todo el caché
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  // Limpiar caché por patrón
  clearByPattern(pattern: string): number {
    let deletedCount = 0;
    const keys = Array.from(this.cache.keys());

    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        deletedCount++;
      }
    });

    return deletedCount;
  }

  // Obtener estadísticas del caché
  getStats() {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? (this.hitCount / total) * 100 : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: this.getMemoryUsage()
    };
  }

  // Estimar uso de memoria
  private getMemoryUsage(): string {
    try {
      let totalSize = 0;

      for (const [key, entry] of this.cache.entries()) {
        totalSize += JSON.stringify(entry).length;
        totalSize += key.length;
      }

      if (totalSize < 1024) {
        return `${totalSize} bytes`;
      } else if (totalSize < 1024 * 1024) {
        return `${Math.round(totalSize / 1024)} KB`;
      } else {
        return `${Math.round(totalSize / (1024 * 1024))} MB`;
      }
    } catch (error) {
      return 'Unknown';
    }
  }

  // Método para invalidar caché relacionado
  invalidateRelated(pattern: string): void {
    this.clearByPattern(pattern);
  }

  // Método para pre-calentar el caché
  async warmup(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    const promises = keys.map(async (key) => {
      if (!this.has(key)) {
        try {
          const data = await fetcher(key);
          this.set(key, data);
        } catch (error) {
          console.error(`Error al pre-calentar caché para ${key}:`, error);
        }
      }
    });

    await Promise.all(promises);
  }

  // Método para obtener múltiples claves
  getMultiple(keys: string[]): Record<string, any> {
    const result: Record<string, any> = {};

    keys.forEach(key => {
      const value = this.get(key);
      if (value !== undefined) {
        result[key] = value;
      }
    });

    return result;
  }

  // Método para establecer múltiples claves
  setMultiple(data: Record<string, any>, ttlSeconds?: number, type: string = 'default'): void {
    Object.entries(data).forEach(([key, value]) => {
      this.set(key, value, ttlSeconds, type);
    });
  }

  // Destructor para limpiar el interval
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }

  // Invalidar caché relacionado con un usuario específico
  invalidateUserCache(userCode: string): void {
    const pattern = `user:${userCode}:`;
    this.clearByPattern(pattern);
  }
}

// Crear instancia global del caché optimizado (fallback)
export const optimizedCache = new OptimizedCache();

// Helper para obtener el caché híbrido configurado (Redis + fallback)
export const getCache = () => getCacheManager();

// Interfaces para tipado
export interface CacheStats {
  keys: number
  hits: number
  misses: number
} 