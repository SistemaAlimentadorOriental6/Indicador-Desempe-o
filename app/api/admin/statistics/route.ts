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

    console.log(`Processing request for month: ${month}, year: ${year}`)

    // Connect to the database
    const connection = await createConnection(dbConfig).catch((err) => {
      console.error("Database connection error:", err)
      return null
    })

    if (!connection) {
      console.log("No database connection, returning empty data")
      return NextResponse.json(
        {
          statistics: {
            totalUsers: 0,
            activeUsers: 0,
            totalKilometers: 0,
            averageKilometers: 0,
          },
          error: "Error de conexión a la base de datos",
        },
        { status: 500 },
      )
    }

    try {
      // Query to get total users
      const [usersResult] = await connection.execute("SELECT COUNT(*) as total FROM operadores_sao6").catch((err) => {
        console.error("Error querying users:", err)
        return [{ total: 0 }]
      })
      const totalUsers = (usersResult as any[])[0]?.total || 0

      // Query to get active users (users with kilometers in the selected month)
      // Using "KMS" instead of "KILOMETROS"
      const [activeUsersResult] = await connection
        .execute(
          `SELECT COUNT(DISTINCT codigo_empleado) as active
           FROM variables_control
           WHERE codigo_variable = 'KMS'
           AND MONTH(fecha_inicio_ejecucion) = ?
           AND YEAR(fecha_inicio_ejecucion) = ?
           AND valor_ejecucion > 0`,
          [month, year],
        )
        .catch((err) => {
          console.error("Error querying active users:", err)
          return [{ active: 0 }]
        })
      const activeUsers = (activeUsersResult as any[])[0]?.active || 0

      // Query to get total kilometers
      // Using "KMS" instead of "KILOMETROS"
      const [kilometersResult] = await connection
        .execute(
          `SELECT SUM(valor_ejecucion) as total
           FROM variables_control
           WHERE codigo_variable = 'KMS'
           AND MONTH(fecha_inicio_ejecucion) = ?
           AND YEAR(fecha_inicio_ejecucion) = ?`,
          [month, year],
        )
        .catch((err) => {
          console.error("Error querying kilometers:", err)
          return [{ total: 0 }]
        })
      const totalKilometers = (kilometersResult as any[])[0]?.total || 0

      // Calculate average kilometers per user
      const averageKilometers = activeUsers > 0 ? totalKilometers / activeUsers : 0

      console.log("Successfully retrieved statistics:", {
        totalUsers,
        activeUsers,
        totalKilometers,
        averageKilometers,
      })

      // Close the database connection
      await connection.end().catch(() => {})

      // Return the statistics
      return NextResponse.json({
        statistics: {
          totalUsers,
          activeUsers,
          totalKilometers,
          averageKilometers,
        },
      })
    } catch (error) {
      console.error("Database error:", error)

      try {
        await connection.end().catch(() => {})
      } catch (e) {}

      return NextResponse.json(
        {
          statistics: {
            totalUsers: 0,
            activeUsers: 0,
            totalKilometers: 0,
            averageKilometers: 0,
          },
          error: "Error en la consulta de la base de datos",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      {
        statistics: {
          totalUsers: 0,
          activeUsers: 0,
          totalKilometers: 0,
          averageKilometers: 0,
        },
        error: "Error del servidor",
      },
      { status: 500 },
    )
  }
}
