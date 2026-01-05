import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/database"
import { getCache } from "@/lib/cache"
import sql from "mssql"

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

// Pool persistente para SQL Server
let sqlPool: sql.ConnectionPool | null = null

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cedulasParam = searchParams.get("cedulas")

    if (!cedulasParam) {
      return NextResponse.json({ error: "Se requiere al menos una cédula" }, { status: 400 })
    }

    const cedulas = cedulasParam.split(",").map((c) => c.trim())
    const cache = getCache()
    const cacheKey = cache.getUserDataKey(cedulas.sort().join(","), 'profile-data')

    // Intentar obtener de caché (Híbrido Redis + Memoria)
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json({ profileData: cached })
    }

    let zonaData: any[] = []
    let cargoData: any[] = []

    try {
      // Ejecutar consultas en paralelo
      [zonaData, cargoData] = await Promise.all([
        fetchProfileMysqlData(cedulas),
        fetchCargoDataFromSqlServer(cedulas)
      ])
    } catch (dbError) {
      console.error("Error al consultar bases de datos de perfil:", dbError)
      // Continuar con arrays vacíos si falla alguna BD
    }

    // Combinar resultados
    const profileData = cedulas.map((cedula) => {
      const mysqlResult = zonaData.find((z) => String(z.cedula) === String(cedula))
      const sqlServerResult = cargoData.find((c) => String(c.cedula) === String(cedula))

      return {
        cedula,
        zona: mysqlResult?.zona || "Zona no especificada",
        cargo: sqlServerResult?.cargo || "Cargo no especificado",
        padrino: mysqlResult?.padrino || "Padrino no asignado",
      }
    })

    // Guardar en caché (7 días para perfiles)
    await cache.set(cacheKey, profileData, cache.TTL.WEEKLY, 'users')

    return NextResponse.json({ profileData })
  } catch (error) {
    console.error("Error al obtener datos de perfil:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}

async function fetchProfileMysqlData(cedulas: string[]) {
  const db = getDatabase()
  const placeholders = cedulas.map(() => "?").join(",")
  const query = `SELECT cedula, zona, padrino FROM operadores_sao6 WHERE cedula IN (${placeholders})`
  // Pasamos cedulas directamente como el array de parámetros
  return await db.executeQuery(query, cedulas, true)
}

async function fetchCargoDataFromSqlServer(cedulas: string[]) {
  try {
    if (!sqlPool || !sqlPool.connected) {
      sqlPool = await new sql.ConnectionPool(sqlServerConfig).connect()
    }

    const request = sqlPool.request()
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

    const result = await request.query(query)
    return result.recordset || []
  } catch (error) {
    if (sqlPool) {
      try { await sqlPool.close() } catch (e) { }
      sqlPool = null
    }
    throw error
  }
}
