import { NextResponse } from "next/server"
import { createConnection } from "mysql2/promise"

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "your_database",
}

export async function POST(request: Request) {
  try {
    const { codigo, cedula } = await request.json()

    // Validate input
    if (!codigo || !cedula) {
      return NextResponse.json({ message: "Código y cédula son requeridos" }, { status: 400 })
    }

    // Check for admin credentials
    if (codigo === "ADMIN" && cedula === "MarioValle") {
      return NextResponse.json({
        message: "Inicio de sesión exitoso",
        user: {
          codigo: "ADMIN001",
          nombre: "Mario Valle - Administrador del Sistema",
          cedula: "MarioValle",
          rol: "Administrador",
          telefono: "+34 600 000 000",
          isAdmin: true,
        },
      })
    }

    // Connect to the database
    const connection = await createConnection(dbConfig)

    try {
      // Query to find the user by both codigo and cedula
      const [rows] = await connection.execute(
        "SELECT codigo, nombre, cedula, rol, telefono FROM operadores_sao6 WHERE codigo = ? AND cedula = ?",
        [codigo, cedula],
      )

      // Close the database connection
      await connection.end()

      // Check if user exists with matching codigo and cedula
      const users = rows as any[]
      if (users.length === 0) {
        return NextResponse.json({ message: "Código o cédula incorrectos" }, { status: 401 })
      }

      const user = users[0]

      // Return user data on successful login
      return NextResponse.json({
        message: "Inicio de sesión exitoso",
        user: {
          codigo: user.codigo,
          nombre: user.nombre,
          cedula: user.cedula,
          rol: user.rol,
          telefono: user.telefono,
        },
      })
    } catch (error) {
      console.error("Database error:", error)
      return NextResponse.json({ message: "Error en la base de datos" }, { status: 500 })
    }
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ message: "Error del servidor" }, { status: 500 })
  }
}
