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
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") || new Date().getMonth() + 1
    const year = searchParams.get("year") || new Date().getFullYear()
    const limit = searchParams.get("limit") || 5

    // Connect to the database
    const connection = await createConnection(dbConfig).catch((err) => {
      console.error("Database connection error:", err)
      return null
    })

    if (!connection) {
      return NextResponse.json(
        {
          topPerformers: [],
          error: "Error de conexión a la base de datos",
        },
        { status: 500 },
      )
    }

    try {
      // Query to get top performers based on kilometers
      // Using "KMS" instead of "KILOMETROS"
      const [topPerformersResult] = await connection
        .execute(
          `SELECT 
              o.codigo AS codigo,
              o.nombre,
              o.cedula,
              o.rol,
              SUM(v.valor_ejecucion) AS kilometros
          FROM 
              operadores_sao6 o
          JOIN 
              variables_control v ON o.codigo = v.codigo_empleado
          WHERE 
              v.codigo_variable = 'KMS'
              AND MONTH(v.fecha_inicio_ejecucion) = ?
              AND YEAR(v.fecha_inicio_ejecucion) = ?
          GROUP BY 
              o.codigo, o.nombre, o.cedula, o.rol
          ORDER BY 
              kilometros DESC
          LIMIT 10;
          `,
          [month, year, Number(limit)],
        )
        .catch((err) => {
          console.error("Error querying top performers:", err)
          return [[]]
        })

      // Close the database connection
      await connection.end().catch(() => {})

      // Return the top performers
      return NextResponse.json({
        topPerformers: topPerformersResult || [],
      })
    } catch (error) {
      console.error("Database error:", error)

      try {
        await connection.end().catch(() => {})
      } catch (e) {}

      return NextResponse.json(
        {
          topPerformers: [],
          error: "Error en la consulta de la base de datos",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      {
        topPerformers: [],
        error: "Error del servidor",
      },
      { status: 500 },
    )
  }
}
