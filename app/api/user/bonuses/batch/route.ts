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
  // Valores consistentes con bonus-config.ts
  switch (year) {
    case 2025:
      return 142000; // Valor para 2025
    case 2024:
      return 135000; // Valor para 2024
    case 2023:
      return 128000; // Valor para 2023
    case 2022:
    case 2021:
    case 2020:
      return 122000; // Valor para 2022, 2021 y 2020
    default:
      // Para años anteriores a 2020 o no especificados
      return 122000;
  }
}

// Valor por día para deducciones basadas en días
const DAILY_DEDUCTION = 4333

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

// Procesamiento de datos para un solo usuario
async function processUserData(connection: mysql.Connection, codigo: string, year: number | null) {
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

  // Añadir filtros de año si se proporciona
  if (year) {
    query += " AND YEAR(fecha_inicio_novedad) = ?"
    queryParams.push(year)
  }

  // Ordenar por fecha de inicio de novedad (más reciente primero)
  query += " ORDER BY fecha_inicio_novedad DESC"

  // Ejecutar la consulta
  const [rows] = await connection.execute(query, queryParams)
  const novedades = rows as any[]

  // Si no hay novedades, devolver datos básicos
  if (!novedades.length) {
    return {
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
        totalProgrammed: baseBonus || 0,
        totalExecuted: baseBonus || 0,
        percentage: 100,
      },
    }
  }

  // Procesar las novedades
  let totalDeductionAmount = 0
  let deductionPercentage = 0
  let finalBonus = baseBonus
  let expiresInDays = 0
  let availableBonusesByYear = 0
  let bonusesByYear: Record<string, number> = {}
  let availableYears: number[] = []
  let availableMonths: any[] = []
  let lastMonthData: any = {}

  // Procesar deducciones
  const deductions = novedades.map((novedad) => {
    const codigoFactor = novedad.codigo_factor
    const factorValue = FACTOR_DEDUCTIONS[codigoFactor]
    let monto = 0

    if (factorValue !== undefined) {
      if (factorValue === "Día") {
        const dias = novedad.dias_novedad || 1
        monto = DAILY_DEDUCTION * dias
      } else {
        monto = (baseBonus * (factorValue as number)) / 100
      }
    }

    // Obtener el concepto basado en el código
    const concepto = getConceptoByCode(codigoFactor)

    return {
      id: novedad.id,
      codigo: codigoFactor,
      concepto,
      fechaInicio: novedad.fecha_inicio_novedad,
      fechaFin: novedad.fecha_fin_novedad,
      dias: novedad.dias_novedad,
      porcentaje: factorValue === "Día" ? `${novedad.dias_novedad} día(s)` : `${factorValue}%`,
      monto,
    }
  })

  // Calcular deducción total
  totalDeductionAmount = deductions.reduce((acc, curr) => acc + curr.monto, 0)
  finalBonus = Math.max(0, baseBonus - totalDeductionAmount)
  deductionPercentage = Math.round((totalDeductionAmount / baseBonus) * 100)

  // Procesar datos del último mes
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

    // Añadir a los meses disponibles
    availableMonths.push({
      year: latestYear,
      month: latestMonth,
      monthName: monthNames[latestMonth - 1],
    })
  }

  // Obtener años disponibles (simulado para este ejemplo)
  availableYears = [2025, 2024, 2023, 2022, 2021, 2020]

  // Simular bonos por año
  bonusesByYear = {
    '2020': 4,
    '2021': 5,
    '2022': 6,
    '2023': 3,
    '2024': 2,
    '2025': 1,
  }

  availableBonusesByYear = Object.values(bonusesByYear).reduce((a, b) => a + b, 0)

  return {
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
    lastMonthData,
    availableYears,
    availableMonths,
    summary: {
      availableBonuses: availableBonusesByYear,
      totalProgrammed: baseBonus || 0,
      totalExecuted: finalBonus || 0,
      percentage: baseBonus ? Math.round(((baseBonus - (totalDeductionAmount || 0)) / baseBonus) * 100) : 0,
      lastMonthFinalValue: lastMonthData.finalValue || 0,
    },
  }
}

export async function POST(request: NextRequest) {
  // Obtener parámetros del cuerpo de la solicitud
  const body = await request.json()
  const { codigos, year } = body

  // Validar que se proporcionen códigos
  if (!codigos || !Array.isArray(codigos) || codigos.length === 0) {
    return NextResponse.json({ error: "Se requiere un array de códigos de empleados" }, { status: 400 })
  }

  // Configuración de la conexión a la base de datos
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  }

  let connection: mysql.Connection | null = null

  try {
    // Intentar conectar a la base de datos
    try {
      connection = await mysql.createConnection(dbConfig)
    } catch (error) {
      console.error("Error al conectar a la base de datos:", error)
      return NextResponse.json({ error: "Error de conexión a la base de datos" }, { status: 503 })
    }

    // Procesar cada código de usuario
    const results: Record<string, any> = {}
    
    // Limitar a 20 usuarios por solicitud para evitar sobrecarga
    const limitedCodigos = codigos.slice(0, 20)
    
    // Asegurarse de que connection no sea null antes de procesar
    if (!connection) {
      throw new Error("No se pudo establecer conexión con la base de datos")
    }
    
    // Procesar en paralelo para mayor eficiencia
    const promises = limitedCodigos.map(async (codigo: string) => {
      try {
        const userData = await processUserData(connection!, codigo, year ? Number.parseInt(year as string) : null)
        return { codigo, data: userData }
      } catch (error) {
        console.error(`Error procesando usuario ${codigo}:`, error)
        return { 
          codigo, 
          data: { 
            success: false, 
            error: "Error al procesar los datos del usuario" 
          } 
        }
      }
    })
    
    const userResults = await Promise.all(promises)
    
    // Convertir el array de resultados a un objeto con los códigos como claves
    userResults.forEach(result => {
      results[result.codigo] = result.data
    })

    return NextResponse.json({
      success: true,
      results
    })
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
