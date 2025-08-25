import { getDatabase } from '../database'
import { getCache } from '../cache'
import { DEDUCTION_RULES } from '../deductions-config'

export interface FaultRecord {
  codigo: string
  descripcion: string
  years: { [year: number]: number }
}

export interface FaultsData {
  data: FaultRecord[]
  availableYears: number[]
  totalByYear: { [year: number]: number }
}

class FaultsService {
  private static instance: FaultsService
  private db = getDatabase()
  private cache = getCache()

  private constructor() {}

  public static getInstance(): FaultsService {
    if (!FaultsService.instance) {
      FaultsService.instance = new FaultsService()
    }
    return FaultsService.instance
  }

  // Obtener Novedades para un usuario específico
  async getUserFaults(params: {
    userCode: string
    year?: number
  }): Promise<FaultsData> {
    // Generar clave de caché
    const cacheKey = this.cache.getUserDataKey(params.userCode, 'faults', {
      year: params.year || 'all',
    })

    // Intentar obtener de caché
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Si no está en caché, obtener de base de datos
    const result = await this.fetchFaultsFromDB(params)

    // Guardar en caché
    await this.cache.set(cacheKey, result, this.cache.TTL.DEFAULT)

    return result
  }

  // Obtener datos de Novedades de la base de datos
  private async fetchFaultsFromDB(params: {
    userCode: string
    year?: number
  }): Promise<FaultsData> {
    // Construir consulta para obtener Novedades por año
    let query = `
      SELECT 
        codigo_factor,
        YEAR(fecha_inicio_novedad) as year,
        COUNT(*) as count
      FROM novedades
      WHERE codigo_empleado = ?
        AND codigo_factor IN ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13',
          'DL', 'DG', 'DGV', 'DEL', 'DEG', 'DEGV', 'INT', 'OM', 'OMD', 'OG', 'NPF',
          'HCC-L', 'HCC-G', 'HCC-GV')
    `
    
    const queryParams: any[] = [params.userCode]

    // Agregar filtro de año si se especifica
    if (params.year) {
      query += " AND YEAR(fecha_inicio_novedad) = ?"
      queryParams.push(params.year)
    }

    query += `
      GROUP BY codigo_factor, YEAR(fecha_inicio_novedad)
      ORDER BY codigo_factor, year DESC
    `

    // Ejecutar consulta
    const faultsByYear = await this.db.executeQuery<any[]>(query, queryParams)

    // Obtener años disponibles
    const availableYearsQuery = `
      SELECT DISTINCT YEAR(fecha_inicio_novedad) as year
      FROM novedades
      WHERE codigo_empleado = ?
        AND codigo_factor IN ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13',
          'DL', 'DG', 'DGV', 'DEL', 'DEG', 'DEGV', 'INT', 'OM', 'OMD', 'OG', 'NPF',
          'HCC-L', 'HCC-G', 'HCC-GV')
      ORDER BY year DESC
    `
    const availableYears = await this.db.executeQuery<{year: number}[]>(availableYearsQuery, [params.userCode])

    // Procesar datos para crear el formato requerido
    const faultRecords: FaultRecord[] = []
    const totalByYear: { [year: number]: number } = {}

    // Mapeo de códigos a descripciones
    const codeDescriptions: Record<string, string> = DEDUCTION_RULES.reduce((acc, rule) => {
      acc[rule.item] = rule.causa;
      return acc;
    }, {} as Record<string, string>);


    // Agrupar Novedades por código
    const faultsByCode: Record<string, { [year: number]: number }> = {}

    faultsByYear.forEach((fault) => {
      const code = fault.codigo_factor
      const year = fault.year
      const count = fault.count

      if (!faultsByCode[code]) {
        faultsByCode[code] = {}
      }
      faultsByCode[code][year] = count

      // Sumar al total por año
      if (!totalByYear[year]) {
        totalByYear[year] = 0
      }
      totalByYear[year] += count
    })

    // Crear registros de Novedades
    Object.entries(faultsByCode).forEach(([code, years]) => {
      faultRecords.push({
        codigo: code,
        descripcion: codeDescriptions[code] || `Código ${code}`,
        years
      })
    })

    return {
      data: faultRecords,
      availableYears: availableYears.map(y => y.year),
      totalByYear
    }
  }

  // Invalidar caché para un usuario
  async invalidateUserCache(userCode: string): Promise<void> {
    const cacheKey = this.cache.getUserDataKey(userCode, 'faults', {})
    await this.cache.delete(cacheKey)
  }

  // Obtener detalles de Novedades para un usuario, código y año
  async getUserFaultDetails(params: {
    userCode: string
    code: string
    year: number
  }): Promise<Array<{
    id: number
    codigo: string
    descripcion: string
    fechaInicio: string
    fechaFin: string | null
    dias: number
    observaciones: string | null
  }>> {
    const query = `
      SELECT 
        id as id,
        codigo_factor as codigo,
        ? as descripcion,
        fecha_inicio_novedad as fechaInicio,
        fecha_fin_novedad as fechaFin,
        DATEDIFF(IFNULL(fecha_fin_novedad, fecha_inicio_novedad), fecha_inicio_novedad) + 1 as dias,
        observaciones
      FROM novedades
      WHERE codigo_empleado = ?
        AND codigo_factor = ?
        AND YEAR(fecha_inicio_novedad) = ?
      ORDER BY fecha_inicio_novedad ASC
    `
    const codeDescriptions: Record<string, string> = DEDUCTION_RULES.reduce((acc, rule) => {
      acc[rule.item] = rule.causa;
      return acc;
    }, {} as Record<string, string>);
    const descripcion = codeDescriptions[params.code] || params.code
    return this.db.executeQuery(query, [descripcion, params.userCode, params.code, params.year])
  }
}

export const getFaultsService = () => FaultsService.getInstance() 