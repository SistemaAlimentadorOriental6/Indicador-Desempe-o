import { withErrorHandling, apiResponse, QueryValidator, commonParams } from '@/lib/api-helpers'
import { getBonusesService } from '@/lib/services/bonuses.service'

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

async function handleGet(request: Request) {
  const { searchParams } = new URL(request.url)
  
  // Validar parámetros
  const validator = new QueryValidator(searchParams)
  validator
    .required('codigo', 'Código de usuario')
    .optionalNumber('year', 'Año')
    .optionalNumber('month', 'Mes')
  
  validator.throwIfErrors()

  // Extraer parámetros validados
  const userCode = commonParams.getUserCode(searchParams)!
  const { year, month } = commonParams.getDateFilters(searchParams)

  console.log(`[Bonos] Solicitud para usuario: ${userCode}, año: ${year || 'actual'}, mes: ${month || 'actual'}`)

  // Obtener servicio de bonos
  const bonusesService = getBonusesService()

  try {
    // Obtener datos usando el servicio
    const result = await bonusesService.getUserBonuses({
      userCode,
      year,
      month,
    })

    // Verificar si hay datos
    if (!result.deductions || result.deductions.length === 0) {
      console.log(`[Bonos] No hay deducciones para usuario ${userCode}, año ${year}, mes ${month}`)
      console.log(`[Bonos] Devolviendo bono completo: ${result.baseBonus}`)
      
      const response = {
        success: true,
        data: {
          baseBonus: result.baseBonus,
          finalBonus: result.baseBonus,
          deductionPercentage: 0,
          deductionAmount: 0,
          deductions: [],
          availableYears: result.availableYears,
          availableMonths: result.availableMonths,
          summary: {
            totalProgrammed: result.baseBonus,
            totalExecuted: result.baseBonus,
            percentage: 100,
          },
        },
        message: "No se encontraron novedades para este usuario",
        baseBonus: result.baseBonus,
        deductionPercentage: 0,
        finalBonus: result.baseBonus,
        deductionAmount: 0,
        deductions: [],
        bonusesByYear: {},
        availableBonuses: 0,
        availableYears: result.availableYears,
        availableMonths: result.availableMonths,
        summary: {
          availableBonuses: 0,
          totalProgrammed: result.baseBonus,
          totalExecuted: result.baseBonus,
          percentage: 100,
        },
      }
      
      console.log(`[Bonos] Respuesta completa:`, response)
      return apiResponse.success(response)
    }

    console.log(`[Bonos] Datos obtenidos: ${result.deductions.length} deducciones`)

    // Respuesta exitosa con todos los datos del servicio
    const response = {
      success: true,
      data: {
        baseBonus: result.baseBonus,
        finalBonus: result.finalBonus,
        deductionPercentage: result.deductionPercentage,
        deductionAmount: result.deductionAmount,
        deductions: result.deductions,
        availableYears: result.availableYears,
        availableMonths: result.availableMonths,
        summary: result.summary,
      },
      availableBonuses: Object.values(result.bonusesByYear).reduce((sum, count) => sum + count, 0),
      baseBonus: result.baseBonus,
      deductionPercentage: result.deductionPercentage,
      deductionAmount: result.deductionAmount,
      finalBonus: result.finalBonus,
      expiresInDays: result.expiresInDays,
      bonusesByYear: result.bonusesByYear,
      deductions: result.deductions,
      lastMonthData: result.lastMonthData,
      availableYears: result.availableYears,
      availableMonths: result.availableMonths,
      summary: result.summary,
    }
    
    console.log(`[Bonos] Respuesta con deducciones:`, {
      baseBonus: response.baseBonus,
      finalBonus: response.finalBonus,
      deductionAmount: response.deductionAmount,
      deductionsCount: response.deductions.length
    })
    
    return apiResponse.success(response)

  } catch (error) {
    console.error('[Bonos] Error al obtener datos:', error)
    throw error // Se manejará en withErrorHandling
  }
}

// Exportar el handler envuelto con manejo de errores
export const GET = withErrorHandling(handleGet)

// Función para obtener el concepto basado en el código de factor
function getConceptoByCode(codigo: string): string {
  const conceptos: Record<string, string> = {
    // Códigos numéricos
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
    "DL": "Daño Leve",
    "DG": "Daño Grave",
    "DGV": "Daño Gravísimo",
    "DEL": "Desincentivo Leve",
    "DEG": "Desincentivo Grave",
    "DEGV": "Desincentivo Gravísimo",
    "INT": "Incumplimiento Interno",
    "OM": "Falta Menor",
    "OMD": "Falta Media",
    "OG": "Falta Grave",
    "NPD": "No presentar descargo",
  }

  return conceptos[codigo] || `Código ${codigo}`
}

// Función para obtener el porcentaje de descuento basado en el código
function getDescuentoPorcentaje(codigo: string): number | string {
  const descuentos: Record<string, number | string> = {
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
    "13": 0, // Día No Remunerado por Horas

    // Códigos alfabéticos
    "DL": 25, // Daño Leve
    "DG": 50, // Daño Grave
    "DGV": 100, // Daño Gravísimo
    "DEL": 25, // Desincentivo Leve
    "DEG": 50, // Desincentivo Grave
    "DEGV": 100, // Desincentivo Gravísimo
    "INT": 25, // Incumplimiento Interno
    "OM": 25, // Falta Menor
    "OMD": 50, // Falta Media
    "OG": 100, // Falta Grave
    "NPD": 100 // No presentar descargo
  }

  return descuentos[codigo] || 0
}
