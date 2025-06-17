/**
 * Implementación simple de caché en memoria para el servidor
 */

interface CacheItem {
  value: any;
  expiry: number | null;
}

class ServerCache {
  private cache: Map<string, CacheItem>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Obtiene un valor de la caché
   * @param key Clave para buscar
   * @returns El valor almacenado o undefined si no existe o expiró
   */
  get(key: string): any {
    const item = this.cache.get(key);
    
    // Si no existe el item, retornar undefined
    if (!item) return undefined;
    
    // Si tiene tiempo de expiración y ya expiró, eliminarlo y retornar undefined
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  /**
   * Almacena un valor en la caché
   * @param key Clave para almacenar
   * @param value Valor a almacenar
   * @param ttlSeconds Tiempo de vida en segundos (opcional)
   */
  set(key: string, value: any, ttlSeconds?: number): void {
    const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Elimina un valor de la caché
   * @param key Clave a eliminar
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpia toda la caché
   */
  clear(): void {
    this.cache.clear();
  }
}

// Exportar una única instancia para toda la aplicación
export const cache = new ServerCache();
