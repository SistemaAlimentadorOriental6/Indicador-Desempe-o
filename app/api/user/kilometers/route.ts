
import { NextResponse } from "next/server"
import { createConnection } from "mysql2/promise"
import NodeCache from "node-cache"

const cache = new NodeCache({ stdTTL: 300 }) // 5 minutos de caché

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
}

class DataRepository {
  private connection: any
  
  async connect() {
    if (!this.connection) {
      this.connection = await createConnection(dbConfig)
    }
    return this.connection
  }

  async close() {
    if (this.connection) {
      await this.connection.end()
      this.connection = null
    }
  }

  async getVariables(params: {
    userCode?: string
    year?: number
    month?: number
  }) {
    await this.connect()
    
    let query = `
      SELECT 
        vc.codigo_variable,
        vc.codigo_empleado,
        vc.valor_programacion,
        vc.valor_ejecucion,
        months.month_date,
        YEAR(months.month_date) as year,
        MONTH(months.month_date) as month,
        vc.fecha_inicio_programacion,
        vc.fecha_fin_programacion
      FROM variables_control vc
      JOIN (
        SELECT 
          vc2.codigo_empleado,
          DATE_ADD(vc2.fecha_inicio_programacion, 
            INTERVAL (t4.num*1000 + t3.num*100 + t2.num*10 + t1.num) MONTH
          ) as month_date
        FROM variables_control vc2,
          (SELECT 0 as num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) t1,
          (SELECT 0 as num UNION SELECT 4 UNION SELECT 8) t2,
          (SELECT 0 as num UNION SELECT 6) t3,
          (SELECT 0 as num) t4
        WHERE 
          vc2.codigo_variable = 'KMS'
          AND DATE_ADD(vc2.fecha_inicio_programacion, 
                      INTERVAL (t4.num*1000 + t3.num*100 + t2.num*10 + t1.num) MONTH) 
                      <= COALESCE(vc2.fecha_fin_programacion, CURDATE())
      ) months ON vc.codigo_empleado = months.codigo_empleado
        AND months.month_date BETWEEN 
          vc.fecha_inicio_programacion AND 
          COALESCE(vc.fecha_fin_programacion, CURDATE())
      WHERE vc.codigo_variable = 'KMS'
    `

    const queryParams: any[] = []
    
    if (params.userCode && params.userCode !== 'all') {
      query += " AND vc.codigo_empleado = ?"
      queryParams.push(params.userCode)
    }

    if (params.year) {
      query += " AND YEAR(months.month_date) = ?"
      queryParams.push(params.year)
    }

    if (params.month) {
      query += " AND MONTH(months.month_date) = ?"
      queryParams.push(params.month)
    }

    query += " ORDER BY months.month_date DESC"

    const [rows] = await this.connection.execute(query, queryParams)
    return rows
  }

  async getAvailableYears(userCode?: string) {
    await this.connect()
    const query = `
      SELECT DISTINCT YEAR(fecha_inicio_programacion) as year 
      FROM variables_control
      WHERE codigo_variable = 'KMS'
      ${userCode && userCode !== 'all' ? "AND codigo_empleado = ?" : ""}
      ORDER BY year DESC
    `
    const [rows] = await this.connection.execute(query, userCode && userCode !== 'all' ? [userCode] : [])
    return rows.map((r: any) => r.year).filter((y: number) => y !== null)
  }

  async getAvailableMonths(userCode?: string, year?: number) {
    await this.connect()
    const query = `
      SELECT DISTINCT MONTH(fecha_inicio_programacion) as month 
      FROM variables_control
      WHERE codigo_variable = 'KMS'
      ${userCode && userCode !== 'all' ? "AND codigo_empleado = ?" : ""}
      ${year ? "AND YEAR(fecha_inicio_programacion) = ?" : ""}
      ORDER BY month ASC
    `
    const params = []
    if (userCode && userCode !== 'all') params.push(userCode)
    if (year) params.push(year)
    
    const [rows] = await this.connection.execute(query, params)
    return rows.map((r: any) => r.month).filter((m: number) => m !== null)
  }
}

function processData(rawData: any[]) {
  return rawData.reduce((acc: any, item) => {
    const key = `${item.year}-${String(item.month).padStart(2, "0")}`
    if (!acc[key]) {
      acc[key] = {
        year: item.year,
        month: item.month,
        monthName: getMonthName(item.month),
        valor_programacion: 0,
        valor_ejecucion: 0,
        registros: [],
      }
    }

    acc[key].valor_programacion += Number(item.valor_programacion) || 0
    acc[key].valor_ejecucion += Number(item.valor_ejecucion) || 0
    acc[key].registros.push({
      ...item,
      valor_programacion: Number(item.valor_programacion).toFixed(2),
      valor_ejecucion: Number(item.valor_ejecucion).toFixed(2),
    })

    return acc
  }, {})
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userCode = searchParams.get("codigo")
  const yearParam = searchParams.get("year")
  const monthParam = searchParams.get("month")

  // Validaciones básicas
  if (!userCode) {
    return NextResponse.json(
      { success: false, message: "Código de usuario requerido" },
      { status: 400 }
    )
  }

  const year = yearParam ? parseInt(yearParam) : undefined
  const month = monthParam ? parseInt(monthParam) : undefined

  // Generar clave única para el caché
  const cacheKey = `${userCode}-${year}-${month}`
  const cached = cache.get(cacheKey)
  if (cached) return NextResponse.json(cached)

  const repo = new DataRepository()
  try {
    const [rawData, years, months] = await Promise.all([
      repo.getVariables({ userCode, year, month }),
      repo.getAvailableYears(userCode !== 'all' ? userCode : undefined),
      repo.getAvailableMonths(userCode !== 'all' ? userCode : undefined, year)
    ])

    const processedData = Object.values(processData(rawData))
    
    const totalProgrammed = processedData
      .reduce((sum: number, item: any) => sum + item.valor_programacion, 0)
      .toFixed(2)

    const totalExecuted = processedData
      .reduce((sum: number, item: any) => sum + item.valor_ejecucion, 0)
      .toFixed(2)

    const responseData = {
      success: true,
      data: processedData,
      summary: {
        totalProgrammed,
        totalExecuted,
        percentage: Number(totalProgrammed) > 0 
          ? Math.round((Number(totalExecuted) / Number(totalProgrammed)) * 100)
          : 0
      },
      availableYears: years,
      availableMonths: months
    }

    cache.set(cacheKey, responseData)
    return NextResponse.json(responseData)

  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  } finally {
    await repo.close()
  }
}

function getMonthName(monthNumber: number): string {
  return new Date(2000, monthNumber - 1).toLocaleString('es-ES', { month: 'long' })
}