import { createPool, Pool, PoolConnection } from 'mysql2/promise'

// Configuración del pool de conexiones MySQL optimizada
const mysqlConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
  idleTimeout: 300000,
  maxIdle: 10,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: process.env.DB_SSL === 'true' ? {} : undefined,
  timezone: '+00:00',
}

// Cache para deduplicación de requests
const requestCache = new Map<string, Promise<any>>()
const CACHE_TTL = 5000 // 5 segundos para requests duplicados

class DatabaseService {
  private static instance: DatabaseService
  private mysqlPool: Pool

  private constructor() {
    this.mysqlPool = createPool(mysqlConfig)
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  // Métodos para MySQL con deduplicación
  async executeQuery<T = any[]>(
    query: string,
    params: any[] = [],
    enableCache = false
  ): Promise<T> {
    const cacheKey = enableCache ? `${query}:${JSON.stringify(params)}` : null

    if (cacheKey && requestCache.has(cacheKey)) {
      return await requestCache.get(cacheKey)!
    }

    const queryPromise = this._executeQueryInternal<T>(query, params)

    if (cacheKey) {
      requestCache.set(cacheKey, queryPromise)
      setTimeout(() => {
        requestCache.delete(cacheKey)
      }, CACHE_TTL)
    }

    return await queryPromise
  }

  private async _executeQueryInternal<T = any[]>(
    query: string,
    params: any[] = []
  ): Promise<T> {
    try {
      const [rows] = await this.mysqlPool.execute(query, params)
      return rows as T
    } catch (error) {
      console.error('❌ Error en consulta MySQL:', error)
      throw new DatabaseError('Error en consulta MySQL', error as Error)
    }
  }

  async executeTransaction<T>(
    callback: (connection: any) => Promise<T>
  ): Promise<T> {
    const connection = await this.mysqlPool.getConnection()
    try {
      await connection.beginTransaction()
      const result = await callback(connection)
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  async getPoolConnection(): Promise<PoolConnection> {
    try {
      return await this.mysqlPool.getConnection()
    } catch (error) {
      console.error('❌ Error obteniendo conexión del pool:', error)
      throw new DatabaseError('Error obteniendo conexión del pool', error as Error)
    }
  }

  async executeRankingsQuery<T = any[]>(
    query: string,
    params: any[] = [],
    enableCache = true
  ): Promise<T> {
    const cacheKey = `rankings:${query}:${JSON.stringify(params)}`

    if (enableCache && requestCache.has(cacheKey)) {
      return await requestCache.get(cacheKey)!
    }

    const queryPromise = this._executeQueryInternal<T>(query, params)

    if (enableCache) {
      requestCache.set(cacheKey, queryPromise)
      setTimeout(() => requestCache.delete(cacheKey), CACHE_TTL)
    }

    return await queryPromise
  }

  async executeBonusQuery<T = any[]>(
    query: string,
    params: any[] = [],
    enableCache = true
  ): Promise<T> {
    return await this.executeQuery<T>(query, params, enableCache)
  }

  getPoolStats() {
    return {
      totalConnections: (this.mysqlPool as any)._allConnections?.length || 0,
      activeConnections: (this.mysqlPool as any)._activeConnections?.length || 0,
      idleConnections: (this.mysqlPool as any)._freeConnections?.length || 0,
      cacheSize: requestCache.size
    }
  }

  async healthCheck(): Promise<{ mysql: boolean; poolStats?: any }> {
    const result = { mysql: false, poolStats: this.getPoolStats() }
    try {
      await this.mysqlPool.execute('SELECT 1')
      result.mysql = true
    } catch (error) {
      console.error('❌ Error en health check MySQL:', error)
    }
    return result
  }

  async closeConnections(): Promise<void> {
    try {
      await this.mysqlPool.end()
    } catch (error) {
      console.error('Error al cerrar conexiones:', error)
    }
  }
}

export class DatabaseError extends Error {
  public originalError: Error
  constructor(message: string, originalError: Error) {
    super(message)
    this.name = 'DatabaseError'
    this.originalError = originalError
  }
}

export const getDatabase = () => DatabaseService.getInstance()

export const dbHelpers = {
  async getAvailableYears(table: string, dateColumn: string, whereClause?: string, params: any[] = []): Promise<number[]> {
    const db = getDatabase()
    const query = `
      SELECT DISTINCT YEAR(${dateColumn}) as year 
      FROM ${table}
      ${whereClause ? `WHERE ${whereClause}` : ''}
      ORDER BY year DESC
    `
    const result = await db.executeQuery<Array<{ year: number }>>(query, params)
    return result.map(r => r.year).filter(y => y !== null)
  },
  async getAvailableMonths(table: string, dateColumn: string, whereClause?: string, params: any[] = []): Promise<number[]> {
    const db = getDatabase()
    const query = `
      SELECT DISTINCT MONTH(${dateColumn}) as month 
      FROM ${table}
      ${whereClause ? `WHERE ${whereClause}` : ''}
      ORDER BY month ASC
    `
    const result = await db.executeQuery<Array<{ month: number }>>(query, params)
    return result.map(r => r.month).filter(m => m !== null)
  }
}

export default DatabaseService 