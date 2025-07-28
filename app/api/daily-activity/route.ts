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
    const type = searchParams.get("type") || "kilometros"
    const year = Number.parseInt(searchParams.get("year") || new Date().getFullYear().toString())
    const month = Number.parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString())
    const userCode = searchParams.get("codigo") || ""

    // Connect to the database
    const connection = await createConnection(dbConfig).catch((err) => {
      console.error("Database connection error:", err)
      return null
    })

    if (!connection) {
      return NextResponse.json(
        {
          dailyData: [],
          message: "Error connecting to database",
        },
        { status: 500 },
      )
    }

    try {
      // Determine which variable code to use based on type
      const variableCode = type === "kilometros" ? "KILOMETROS" : "BONOS"

      // SQL query to get daily data for the selected month and year
      const [dailyActivityData] = await connection
        .execute(
          `SELECT 
            DAY(v.fecha_inicio_programacion) as day,
            DATE_FORMAT(v.fecha_inicio_programacion, '%d/%m/%Y') as date,
            v.valor_ejecucion as value
          FROM 
            variables_control v
          WHERE 
            v.codigo_variable = ?
            AND YEAR(v.fecha_inicio_programacion) = ?
            AND MONTH(v.fecha_inicio_programacion) = ?
            ${userCode ? "AND v.codigo_empleado = ?" : ""}
          ORDER BY 
            v.fecha_inicio_programacion ASC`,
          userCode ? [variableCode, year, month, userCode] : [variableCode, year, month],
        )
        .catch((err) => {
          console.error("Query error:", err)
          return [[]]
        })

      // Format the daily data
      const daysInMonth = new Date(year, month, 0).getDate()
      const formattedData = []

      // Create an array with all days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        // Find if we have data for this day
        const dayData = Array.isArray(dailyActivityData)
          ? (dailyActivityData as any[]).find((data) => data.day === day)
          : null

        // Format the date for display
        const dateObj = new Date(year, month - 1, day)
        const formattedDate = dateObj.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })

        // Add the day with its value or 0 if no data
        formattedData.push({
          day,
          date: dayData ? dayData.date : formattedDate,
          value: dayData ? Number(dayData.value) : 0,
        })
      }

      // Close the database connection
      await connection.end().catch(() => {})

      // Return the data
      return NextResponse.json({ dailyData: formattedData })
    } catch (error) {
      console.error("Database error:", error)

      try {
        await connection.end().catch(() => {})
      } catch (e) {}

      return NextResponse.json(
        {
          dailyData: [],
          message: "Error en la base de datos",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      {
        dailyData: [],
        message: "Error del servidor",
      },
      { status: 500 },
    )
  }
}
