import { NextResponse } from "next/server"
import mysql from "mysql2/promise"
import sql from "mssql"

// Configuración para MySQL
const mysqlConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT || "3306"),
}

// Configuración para SQL Server
const sqlServerConfig = {
  user: process.env.SQLSERVER_USER || "power-bi",
  password: process.env.SQLSERVER_PASSWORD || "Z1x2c3v4*",
  server: process.env.SQLSERVER_HOST || "192.168.90.64",
  database: process.env.SQLSERVER_DB || "UNOEE",
  port: Number.parseInt(process.env.SQLSERVER_PORT || "1433"),
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
}


// Caché para almacenar resultados y reducir consultas
const cache = new Map()
const CACHE_TTL = 1000 * 60 * 15 // 15 minutos

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cedulasParam = searchParams.get("cedulas")

    // Ignorar parámetro de timestamp si existe
    const timestamp = searchParams.get("_t")
    if (timestamp) {
      console.log("Ignorando parámetro de timestamp:", timestamp)
    }

    if (!cedulasParam) {
      return NextResponse.json({ error: "Se requiere al menos una cédula" }, { status: 400 })
    }

    // Convertir el parámetro en un array de cédulas y asegurarse de que sean strings
    const cedulas = cedulasParam.split(",").map((c) => c.trim())
    console.log("Procesando solicitud para cédulas:", cedulas)

    // Verificar si tenemos datos en caché para todas las cédulas solicitadas
    const cacheKey = cedulas.sort().join(",")
    const cachedData = cache.get(cacheKey)

    if (cachedData && cachedData.timestamp > Date.now() - CACHE_TTL) {
      console.log("Usando datos en caché para cédulas:", cedulasParam)
      return NextResponse.json({ profileData: cachedData.data })
    }

    let zonaData = []
    let cargoData = []

    try {
      // Intentar obtener datos reales de las bases de datos
      ;[zonaData, cargoData] = await Promise.all([fetchMysqlData(cedulas), fetchCargoData(cedulas)])
      console.log("Datos obtenidos de las bases de datos:", { zonaData, cargoData })
    } catch (dbError) {
      console.error("Error al consultar bases de datos:", dbError)
      // Si hay un error con las bases de datos, se usarán valores por defecto.
    }

    // Combinar los resultados
    const profileData = cedulas.map((cedula) => {
      // Buscar datos en los resultados de las consultas
      // Convertir a string para comparación segura
      const mysqlResult = zonaData.find((z) => String(z.cedula) === String(cedula))
      const zona = mysqlResult?.zona || null
      const padrino = mysqlResult?.padrino || null
      const cargo = cargoData.find((c) => String(c.cedula) === String(cedula))?.cargo || null

      console.log(`Procesando cédula ${cedula}:`, { zonaEncontrada: zona, cargoEncontrado: cargo, padrinoEncontrado: padrino })

      return {
        cedula,
        zona: zona || "Zona no especificada",
        cargo: cargo || "Cargo no especificado",
        padrino: padrino || "Padrino no asignado",
      }
    })

    // Guardar en caché
    cache.set(cacheKey, {
      data: profileData,
      timestamp: Date.now(),
    })

    console.log("Enviando respuesta:", { profileData })
    return NextResponse.json({ profileData })
  } catch (error) {
    console.error("Error al obtener datos de perfil:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}

// Función para obtener datos de zona desde MySQL
async function fetchMysqlData(cedulas: string[]) {
  let connection
  try {
    connection = await mysql.createConnection(mysqlConfig)

    // Verificar que la conexión está activa
    await connection.ping()
    console.log("Conexión a MySQL establecida correctamente")

    // Usar parámetros con placeholders para prevenir inyección SQL
    const placeholders = cedulas.map(() => "?").join(",")

    // Consulta SQL - Ajustar según la estructura real de la base de datos
    // Nota: Asegúrate de que los nombres de tabla y columna sean correctos
    const query = `SELECT cedula, zona, padrino FROM operadores_sao6 WHERE cedula IN (${placeholders})`
    console.log("Ejecutando consulta MySQL:", query, "con parámetros:", cedulas)

    const [rows] = await connection.execute(query, cedulas)
    console.log("Resultados de MySQL:", rows)

    return Array.isArray(rows) ? rows : []
  } catch (error) {
    console.error("Error al consultar MySQL:", error)
    // Lanzar el error para manejarlo en la función principal
    throw error
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// Función para obtener datos de cargo desde SQL Server
async function fetchCargoData(cedulas: string[]) {
  try {
    await sql.connect(sqlServerConfig)
    console.log("Conexión a SQL Server establecida correctamente")

    // Crear consulta con parámetros para prevenir inyección SQL
    // SQL Server no acepta ? como marcador de posición, debemos usar valores directamente
    const cedulasFormatted = cedulas.map((cedula) => `'${cedula}'`).join(",")

    const query = `
      SELECT
          F200_NIT AS cedula,
          C0763_DESCRIPCION AS cargo
      FROM
          BI_W0550
      WHERE
          F200_NIT IN (${cedulasFormatted})
    `
    console.log("Ejecutando consulta SQL Server:", query)

    const result = await sql.query(query)
    console.log("Resultados de SQL Server:", result.recordset)

    return result.recordset || []
  } catch (error) {
    console.error("Error al consultar SQL Server:", error)
    // Lanzar el error para manejarlo en la función principal
    throw error
  } finally {
    await sql.close()
  }
}
