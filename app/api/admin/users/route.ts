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
    // Connect to the database
    const connection = await createConnection(dbConfig).catch((err) => {
      console.error("Database connection error:", err)
      return null
    })

    if (!connection) {
      console.log("No database connection, returning sample data")
      return null
    }

    try {
      // Query to get all users with their kilometers and bonuses
      const [usersResult] = await connection
        .execute(
          `SELECT 
            o.codigo AS codigo,
            o.nombre AS nombre,
            o.cedula AS cedula,
            o.rol AS rol,
            o.telefono AS telefono,
            SUM(CASE WHEN v.codigo_variable = 'KMS' THEN v.valor_ejecucion ELSE 0 END) AS kilometros,
            SUM(CASE WHEN v.codigo_variable = 'BONOS' THEN v.valor_ejecucion ELSE 0 END) AS bonos
          FROM 
            operadores_sao6 o
          LEFT JOIN 
            variables_control v ON o.codigo = v.codigo_empleado
          GROUP BY 
            o.codigo, o.nombre, o.cedula, o.rol, o.telefono
          ORDER BY 
            o.nombre`,
        )
        .catch(() => [])

      // Close the database connection
      await connection.end().catch(() => {})

      // Return the users
      return NextResponse.json({
        users: usersResult || [],
      })
    } catch (error) {
      console.error("Database error:", error)

      try {
        await connection.end().catch(() => {})
      } catch (e) {}

      // Return sample data on error
      return null
    }
  } catch (error) {
    console.error("Server error:", error)
    // Return sample data on error
    return null
  }
}
