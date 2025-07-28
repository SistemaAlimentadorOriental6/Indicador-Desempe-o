import { NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"

export async function POST(request: NextRequest) {
  try {
    const { novedadesOperadores, preview = false } = await request.json()

    if (!novedadesOperadores || !Array.isArray(novedadesOperadores)) {
      return NextResponse.json(
        { error: "Datos de novedades operadores requeridos" },
        { status: 400 }
      )
    }

    // Configuración de la base de datos
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sao6',
    }

    const connection = await mysql.createConnection(dbConfig)

    const cambios: any[] = []
    const sinCambios: any[] = []
    const sinOperador: any[] = []

    for (const novedad of novedadesOperadores) {
      const cedula = novedad.CEDULA || novedad.cedula
      const codigo = novedad.CODIGO || novedad.codigo
      const nombre = novedad.NOMBRE || novedad.nombre
      const tareaNueva = novedad["TAREA NO COMERCIAL"] || novedad.tarea_no_comercial || novedad.tarea

      if (!cedula) {
        sinOperador.push({
          codigo,
          nombre,
          cedula: "Sin cédula",
          tareaNueva,
          error: "Cédula no proporcionada"
        })
        continue
      }

      // Buscar el operador en la base de datos
      const [operadorResult] = await connection.execute(
        'SELECT codigo, nombre, cedula, tarea FROM operadores_sao6 WHERE cedula = ?',
        [cedula]
      )

      if (!Array.isArray(operadorResult) || operadorResult.length === 0) {
        sinOperador.push({
          codigo,
          nombre,
          cedula,
          tareaNueva,
          error: "Operador no encontrado en la base de datos"
        })
        continue
      }

      const operador = operadorResult[0] as any
      const tareaAnterior = operador.tarea

      // Verificar si hay cambio en la tarea
      if (tareaAnterior === tareaNueva) {
        sinCambios.push({
          codigo: operador.codigo,
          nombre: operador.nombre,
          cedula: operador.cedula,
          tareaAnterior,
          tareaNueva,
          tipo: "sinCambio"
        })
      } else {
        cambios.push({
          codigo: operador.codigo,
          nombre: operador.nombre,
          cedula: operador.cedula,
          tareaAnterior,
          tareaNueva,
          tipo: "cambio"
        })

        // Si no es preview, actualizar la base de datos
        if (!preview) {
          await connection.execute(
            'UPDATE operadores_sao6 SET tarea = ? WHERE cedula = ?',
            [tareaNueva, cedula]
          )
        }
      }
    }

    await connection.end()

    const resumen = {
      total: novedadesOperadores.length,
      cambios: cambios,
      sinCambios: sinCambios,
      sinOperador: sinOperador
    }

    return NextResponse.json(resumen)
  } catch (error) {
    console.error("Error al procesar novedades operadores:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 