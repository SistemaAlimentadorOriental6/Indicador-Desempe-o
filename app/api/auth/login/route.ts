import { NextResponse } from "next/server"
import { createConnection } from "mysql2/promise"

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "your_database",
}

// Hardcoded admin users
const adminUsers = [
  {
    codigo: "JaiderMafla",
    cedula: "1017234758",
    nombre: "Mafla Gonzalez Jaider Andrés",
    cargo: "Analista CMO",
    telefono: "+57 300 000 0001"
  },
  {
    codigo: "CarlosSalas",
    cedula: "1046952572",
    nombre: "Salas Bedoya Carlos Andrés",
    cargo: "Profesional De CMO",
    telefono: "+57 300 000 0002"
  },
  {
    codigo: "DanielArboleda",
    cedula: "1085932178",
    nombre: "Arboleda Revelo Daniel Santiago",
    cargo: "Promotor",
    telefono: "+57 300 000 0003"
  },
  {
    codigo: "StefannyHernandez",
    cedula: "1193522709",
    nombre: "Hernández Monsalve Stefanny",
    cargo: "Auxiliar De Programación",
    telefono: "+57 300 000 0004"
  },
  {
    codigo: "JorgeMoreno",
    cedula: "1214720647",
    nombre: "Moreno Agudelo Jorge Andrés",
    cargo: "Profesional De Planeación Y Programación",
    telefono: "+57 300 000 0005"
  },
  {
    codigo: "AntonioRubiano",
    cedula: "79209630",
    nombre: "Lopez Rubiano Manuel Antonio",
    cargo: "Líder De Servicio",
    telefono: "+57 300 000 0006"
  },
  {
    codigo: "NelsonUrrea",
    cedula: "79858785",
    nombre: "Urrea Perez Nelson Ricardo",
    cargo: "Coordinador Pesv",
    telefono: "+57 300 000 0007"
  },
  {
    codigo: "ManuelLopez",
    cedula: "80126043",
    nombre: "López López Manuel Antonio",
    cargo: "Líder De Servicio",
    telefono: "+57 300 000 0008"
  },
  {
    codigo: "LuisFajardo",
    cedula: "80256549",
    nombre: "Fajardo Gomez Luis Enrique",
    cargo: "Director De Operaciones",
    telefono: "+57 300 000 0009"
  },
  {
    codigo: "OliverBarbosa",
    cedula: "8125474",
    nombre: "Barbosa Pardo Oliver Yaced",
    cargo: "Profesional De Programación",
    telefono: "+57 300 000 0010"
  },
  {
    codigo: "JuanFlorez",
    cedula: "1039690417",
    nombre: "Flórez Lozano Juan Manuel",
    cargo: "Promotor",
    telefono: "+57 300 000 0011"
  },
  {
    codigo: "Sharitha",
    cedula: "1000896882",
    nombre: "Ramirez Palacio Sharitha",
    cargo: "Auxiliar De Desarrollo",
    telefono: "+57 300 000 0012"
  },
  {
    codigo: "MaritzaCano",
    cedula: "1007223606",
    nombre: "Cano Restrepo Maritza",
    cargo: "Analista De Compensación",
    telefono: "+57 300 000 0013"
  },
  {
    codigo: "WandaSanchez",
    cedula: "1013624374",
    nombre: "Sanchez Muñoz Wanda Vanessa",
    cargo: "Profesional De Desarrollo",
    telefono: "+57 300 000 0014"
  },
  {
    codigo: "MarthaGarcia",
    cedula: "1037605221",
    nombre: "Garcia Ángel Martha Cecilia",
    cargo: "Profesional De Compensación",
    telefono: "+57 300 000 0015"
  },
  {
    codigo: "ValentinaGonzalez",
    cedula: "1152219871",
    nombre: "Gonzalez Agudelo Valentina",
    cargo: "Auxiliar De Compensación",
    telefono: "+57 300 000 0016"
  },
  {
    codigo: "RicardoMontoya",
    cedula: "71219707",
    nombre: "Montoya Agudelo Ricardo Leon",
    cargo: "Director Recursos Humanos",
    telefono: "+57 300 000 0017"
  },
  {
    codigo: "HelierGallego",
    cedula: "1016000468",
    nombre: "Gallego Rojas Helier",
    cargo: "Coordinador De Sistema De Gestión Integral",
    telefono: "+57 300 000 0018"
  },
  {
    codigo: "CristinaCorrea",
    cedula: "1152706388",
    nombre: "Correa Restrepo Cristina",
    cargo: "Profesional De Seguridad Salud En El Trabajo Y Ambiental",
    telefono: "+57 300 000 0019"
  },
  {
    codigo: "MayrengSalguedo",
    cedula: "1047372390",
    nombre: "Salguedo Pajaro Mayreng Del Carmen",
    cargo: "Enfermera Esp. Sst",
    telefono: "+57 300 000 0020"
  }
]

export async function POST(request: Request) {
  try {
    const { codigo, cedula } = await request.json()

    // Validate input
    if (!codigo || !cedula) {
      return NextResponse.json({ message: "Código y cédula son requeridos" }, { status: 400 })
    }

    // Check for original admin credentials
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

    // Check for hardcoded admin users
    const adminUser = adminUsers.find(user => user.codigo === codigo && user.cedula === cedula)
    if (adminUser) {
      return NextResponse.json({
        message: "Inicio de sesión exitoso",
        user: {
          codigo: adminUser.codigo,
          nombre: adminUser.nombre,
          cedula: adminUser.cedula,
          rol: adminUser.cargo,
          telefono: adminUser.telefono,
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
