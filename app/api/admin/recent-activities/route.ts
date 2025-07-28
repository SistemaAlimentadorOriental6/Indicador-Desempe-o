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
    const limit = searchParams.get("limit") || 10

    // Connect to the database
    const connection = await createConnection(dbConfig).catch((err) => {
      console.error("Database connection error:", err)
      return null
    })

    if (!connection) {
      return NextResponse.json(
        {
          activities: [],
          error: "Error de conexión a la base de datos",
        },
        { status: 500 },
      )
    }

    try {
      // Query to get recent activities
      // Using "KMS" instead of "KILOMETROS"
      const [activitiesResult] = await connection
        .execute(
          `SELECT 
              operadores_sao6.codigo AS codigo,
              operadores_sao6.nombre,
              variables_control.codigo_variable AS tipo,
              variables_control.valor_ejecucion AS valor,
              variables_control.fecha_inicio_programacion AS fecha
          FROM 
              variables_control
          JOIN 
              operadores_sao6 ON variables_control.codigo_empleado = operadores_sao6.codigo
          WHERE 
              variables_control.codigo_variable IN ('KMS')
          ORDER BY 
              variables_control.fecha_inicio_programacion DESC
          LIMIT ?;  -- o el valor que desees`,
          [Number(limit)],
        )
        .catch((err) => {
          console.error("Error querying recent activities:", err)
          return [[]]
        })

      // Format the activities
      const activities = (activitiesResult as any[]).map((activity) => {
        return {
          id: activity.id,
          codigo: activity.codigo,
          nombre: activity.nombre,
          tipo: activity.tipo,
          valor: activity.valor,
          fecha: activity.fecha,
          // Format the date
          fechaFormateada: new Date(activity.fecha).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        }
      })

      // Close the database connection
      await connection.end().catch(() => {})

      // Return the activities
      return NextResponse.json({
        activities: activities || [],
      })
    } catch (error) {
      console.error("Database error:", error)

      try {
        await connection.end().catch(() => {})
      } catch (e) {}

      return NextResponse.json(
        {
          activities: [],
          error: "Error en la consulta de la base de datos",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      {
        activities: [],
        error: "Error del servidor",
      },
      { status: 500 },
    )
  }
}
