import { createPool, Pool } from 'mysql2/promise'

// Configuración del pool de conexiones MySQL
const mysqlConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 20, // Aumentado para mejor rendimiento
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  idleTimeout: 300000, // 5 minutos
  // Configuraciones de optimización
  ssl: process.env.DB_SSL === 'true' ? {} : undefined,
  timezone: '+00:00',
}

class DatabaseService {
  private static instance: DatabaseService
  private mysqlPool: Pool

  private constructor() {
    // Inicializar pool de MySQL
    this.mysqlPool = createPool(mysqlConfig)
    
    // Configurar eventos del pool
    this.mysqlPool.on('connection', (connection) => {
      console.log('Nueva conexión MySQL establecida:', connection.threadId)
    })
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  // Métodos para MySQL
  async executeQuery<T = any[]>(
    query: string, 
    params: any[] = []
  ): Promise<T> {
    try {
      const [rows] = await this.mysqlPool.execute(query, params)
      return rows as T
    } catch (error) {
      console.error('Error en consulta MySQL:', error)
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

  // Método para verificar la salud de las conexiones
  async healthCheck(): Promise<{ mysql: boolean }> {
    const result = { mysql: false }

    try {
      await this.mysqlPool.execute('SELECT 1')
      result.mysql = true
    } catch (error) {
      console.error('Error en health check MySQL:', error)
    }

    return result
  }

  // Método para cerrar conexiones (útil para tests o shutdown)
  async closeConnections(): Promise<void> {
    try {
      await this.mysqlPool.end()
      console.log('Conexiones de base de datos cerradas correctamente')
    } catch (error) {
      console.error('Error al cerrar conexiones:', error)
    }
  }
}

// Clase personalizada para errores de base de datos
export class DatabaseError extends Error {
  public originalError: Error

  constructor(message: string, originalError: Error) {
    super(message)
    this.name = 'DatabaseError'
    this.originalError = originalError
  }
}

// Función helper para obtener instancia de la base de datos
export const getDatabase = () => DatabaseService.getInstance()

// Helper para queries comunes
export const dbHelpers = {
  // Obtener años disponibles para una tabla/columna específica
  async getAvailableYears(
    table: string, 
    dateColumn: string, 
    whereClause?: string,
    params: any[] = []
  ): Promise<number[]> {
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

  // Obtener meses disponibles para una tabla/columna específica
  async getAvailableMonths(
    table: string, 
    dateColumn: string, 
    whereClause?: string,
    params: any[] = []
  ): Promise<number[]> {
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