import { NextResponse } from "next/server"
import { createConnection } from "mysql2/promise"

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "your_database",
}

export async function GET(request: Request) {
  try {
    // Get userId from query parameters if provided
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    // Connect to the database
    const connection = await createConnection(dbConfig).catch((err) => {
      console.error("Database connection error:", err)
      return null
    })

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          message: "Error connecting to database",
        },
        { status: 500 },
      )
    }

    try {
      // Base query to get the last month with data
      let lastMonthQuery = `
        SELECT 
          YEAR(fecha_inicio_programacion) as year,
          MONTH(fecha_inicio_programacion) as month,
          MAX(fecha_inicio_programacion) as last_date
        FROM variables_control
        WHERE valor_ejecucion > 0
      `

      // Add user filter if provided
      if (userId) {
        lastMonthQuery += ` AND codigo_empleado = ?`
      }

      lastMonthQuery += `
        GROUP BY YEAR(fecha_inicio_programacion), MONTH(fecha_inicio_programacion)
        ORDER BY year DESC, month DESC
        LIMIT 1
      `

      // Execute query to get the last month with data
      const [lastMonthRows] = await connection.execute(lastMonthQuery, userId ? [userId] : [])

      if (!Array.isArray(lastMonthRows) || lastMonthRows.length === 0) {
        await connection.end().catch(() => {})
        return NextResponse.json({
          success: false,
          message: "No data available",
        })
      }

      const lastMonth = lastMonthRows[0] as any
      const year = lastMonth.year
      const month = lastMonth.month

      // Get month name in Spanish
      const monthNames = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ]
      const monthName = `${monthNames[month - 1]} ${year}`

      // Query to get kilometros for the last month
      let kilometrosQuery = `
        SELECT SUM(valor_ejecucion) as total
        FROM variables_control
        WHERE codigo_variable = 'KMS'
        AND YEAR(fecha_inicio_programacion) = ?
        AND MONTH(fecha_inicio_programacion) = ?
      `

      // Query to get bonos for the last month
      let bonosQuery = `
        SELECT SUM(valor_ejecucion) as total
        FROM variables_control
        WHERE codigo_variable = 'BONOS'
        AND YEAR(fecha_inicio_programacion) = ?
        AND MONTH(fecha_inicio_programacion) = ?
      `

      // Query to get puntaje for the last month
      let puntajeQuery = `
        SELECT SUM(valor_ejecucion) as total
        FROM variables_control
        WHERE codigo_variable = 'KMS'
        AND YEAR(fecha_inicio_programacion) = ?
        AND MONTH(fecha_inicio_programacion) = ?
      `

      // Add user filter if provided
      if (userId) {
        kilometrosQuery += ` AND codigo_empleado = ?`
        bonosQuery += ` AND codigo_empleado = ?`
        puntajeQuery += ` AND codigo_empleado = ?`
      }

      // Execute queries
      const [kilometrosRows] = await connection.execute(kilometrosQuery, userId ? [year, month, userId] : [year, month])

      const [bonosRows] = await connection.execute(bonosQuery, userId ? [year, month, userId] : [year, month])

      const [puntajeRows] = await connection.execute(puntajeQuery, userId ? [year, month, userId] : [year, month])

      // Extract values
      const kilometros = Array.isArray(kilometrosRows) && kilometrosRows[0] ? (kilometrosRows[0] as any).total || 0 : 0
      const bonos = Array.isArray(bonosRows) && bonosRows[0] ? (bonosRows[0] as any).total || 0 : 0
      const puntaje = Array.isArray(puntajeRows) && puntajeRows[0] ? (puntajeRows[0] as any).total || 0 : 0

      // Format the last updated date
      const lastUpdated = lastMonth.last_date
        ? new Date(lastMonth.last_date).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : null

      // Close the database connection
      await connection.end().catch(() => {})

      // Return the data
      return NextResponse.json({
        success: true,
        kilometros,
        bonos,
        puntaje,
        lastUpdated,
        monthName,
        year,
        month,
      })
    } catch (error) {
      console.error("Database error:", error)

      try {
        await connection.end().catch(() => {})
      } catch (e) {}

      return NextResponse.json(
        {
          success: false,
          message: "Error en la base de datos",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error del servidor",
      },
      { status: 500 },
    )
  }
}
