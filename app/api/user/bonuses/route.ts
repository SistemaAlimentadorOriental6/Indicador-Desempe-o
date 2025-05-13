import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"

// Mapeo de códigos de factor a porcentajes de deducción
const FACTOR_DEDUCTIONS: Record<string, number | string> = {
  // Códigos numéricos
  "1": 25, // Incapacidad
  "2": 100, // Ausentismo
  "3": "Día", // Incapacidad > 7 días
  "4": "Día", // Calamidad
  "5": 25, // Retardo
  "6": "Día", // Renuncia
  "7": "Día", // Vacaciones
  "8": "Día", // Suspensión
  "9": "Día", // No Ingreso
  "10": 100, // Restricción
  "11": "Día", // Día No Remunerado
  "12": 50, // Retardo por Horas
  "13": 0, // Día No Remunerado por Horas",

  // Códigos alfabéticos
  DL: 25, // Daño Leve
  DG: 50, // Daño Grave
  DGV: 100, // Daño Gravísimo
  DEL: 25, // Desincentivo Leve
  DEG: 50, // Desincentivo Grave
  DEGV: 100, // Desincentivo Gravísimo
  INT: 25, // Incumplimiento Interno
  OM: 25, // Falta Menor
  OMD: 50, // Falta MeDía
  OG: 100, // Falta Grave
  NPD: 100, // No presentar descargo
}

// Función para obtener el valor base del bono según el año
function getBaseBonusForYear(year: number): number {
  if (year === 2025) {
    return 142000 // Valor para 2025
  }
  return 130000 // Valor para 2024 y anteriores
}

// Valor por día para deducciones basadas en días
const DAILY_DEDUCTION = 4333

export async function GET(request: NextRequest) {
  // Obtener parámetros de la consulta
  const searchParams = request.nextUrl.searchParams
  const codigo = searchParams.get("codigo")
  const year = searchParams.get("year") ? Number.parseInt(searchParams.get("year") as string) : null
  const month = searchParams.get("month")

  // Validar que se proporcione un código
  if (!codigo) {
    return NextResponse.json({ error: "Se requiere el parámetro 'codigo'" }, { status: 400 })
  }

  // Configuración de la conexión a la base de datos
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  }

  let connection

  try {
    // Intentar conectar a la base de datos
    try {
      connection = await mysql.createConnection(dbConfig)
    } catch (error) {
      console.error("Error al conectar a la base de datos:", error)
      return NextResponse.json({ error: "Error de conexión a la base de datos" }, { status: 503 })
    }

    // Determinar el año actual si no se proporciona
    const currentYear = year || new Date().getFullYear()

    // Obtener el valor base del bono para el año seleccionado
    const baseBonus = getBaseBonusForYear(currentYear)

    // Construir la consulta base para obtener novedades
    let query = `
      SELECT id, fecha_inicio_novedad, fecha_fin_novedad, codigo_empleado, codigo_factor, observaciones, 
             DATEDIFF(IFNULL(fecha_fin_novedad, CURDATE()), fecha_inicio_novedad) + 1 as dias_novedad
      FROM novedades
      WHERE codigo_empleado = ?
    `
    const queryParams: any[] = [codigo]

    // Añadir filtros de año y mes si se proporcionan
    if (year) {
      query += " AND YEAR(fecha_inicio_novedad) = ?"
      queryParams.push(year)
    }

    if (month) {
      query += " AND MONTH(fecha_inicio_novedad) = ?"
      queryParams.push(month)
    }

    // Ordenar por fecha de inicio de novedad (más reciente primero)
    query += " ORDER BY fecha_inicio_novedad DESC"

    // Ejecutar la consulta
    const [rows] = await connection.execute(query, queryParams)
    const novedades = rows as any[]

    // Modificar la respuesta de la API para asegurar que siempre incluya el campo success
    // Si no hay novedades, devolver un mensaje claro
    if (!novedades.length) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "No se encontraron novedades para este usuario",
        baseBonus: baseBonus,
        deductionPercentage: 0,
        finalBonus: baseBonus,
        deductions: [],
        bonusesByYear: {},
        availableBonuses: 0,
        availableYears: [],
        availableMonths: [],
        summary: {
          availableBonuses: 0,
          totalProgrammed: baseBonus,
          totalExecuted: baseBonus,
          percentage: 100,
        },
      })
    }

    // Consulta para obtener años disponibles
    const [yearsRows] = await connection.execute(
      "SELECT DISTINCT YEAR(fecha_inicio_novedad) as year FROM novedades WHERE codigo_empleado = ? ORDER BY year DESC",
      [codigo],
    )
    const availableYears = (yearsRows as any[]).map((row) => row.year)

    // Consulta para obtener meses disponibles (si se seleccionó un año)
    let availableMonths: number[] = []
    if (year) {
      const [monthsRows] = await connection.execute(
        "SELECT DISTINCT MONTH(fecha_inicio_novedad) as month FROM novedades WHERE codigo_empleado = ? AND YEAR(fecha_inicio_novedad) = ? ORDER BY month",
        [codigo, year],
      )
      availableMonths = (monthsRows as any[]).map((row) => row.month)
    }

    // Calcular bonos por año
    const bonusesByYear: Record<string, number> = {}

    // Consulta para contar bonos por año
    const [bonusCountRows] = await connection.execute(
      "SELECT YEAR(fecha_inicio_novedad) as year, COUNT(*) as count FROM novedades WHERE codigo_empleado = ? GROUP BY YEAR(fecha_inicio_novedad) ORDER BY year DESC",
      [codigo],
    )

    // Poblar el objeto bonusesByYear
    ;(bonusCountRows as any[]).forEach((row) => {
      bonusesByYear[row.year] = row.count
    })

    // Calcular las deducciones para cada novedad
    const deductions: Array<{
      id: number
      codigo: string
      concepto: string
      fechaInicio: string
      fechaFin: string | null
      dias: number
      porcentaje: number | string
      monto: number
    }> = []

    let totalDeductionAmount = 0

    novedades.forEach((novedad) => {
      const codigoFactor = novedad.codigo_factor
      const factorValue = FACTOR_DEDUCTIONS[codigoFactor]

      if (factorValue !== undefined) {
        let deductionAmount = 0
        let deductionPercentage: number | string = 0

        if (factorValue === "Día") {
          // Calcular deducción basada en días
          const dias = novedad.dias_novedad || 1
          deductionAmount = DAILY_DEDUCTION * dias
          deductionPercentage = `${dias} día(s)`
        } else {
          // Calcular deducción basada en porcentaje
          deductionAmount = (baseBonus * (factorValue as number)) / 100
          deductionPercentage = factorValue as number
        }

        // Añadir a la lista de deducciones
        deductions.push({
          id: novedad.id,
          codigo: codigoFactor,
          concepto: getConceptoByCode(codigoFactor),
          fechaInicio: novedad.fecha_inicio_novedad,
          fechaFin: novedad.fecha_fin_novedad,
          dias: novedad.dias_novedad || 1,
          porcentaje: deductionPercentage,
          monto: deductionAmount,
        })

        totalDeductionAmount += deductionAmount
      }
    })

    // Limitar la deducción total al valor del bono
    totalDeductionAmount = Math.min(totalDeductionAmount, baseBonus)

    // Calcular el porcentaje total de deducción
    const deductionPercentage = Math.round((totalDeductionAmount / baseBonus) * 100)

    // Calcular el valor final del bono después de deducciones
    const finalBonus = baseBonus - totalDeductionAmount

    // Calcular días para expiración (14 días desde la fecha más reciente)
    let expiresInDays = 0
    if (novedades.length > 0) {
      const latestDate = new Date(novedades[0].fecha_inicio_novedad)
      const expirationDate = new Date(latestDate)
      expirationDate.setDate(expirationDate.getDate() + 14)

      const today = new Date()
      const diffTime = expirationDate.getTime() - today.getTime()
      expiresInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      expiresInDays = Math.max(0, expiresInDays) // No mostrar días negativos
    }

    // Contar bonos disponibles (los que no han expirado)
    // Para este caso, consideramos que todos los bonos en el sistema están disponibles
    // a menos que tengan una fecha de fin que ya haya pasado
    let availableBonuses = 0
    const today = new Date()

    novedades.forEach((novedad) => {
      const fechaFin = novedad.fecha_fin_novedad ? new Date(novedad.fecha_fin_novedad) : null
      if (!fechaFin || fechaFin > today) {
        availableBonuses++
      }
    })

    // Si no hay bonos disponibles pero hay registros, asumimos que al menos hay 1 bono disponible
    if (availableBonuses === 0 && novedades.length > 0) {
      availableBonuses = 1
    }

    // Asegurarnos de que el total de bonos por año coincida con los bonos disponibles
    const totalBonusByYear = Object.values(bonusesByYear).reduce((sum: number, count: number) => sum + count, 0)
    if (totalBonusByYear > 0 && availableBonuses === 0) {
      availableBonuses = totalBonusByYear
    }

    // Calcular bonos disponibles basados en los bonos por año
    const availableBonusesByYear = bonusesByYear
      ? Object.values(bonusesByYear).reduce((sum, count) => sum + count, 0)
      : 0

    let lastMonthData = {
      year: 0,
      month: 0,
      bonusValue: 0,
      deductionAmount: 0,
      finalValue: 0,
      monthName: "",
    }

    if (novedades.length > 0) {
      // Obtener la fecha más reciente
      const latestDate = new Date(novedades[0].fecha_inicio_novedad)
      const latestYear = latestDate.getFullYear()
      const latestMonth = latestDate.getMonth() + 1 // JavaScript months are 0-based

      // Obtener el valor base del bono para el año de la última novedad
      const lastMonthBaseBonus = getBaseBonusForYear(latestYear)

      // Filtrar novedades del último mes
      const lastMonthNovedades = novedades.filter((novedad) => {
        const date = new Date(novedad.fecha_inicio_novedad)
        return date.getFullYear() === latestYear && date.getMonth() + 1 === latestMonth
      })

      // Calcular deducciones específicas del último mes
      let lastMonthDeduction = 0
      lastMonthNovedades.forEach((novedad) => {
        const codigoFactor = novedad.codigo_factor
        const factorValue = FACTOR_DEDUCTIONS[codigoFactor]

        if (factorValue !== undefined) {
          if (factorValue === "Día") {
            const dias = novedad.dias_novedad || 1
            lastMonthDeduction += DAILY_DEDUCTION * dias
          } else {
            lastMonthDeduction += (lastMonthBaseBonus * (factorValue as number)) / 100
          }
        }
      })

      // Limitar la deducción al valor del bono
      lastMonthDeduction = Math.min(lastMonthDeduction, lastMonthBaseBonus)

      // Obtener el nombre del mes
      const monthNames = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ]

      lastMonthData = {
        year: latestYear,
        month: latestMonth,
        bonusValue: lastMonthBaseBonus,
        deductionAmount: lastMonthDeduction,
        finalValue: lastMonthBaseBonus - lastMonthDeduction,
        monthName: monthNames[latestMonth - 1],
      }
    }

    // Añadir lastMonthData a la respuesta
    const response = {
      success: true,
      availableBonuses: availableBonusesByYear,
      baseBonus,
      deductionPercentage,
      deductionAmount: totalDeductionAmount,
      finalBonus,
      expiresInDays,
      bonusesByYear,
      deductions,
      data: novedades,
      lastMonthData, // Añadir información del último mes
      availableYears,
      availableMonths,
      summary: {
        availableBonuses: availableBonusesByYear,
        totalProgrammed: baseBonus || 0,
        totalExecuted: finalBonus || 0,
        percentage: baseBonus ? Math.round(((baseBonus - (totalDeductionAmount || 0)) / baseBonus) * 100) : 0,
        lastMonthFinalValue: lastMonthData.finalValue, // Añadir el valor final del último mes al resumen
      },
    }

    console.log("API response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error al procesar la solicitud:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al procesar la solicitud",
      },
      { status: 500 },
    )
  } finally {
    // Cerrar la conexión a la base de datos
    if (connection) {
      await connection.end()
    }
  }
}

// Función para obtener el concepto basado en el código
function getConceptoByCode(codigo: string): string {
  const conceptos: Record<string, string> = {
    "1": "Incapacidad",
    "2": "Ausentismo",
    "3": "Incapacidad > 7 días",
    "4": "Calamidad",
    "5": "Retardo",
    "6": "Renuncia",
    "7": "Vacaciones",
    "8": "Suspensión",
    "9": "No Ingreso",
    "10": "Restricción",
    "11": "Día No Remunerado",
    "12": "Retardo por Horas",
    "13": "Día No Remunerado por Horas",
    DL: "Daño Leve",
    DG: "Daño Grave",
    DGV: "Daño Gravísimo",
    DEL: "Desincentivo Leve",
    DEG: "Desincentivo Grave",
    DEGV: "Desincentivo Gravísimo",
    INT: "Incumplimiento Interno",
    OM: "Falta Menor",
    OMD: "Falta MeDía",
    OG: "Falta Grave",
    NPD: "No presentar descargo",
  }

  return conceptos[codigo] || `Código ${codigo}`
}
