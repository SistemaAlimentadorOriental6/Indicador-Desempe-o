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
    // Get user code from query parameters if needed
    const { searchParams } = new URL(request.url)
    const userCode = searchParams.get("codigo") || ""

    // Connect to the database
    const connection = await createConnection(dbConfig).catch((err) => {
      console.error("Database connection error:", err)
      return null
    })

    if (!connection) {
      return NextResponse.json(
        {
          yearlyData: [],
          message: "Error connecting to database",
        },
        { status: 500 }
      )
    }

    try {
      // Query to get yearly progress data
      const [yearlyProgressData] = await connection
        .execute(
          `SELECT 
            YEAR(v.fecha_inicio_programacion) as year,
            SUM(CASE WHEN v.codigo_variable = 'KMS' THEN v.valor_ejecucion ELSE 0 END) as kilometers,
            COUNT(CASE WHEN v.codigo_variable = 'BONOS' AND v.valor_ejecucion > 0 THEN 1 ELSE NULL END) as bonuses,
            ROUND(AVG(CASE WHEN v.codigo_variable = 'PUNTAJE' THEN v.valor_ejecucion ELSE NULL END)) as score
          FROM 
            variables_control v
          ${userCode ? "WHERE v.codigo_empleado = ?" : ""}
          GROUP BY 
            YEAR(v.fecha_inicio_programacion)
          ORDER BY 
            year DESC
          LIMIT 5`,
          userCode ? [userCode] : []
        )
        .catch((err) => {
          console.error("Query error:", err)
          return [[]]
        })

      // Format the yearly data
      const yearlyData = Array.isArray(yearlyProgressData)
        ? (yearlyProgressData as any[]).map((data) => ({
            year: data.year,
            kilometers: Number(data.kilometers) || 0,
            bonuses: Number(data.bonuses) || 0,
            score: Number(data.score) || 0,
          }))
        : []

      // Close the database connection
      await connection.end().catch(() => {})

      // Return the yearly data
      return NextResponse.json({ yearlyData })
    } catch (error) {
      console.error("Database error:", error)

      try {
        await connection.end().catch(() => {})
      } catch (e) {}

      return NextResponse.json(
        {
          yearlyData: [],
          message: "Error en la base de datos",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      {
        yearlyData: [],
        message: "Error del servidor",
      },
      { status: 500 }
    )
  }
}
