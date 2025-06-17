import { NextResponse } from "next/server"
import { createPool } from "mysql2/promise"
import NodeCache from "node-cache"

const cache = new NodeCache({ stdTTL: 300 }) // 5 minutos de caché

// Verificar que las variables de entorno estén definidas
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  console.error('Variables de entorno de base de datos no configuradas correctamente para kilómetros:', {
    host: process.env.DB_HOST ? 'Definido' : 'No definido',
    user: process.env.DB_USER ? 'Definido' : 'No definido',
    password: process.env.DB_PASSWORD ? 'Definido' : 'No definido',
    database: process.env.DB_NAME ? 'Definido' : 'No definido',
    port: process.env.DB_PORT || '3306 (default)'
  });
}

// Configuración del pool de conexiones
const pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 15,
  idleTimeout: 30000, // 30 segundos de inactividad
  queueLimit: 0,
  // Aumentar el tiempo de espera para la conexión
  connectTimeout: 60000, // 60 segundos
  // Configuración de SSL si es necesario
  ssl: process.env.DB_SSL === 'true' ? {} : undefined
})

class DataRepository {
  // Método genérico para ejecutar consultas
  private async executeQuery<T>(query: string, params: any[] = []): Promise<T> {
    const connection = await pool.getConnection()
    try {
      const [rows] = await connection.execute(query, params)
      return rows as T
    } finally {
      connection.release()
    }
  }

  async getVariables(params: {
    userCode?: string
    year?: number
    month?: number
  }) {
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

    return this.executeQuery<any[]>(query, queryParams)
  }

  async getAvailableYears(userCode?: string) {
    const query = `
      SELECT DISTINCT YEAR(fecha_inicio_programacion) as year 
      FROM variables_control
      WHERE codigo_variable = 'KMS'
      ${userCode && userCode !== 'all' ? "AND codigo_empleado = ?" : ""}
      ORDER BY year DESC
    `
    const result = await this.executeQuery<{ year: number }[]>(
      query, 
      userCode && userCode !== 'all' ? [userCode] : []
    )
    return result.map(r => r.year).filter(y => y !== null)
  }

  async getAvailableMonths(userCode?: string, year?: number) {
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
    
    const result = await this.executeQuery<{ month: number }[]>(query, params)
    return result.map(r => r.month).filter(m => m !== null)
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

  if (!userCode) {
    return NextResponse.json(
      { success: false, message: "Código de usuario requerido" },
      { status: 400 }
    )
  }

  const year = yearParam ? parseInt(yearParam) : undefined
  const month = monthParam ? parseInt(monthParam) : undefined

  console.log(`Solicitud de kilómetros para usuario: ${userCode}, año: ${year || 'todos'}, mes: ${month || 'todos'}`);

  const cacheKey = `${userCode}-${year}-${month}`
  const cached = cache.get(cacheKey)
  if (cached) {
    console.log('Datos obtenidos de caché');
    return NextResponse.json(cached);
  }

  try {
    console.log('Creando repositorio de datos...');
    const repo = new DataRepository();
    
    console.log('Obteniendo datos de kilómetros...');
    const [rawData, years, months] = await Promise.all([
      repo.getVariables({ userCode, year, month }),
      repo.getAvailableYears(userCode !== 'all' ? userCode : undefined),
      repo.getAvailableMonths(userCode !== 'all' ? userCode : undefined, year)
    ]);
    
    console.log(`Datos obtenidos: ${rawData.length} registros, ${years.length} años, ${months.length} meses`);
    
    if (!rawData || rawData.length === 0) {
      console.error('No se encontraron datos de kilómetros para los parámetros especificados');
      return NextResponse.json(
        { 
          success: true, 
          message: 'No se encontraron datos de kilómetros',
          details: `No hay datos para el usuario ${userCode}${year ? `, año ${year}` : ''}${month ? `, mes ${month}` : ''}`,
          data: [],
          summary: {
            totalProgrammed: '0',
            totalExecuted: '0',
            percentage: 0
          },
          availableYears: [],
          availableMonths: []
        }
      )
    }

    console.log('Procesando datos...');
    const processedData = Object.values(processData(rawData));
    console.log(`Datos procesados: ${processedData.length} registros`);
    
    const totalProgrammed = processedData
      .reduce((sum: number, item: any) => sum + item.valor_programacion, 0)
      .toFixed(2);

    const totalExecuted = processedData
      .reduce((sum: number, item: any) => sum + item.valor_ejecucion, 0)
      .toFixed(2);

    console.log(`Totales calculados - Programado: ${totalProgrammed}, Ejecutado: ${totalExecuted}`);

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
    };

    console.log('Guardando datos en caché...');
    cache.set(cacheKey, responseData);
    
    console.log('Enviando respuesta...');
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("Error al obtener datos de kilómetros:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: "Error al obtener datos de kilómetros",
        details: "Verifica la configuración de la base de datos y que las tablas existan",
        connectionInfo: {
          host: process.env.DB_HOST ? `${process.env.DB_HOST.substring(0, 3)}...` : 'No definido',
          database: process.env.DB_NAME || 'No definido',
          port: process.env.DB_PORT || '3306 (default)'
        },
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

function getMonthName(monthNumber: number): string {
  return new Date(2000, monthNumber - 1).toLocaleString('es-ES', { month: 'long' })
}