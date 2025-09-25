import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"
import { getDatabase } from "@/lib/database"

// Mapeo de códigos de factor a porcentajes de deducción
const FACTOR_DEDUCTIONS: Record<string, number | string> = {
  // Códigos numéricos
  "0": 0, // Sin Deducción
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
    "0": "Sin Deducción",
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
async function processUserData(connection: mysql.Connection, codigo: string, year: number | null, month: number | null) {
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

  // Filtrar por año y mes si se proporcionan
  if (year && month) {
    // Seleccionar novedades que caigan dentro del mes (inicio o fin) o abarcan el rango
    query += ` AND (
      (YEAR(fecha_inicio_novedad) = ? AND MONTH(fecha_inicio_novedad) = ?) OR
      (fecha_fin_novedad IS NOT NULL AND YEAR(fecha_fin_novedad) = ? AND MONTH(fecha_fin_novedad) = ?) OR
      (fecha_inicio_novedad <= LAST_DAY(?) AND 
       (fecha_fin_novedad IS NULL OR fecha_fin_novedad >= ?))
    )`
    const firstDay = `${year}-${String(month).padStart(2,'0')}-01`
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0]
    queryParams.push(year, month, year, month, lastDay, firstDay)
  } else if (year) {
    query += " AND YEAR(fecha_inicio_novedad) = ?"
    queryParams.push(year)
  }

  // Ordenar por fecha de inicio de novedad (más reciente primero)
  query += " ORDER BY fecha_inicio_novedad DESC"

  // 🚀 OPTIMIZACIÓN: Ejecutar consulta usando pool compartido con deduplicación
  const rows = await db.executeBonusQuery(query, queryParams, true)
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

  // Procesar datos del último mes (global o específico)
  if (year && month) {
    // Si se proporcionó año y mes, usar esos valores directamente
    const lastMonthBaseBonus = getBaseBonusForYear(year)

    const lastMonthNovedades = novedades // ya filtradas

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
      year: year,
      month: month,
      bonusValue: lastMonthBaseBonus,
      deductionAmount: lastMonthDeduction,
      finalValue: lastMonthBaseBonus - lastMonthDeduction,
      monthName: monthNames[month - 1],
    }

    // Añadir a los meses disponibles
    availableMonths.push({
      year: year,
      month: month,
      monthName: monthNames[month - 1],
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

// Obtener todos los años disponibles para una lista de códigos
async function getAvailableYearsForCodes(connection: mysql.Connection, codigos: string[]): Promise<number[]> {
  if (codigos.length === 0) {
    return []
  }

  const placeholders = codigos.map(() => '?').join(',')
  const query = `
    SELECT DISTINCT YEAR(fecha_inicio_novedad) as year
    FROM novedades
    WHERE codigo_empleado IN (${placeholders})
    ORDER BY year DESC
  `
  
  // 🚀 OPTIMIZACIÓN: Ejecutar consulta usando pool compartido con deduplicación
  const rows = await db.executeBonusQuery(query, codigos, true)
  const years = (rows as any[]).map(r => r.year).filter(y => y !== null)
  
  // Si no hay años, devolver un fallback
  if (years.length === 0) {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => currentYear - i)
  }
  
  return years
}

export async function POST(request: NextRequest) {
  const { codigos, year, month } = await request.json()

  if (!codigos || !Array.isArray(codigos) || codigos.length === 0) {
    return NextResponse.json({ success: false, message: "Se requiere un array de códigos." }, { status: 400 })
  }

  try {
    // 🚀 OPTIMIZACIÓN: Usar pool compartido en lugar de conexión individual
    const db = getDatabase()
    console.log('🔗 Usando pool compartido de MySQL para bonuses (eliminando conexión individual)')

    // Obtener último año y mes global disponibles si no se proporcionan
    let processingYear = year || null
    let processingMonth: number | null = month || null

    if (!processingMonth) {
      // 🚀 OPTIMIZACIÓN: Usar pool compartido con cache para consulta de fecha máxima
      const maxDateRows = await db.executeBonusQuery<Array<{year: number, month: number}>>(
        `SELECT YEAR(MAX(fecha_inicio_novedad)) as year, MONTH(MAX(fecha_inicio_novedad)) as month FROM novedades`,
        [],
        true // Habilitar cache para esta consulta común
      )
      if (Array.isArray(maxDateRows) && maxDateRows.length > 0) {
        const row: any = maxDateRows[0]
        // Si no hay month o year no está acompañado de month, usar valores globales
        if (!processingMonth) processingMonth = row.month || new Date().getMonth() + 1
        if (!month) {
          // Si el request no especificó month, también ignoramos el year y usamos el global
          processingYear = row.year || new Date().getFullYear()
        }
      } else {
        // Fallback al año/mes actual si no hay datos
        if (!processingYear) processingYear = new Date().getFullYear()
        if (!processingMonth) processingMonth = new Date().getMonth() + 1
      }
    }

    // Obtener todos los años disponibles para los códigos solicitados
    const availableYears = await getAvailableYearsForCodes(connection, codigos)

    const results: { [key: string]: any } = {}
    
    for (const codigo of codigos) {
      const userData = await processUserData(connection, codigo, processingYear, processingMonth)
      results[codigo] = userData
    }

    return NextResponse.json({ 
      success: true, 
      results,
      availableYears, // Devolver la lista centralizada de años
      processedYear: processingYear, // Informar qué año se usó
      processedMonth: processingMonth // Informar qué mes se usó
    })
  } catch (error) {
    console.error("Error en el batch de bonos:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor." }, { status: 500 })
  } finally {
    // 🚀 OPTIMIZACIÓN: Pool se gestiona automáticamente, no necesita .end()
  }
}
