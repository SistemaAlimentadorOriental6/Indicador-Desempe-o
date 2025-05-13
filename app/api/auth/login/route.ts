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
    const { cedula, password } = await request.json()

    // Validate input
    if (!cedula || !password) {
      return NextResponse.json({ message: "Cédula y contraseña son requeridos" }, { status: 400 })
    }

    // Check for admin credentials
    if (cedula === "admin" && password === "admin") {
      return NextResponse.json({
        message: "Inicio de sesión exitoso",
        user: {
          codigo: "ADMIN",
          nombre: "Administrador",
          cedula: "admin",
          rol: "Administrador",
          telefono: "",
        },
      })
    }

    // Connect to the database
    const connection = await createConnection(dbConfig)

    try {
      // Query to find the user by cedula
      const [rows] = await connection.execute(
        "SELECT codigo, nombre, cedula, rol, telefono FROM operadores_sao6 WHERE cedula = ?",
        [cedula],
      )

      // Close the database connection
      await connection.end()

      // Check if user exists
      const users = rows as any[]
      if (users.length === 0) {
        return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
      }

      const user = users[0]

      // In this implementation, we're checking if the password matches the cedula
      // In a real application, you should use proper password hashing
      if (password !== cedula.toString()) {
        return NextResponse.json({ message: "Contraseña incorrecta" }, { status: 401 })
      }

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
