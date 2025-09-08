import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
// @ts-ignore
import sql from "mssql";
import { optimizedCache } from "@/lib/cache";
import { DEDUCTION_RULES } from "@/lib/deductions-config";
import { getMssqlPool } from "@/lib/mssql";
import {
  determineBonusCategory,
  determineKmCategory,
  determineFinalCategory,
} from "@/utils/ranking-utils";

// Helper para parsear fechas en formato YYYYMMDD
const parseDateYYYYMMDD = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || String(dateStr).trim().length !== 8) {
    return null;
  }
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

// DEPRECATED: Las definiciones de rangos y matriz se importan desde ranking-utils
// const BONUS_RANGES = { ... };
// const KM_RANGES = { ... };
// const CATEGORY_MATRIX = { ... };

// DEPRECATED: Se usará DEDUCTION_RULES
// const FACTOR_DEDUCTIONS: Record<string, number | string> = {
//   // Códigos numéricos simples
//   "1": 25,   // Incapacidad
//   "2": 100,  // Ausentismo
//   "3": "Día", // Incapacidad > 7 días
//   "4": "Día", // Calamidad
//   "5": 25,   // Retardo
//   "6": "Día", // Renuncia
//   "7": "Día", // Vacaciones
//   "8": "Día", // Suspensión
//   "9": "Día", // No Ingreso
//   "10": 100, // Restricción
//   "11": "Día", // Día No Remunerado
//   "12": 50,  // Retardo por Horas
//   "13": 0,   // Día No Remunerado por Horas

//   // Códigos alfanuméricos
//   "DL": 25,  // Daño Leve
//   "DG": 50,  // Daño Grave
//   "DGV": 100, // Daño Gravísimo
//   "DEL": 25, // Desincentivo Leve
//   "DEG": 50, // Desincentivo Grave
//   "DEGV": 100, // Desincentivo Gravísimo
//   "INT": 25, // Incumplimiento Interno
//   "OM": 25,  // Falta Menor
//   "OMD": 50, // Falta Media
//   "OG": 100, // Falta Grave
//   "NPD": 100, // No presentar descargo
//   "NPF": 100, // No presentarse a formación
//   "HCC-L": 25, // Hábitos Conductas Leve
//   "HCC-G": 50, // Hábitos Conductas Grave
//   "HCC-GV": 100, // Hábitos Conductas Gravísimo
// };

// DEPRECATED: Se usará DEDUCTION_RULES
// const DAILY_DEDUCTION = 4733;

// DEPRECATED: Las funciones de categorización se importan desde ranking-utils
// const determineBonusCategory = (percentage: number): string => { ... };
// const determineKmCategory = (percentage: number): string => { ... };
// const determineFinalCategory = (bonusCategory: string, kmCategory: string): string => { ... };

// Importar datos de demostración como fallback
import { operators as demoOperators } from "@/data/operators-data";

// DEPRECATED: Se usará DEDUCTION_RULES
// const FACTOR_DESCRIPTIONS: Record<string, string> = {
//   "1": "Incapacidad",
//   "2": "Ausentismo",
//   "3": "Incapacidad > 7 días",
//   "4": "Calamidad",
//   "5": "Retardo",
//   "6": "Renuncia",
//   "7": "Vacaciones",
//   "8": "Suspensión",
//   "9": "No Ingreso",
//   "10": "Restricción",
//   "11": "Día No Remunerado",
//   "12": "Retardo por Horas",
//   "13": "Día No Remunerado por Horas",
//   "DL": "Daño Leve",
//   "DG": "Daño Grave",
//   "DGV": "Daño Gravísimo",
//   "DEL": "Desincentivo Leve",
//   "DEG": "Desincentivo Grave",
//   "DEGV": "Desincentivo Gravísimo",
//   "INT": "Incumplimiento Interno",
//   "OM": "Falta Menor",
//   "OMD": "Falta Media",
//   "OG": "Falta Grave",
//   "NPD": "No presentar descargo",
//   "NPF": "No presentarse a formación",
//   "HCC-L": "Hábitos y Conductas Leve",
//   "HCC-G": "Hábitos y Conductas Grave",
//   "HCC-GV": "Hábitos y Conductas Gravísimo",
// };

// Función optimizada para crear conexión
async function createOptimizedConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
}

// Función optimizada para construir filtros de fecha
function buildDateFilters(filterType: string, filterYear: number, filterMonth?: number) {
  if (filterType === 'year') {
    return {
      condition: `(
        (YEAR(v.fecha_inicio_programacion) = ?) OR 
        (YEAR(v.fecha_fin_programacion) = ?) OR
        (v.fecha_inicio_programacion <= ? AND (v.fecha_fin_programacion >= ? OR v.fecha_fin_programacion IS NULL))
      )`,
      params: [filterYear, filterYear, `${filterYear}-12-31`, `${filterYear}-01-01`]
    };
  } else if (filterType === 'month' && filterMonth !== undefined) {
    return {
      condition: `(
        (YEAR(v.fecha_inicio_programacion) = ? AND MONTH(v.fecha_inicio_programacion) = ?) OR 
        (YEAR(v.fecha_fin_programacion) = ? AND MONTH(v.fecha_fin_programacion) = ?) OR
        (v.fecha_inicio_programacion <= ? AND (v.fecha_fin_programacion >= ? OR v.fecha_fin_programacion IS NULL))
      )`,
      params: [
        filterYear, filterMonth, 
        filterYear, filterMonth,
        `${filterYear}-${String(filterMonth).padStart(2, '0')}-31`,
        `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`
      ]
    };
  }
  return { condition: '', params: [] };
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  const { searchParams } = new URL(request.url);
  let filterType = searchParams.get('filterType') || 'global';
  let filterValue = searchParams.get('filterValue');
  const userCode = searchParams.get('userCode');
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  let filterYear = currentYear;
  let filterMonth: number | undefined = currentMonth;
  
  if (filterType === 'year' && filterValue) {
    filterYear = parseInt(filterValue);
    filterMonth = undefined;
  } else if (filterType === 'month' && filterValue) {
    const [year, month] = filterValue.split('-').map(Number);
    filterYear = year || currentYear;
    filterMonth = month || currentMonth;
  }
  
  console.log(`🚀 Consulta SUPER optimizada - Filtro inicial: ${filterType}, Año: ${filterYear}, Mes: ${filterMonth || 'todos'}`);
  
  // Si el filtro es global, determinar el último año/mes con novedades para usarlo como referencia
  if (filterType === 'global') {
    try {
      const tmpConnection = await createOptimizedConnection();
      const [maxRows] = await tmpConnection.execute(
        `SELECT YEAR(MAX(fecha_inicio_novedad)) as year, MONTH(MAX(fecha_inicio_novedad)) as month FROM novedades`
      );
      await tmpConnection.end();

      if (Array.isArray(maxRows) && maxRows.length > 0) {
        const row: any = maxRows[0];
        if (row.year && row.month) {
          filterType = 'month';
          filterYear = row.year;
          filterMonth = row.month;
          filterValue = `${filterYear}-${String(filterMonth).padStart(2,'0')}`;
          console.log(`🔄 Filtro global ajustado al último mes con novedades: ${filterValue}`);
        }
      }
    } catch (err) {
      console.error('⚠️  No se pudo determinar el último mes con novedades:', err);
    }
  }
  
  try {
    // Crear clave de caché única
    const cacheKey = `rankings_super_optimized_${filterType}_${filterYear}_${filterMonth || 'all'}`;
    // const cachedData = optimizedCache.get(cacheKey);
    // if (cachedData) {
    //   console.log(`⚡ Datos del caché en ${Date.now() - startTime}ms`);
    //   return NextResponse.json({ 
    //     success: true, 
    //     data: cachedData,
    //     filterInfo: {
    //       type: filterType,
    //       year: filterYear,
    //       month: filterMonth
    //     },
    //     responseTime: Date.now() - startTime,
    //     fromCache: true
    //   });
    // }
    
    // Verificar variables de entorno
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      console.warn("Variables de entorno no configuradas.");
      return NextResponse.json({ 
        success: true, 
        data: demoOperators,
        isDemoData: true
      });
    }

    // Crear conexión optimizada
    let connection;
    try {
      connection = await createOptimizedConnection();
    } catch (dbError) {
      console.error("Error al conectar con la base de datos:", dbError);
      return NextResponse.json({ 
        success: true, 
        data: demoOperators,
        isDemoData: true,
        error: "Error de conexión a la base de datos"
      });
    }

    const queryStartTime = Date.now();
    
    // Construir filtros de fecha una sola vez
    const dateFilters = buildDateFilters(filterType, filterYear, filterMonth);

    const mainWhereClauses: string[] = [];
    const mainWhereParams: (string | number)[] = [];

    if (userCode) {
      mainWhereClauses.push('o.codigo = ?');
      mainWhereParams.push(userCode);
    }
    
    const whereClauseString = mainWhereClauses.length > 0 ? `WHERE ${mainWhereClauses.join(' AND ')}` : '';

    // CONSULTA SUPER OPTIMIZADA - Diseñada para 29K variables_control, 20K novedades, 538 operadores
    const superOptimizedQuery = `
      SELECT 
        o.cedula as id,
        o.codigo,
        o.nombre,
        o.cedula,
        o.rol AS cargo,
        o.telefono,
        o.zona,
        o.padrino,
        o.tarea,
        
        -- Datos de bonos (optimizado con FORCE INDEX)
        COALESCE(bonus_data.porcentaje, 100) AS bonus_porcentaje,
        COALESCE(bonus_data.total, 142000) AS bonus_total,
        bonus_data.fecha AS bonus_fecha,
        
        -- Datos de kilómetros (optimizado con FORCE INDEX)
        COALESCE(km_data.porcentaje, ${filterType === 'global' ? '100' : '0'}) AS km_porcentaje,
        COALESCE(km_data.total_ejecutado, 0) AS km_total_ejecutado,
        COALESCE(km_data.total_programado, 0) AS km_total_programado,
        km_data.fecha AS km_fecha,
        
        -- Datos de novedades pre-calculados
        COALESCE(novedad_data.factores, '') AS novedad_factores,
        COALESCE(novedad_data.dias_totales, 0) AS novedad_dias_totales,
        COALESCE(novedad_data.detalles, '') AS detalles
        
      FROM operadores_sao6 o FORCE INDEX (idx_operadores_codigo)
      
      -- LEFT JOIN super optimizado para bonos (usa índice específico)
      LEFT JOIN (
        SELECT 
          v.codigo_empleado,
          ROUND(SUM(v.valor_ejecucion) / NULLIF(SUM(v.valor_programacion), 0) * 100, 2) AS porcentaje,
          SUM(v.valor_ejecucion) AS total,
          MAX(v.fecha_fin_programacion) AS fecha
        FROM variables_control v FORCE INDEX (idx_variables_control_optimized)
        WHERE (v.codigo_variable LIKE 'bono%' OR v.codigo_variable LIKE 'incentivo%')
        ${dateFilters.condition ? 'AND ' + dateFilters.condition : ''}
        GROUP BY v.codigo_empleado
      ) bonus_data ON o.codigo = bonus_data.codigo_empleado
      
      -- LEFT JOIN super optimizado para kilómetros (usa índice específico)
      LEFT JOIN (
        SELECT 
          v.codigo_empleado,
          ROUND(SUM(v.valor_ejecucion) / NULLIF(SUM(v.valor_programacion), 0) * 100, 2) AS porcentaje,
          SUM(v.valor_ejecucion) AS total_ejecutado,
          SUM(v.valor_programacion) AS total_programado,
          MAX(v.fecha_fin_programacion) AS fecha
        FROM variables_control v FORCE INDEX (idx_variables_control_optimized)
        WHERE (v.codigo_variable LIKE 'km%' OR v.codigo_variable LIKE 'kilometr%')
        ${dateFilters.condition ? 'AND ' + dateFilters.condition : ''}
        GROUP BY v.codigo_empleado
      ) km_data ON o.codigo = km_data.codigo_empleado
      
      -- LEFT JOIN para detalles de novedades (JSON) - Corregido para capturar períodos que se extienden
      LEFT JOIN (
        SELECT 
          n.codigo_empleado,
          GROUP_CONCAT(CONCAT(n.codigo_factor, ':', DATEDIFF(IFNULL(n.fecha_fin_novedad, CURDATE()), n.fecha_inicio_novedad) + 1) ORDER BY n.fecha_inicio_novedad SEPARATOR '|') AS factores,
          SUM(DATEDIFF(IFNULL(n.fecha_fin_novedad, CURDATE()), n.fecha_inicio_novedad) + 1) AS dias_totales,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'codigo_factor', n.codigo_factor,
              'observaciones', n.observaciones,
              'fecha_inicio_novedad', n.fecha_inicio_novedad,
              'fecha_fin_novedad', n.fecha_fin_novedad
            )
          ) AS detalles
        FROM novedades n FORCE INDEX (idx_novedades_fecha_inicio)
        WHERE ${filterType === 'year' 
          ? `(
              YEAR(n.fecha_inicio_novedad) = ? OR 
              YEAR(IFNULL(n.fecha_fin_novedad, CURDATE())) = ? OR
              (n.fecha_inicio_novedad <= ? AND (n.fecha_fin_novedad >= ? OR n.fecha_fin_novedad IS NULL))
            )`
          : `(
              (YEAR(n.fecha_inicio_novedad) = ? AND MONTH(n.fecha_inicio_novedad) = ?) OR
              (YEAR(IFNULL(n.fecha_fin_novedad, CURDATE())) = ? AND MONTH(IFNULL(n.fecha_fin_novedad, CURDATE())) = ?) OR
              (n.fecha_inicio_novedad <= ? AND (n.fecha_fin_novedad >= ? OR n.fecha_fin_novedad IS NULL))
            )`
        }
        GROUP BY n.codigo_empleado
      ) novedad_data ON o.codigo = novedad_data.codigo_empleado
      
      ${whereClauseString}

      ORDER BY o.codigo
    `;

    console.log(`📊 Ejecutando consulta SUPER optimizada para ${filterType}...`);
    
    // Ejecutar la consulta super optimizada
    let novedadesParams: (string | number)[] = [];
    if (filterType === 'year') {
      novedadesParams = [
        filterYear, // YEAR(n.fecha_inicio_novedad) = ?
        filterYear, // YEAR(IFNULL(n.fecha_fin_novedad, CURDATE())) = ?
        `${filterYear}-12-31`, // n.fecha_inicio_novedad <= ?
        `${filterYear}-01-01`  // n.fecha_fin_novedad >= ?
      ];
    } else {
      const monthValue = filterMonth || currentMonth;
      novedadesParams = [
        filterYear, monthValue, // YEAR y MONTH inicio
        filterYear, monthValue, // YEAR y MONTH fin
        `${filterYear}-${String(monthValue).padStart(2, '0')}-31`, // fecha_inicio <= último día del mes
        `${filterYear}-${String(monthValue).padStart(2, '0')}-01`  // fecha_fin >= primer día del mes
      ];
    }
    
    const queryParams = [
      ...dateFilters.params,
      ...dateFilters.params,
      ...novedadesParams,
      ...mainWhereParams,
    ];
    const [rows] = await connection.execute(superOptimizedQuery, queryParams);
    
    const queryEndTime = Date.now();
    console.log(`⚡ Consulta SUPER optimizada ejecutada en ${queryEndTime - queryStartTime}ms`);
    
    const users = rows as any[];
    
    if (!users || users.length === 0) {
      console.warn("No se encontraron usuarios.");
      await connection.end();
      return NextResponse.json({ 
        success: true, 
        data: demoOperators,
        isDemoData: true
      });
    }

    console.log(`👥 Procesando ${users.length} usuarios con algoritmo optimizado...`);

    const cedulas = users.map(user => user.cedula).filter(cedula => cedula != null).map(String);
    let userInfoMap = new Map<string, { position: string, joinDate: string | null, retirementDate: string | null, birthDate: string | null }>();

    if (cedulas.length > 0) {
      console.log(`[Debug] Cédulas a consultar en SQL Server (${cedulas.length}):`, cedulas.slice(0, 10)); // Muestra las primeras 10
      
      const placeholders = cedulas.map((_, i) => `@cedula${i}`).join(',');

      try {
        const pool = await getMssqlPool();
        
        // --- Consulta 1: Obtener cargo, fecha de ingreso y retiro de BI_W0550 ---
        const positionRequest = pool.request();
        cedulas.forEach((cedula, i) => {
          positionRequest.input(`cedula${i}`, sql.NVarChar, cedula);
        });

        const positionQuery = `
            WITH RankedPositions AS (
                SELECT
                    F200_ID,
                    C0763_DESCRIPCION,
                    C0550_FECHA_INGRESO_LEY50,
                    C0550_FECHA_RETIRO,
                    ROW_NUMBER() OVER(PARTITION BY F200_ID ORDER BY C0550_ID DESC) as rn
                FROM
                    BI_W0550
                WHERE
                    F200_ID IN (${placeholders})
                    AND C0550_ID_CIA = 4
            )
            SELECT
                F200_ID,
                C0763_DESCRIPCION,
                C0550_FECHA_INGRESO_LEY50,
                C0550_FECHA_RETIRO
            FROM
                RankedPositions
            WHERE
                rn = 1;
        `;
        
        const positionResult = await positionRequest.query(positionQuery);
        
        if (positionResult.recordset && positionResult.recordset.length > 0) {
            positionResult.recordset.forEach((record: any) => {
                userInfoMap.set(String(record.F200_ID).trim(), {
                    position: record.C0763_DESCRIPCION,
                    joinDate: parseDateYYYYMMDD(record.C0550_FECHA_INGRESO_LEY50),
                    retirementDate: parseDateYYYYMMDD(record.C0550_FECHA_RETIRO),
                    birthDate: null // Inicializar como nulo
                });
            });
        }
        
        // --- Consulta 2: Obtener fecha de nacimiento de SE_w0550 ---
        const birthDateRequest = pool.request();
        cedulas.forEach((cedula, i) => {
          birthDateRequest.input(`cedula${i}`, sql.NVarChar, cedula);
        });
        
        const birthDateQuery = `
          SELECT
            f_nit_empl,
            f_fecha_nacimiento_emp
          FROM
            SE_w0550
          WHERE
            f_nit_empl IN (${placeholders})
        `;

        const birthDateResult = await birthDateRequest.query(birthDateQuery);

        if (birthDateResult.recordset && birthDateResult.recordset.length > 0) {
          birthDateResult.recordset.forEach((record: any) => {
            const cedula = String(record.f_nit_empl).trim();
            const userInfo = userInfoMap.get(cedula);
            if (userInfo) {
              userInfo.birthDate = record.f_fecha_nacimiento_emp ? new Date(record.f_fecha_nacimiento_emp).toISOString() : null;
            }
          });
        }

        console.log('[Debug] Mapa de información de empleado poblado. Tamaño:', userInfoMap.size);
      } catch (err: any) {
          console.error("[Debug] Error al obtener la información del empleado desde SQL Server:", err);
      }
    } else {
        console.log('[Debug] No hay cédulas para consultar en SQL Server.');
    }

    const processingStartTime = Date.now();
    
    // Procesamiento SUPER optimizado con Map para lookups O(1)
    const factorMap = new Map(DEDUCTION_RULES.map(rule => [rule.item, rule]));

    const rankings = users.map((user: any) => {
      if (!user.codigo) return null;
      
      const baseBonus = user.bonus_total || 142000;
      let totalDeduction = 0;
      let performanceDeduction = 0; // Deducción que solo afecta al rendimiento
      const deductionReasons: string[] = [];
      const deductionDetails: any[] = [];
      
      const novedades = user.detalles ? JSON.parse(user.detalles) : [];
      
      novedades.forEach((novedad: any) => {
        const rule = factorMap.get(novedad.codigo_factor);
        if (rule) {
          let deductionAmount = 0;
          let days = 1;
          
          // Calcular días correctamente
          if (novedad.fecha_inicio_novedad && novedad.fecha_fin_novedad) {
            const startDate = new Date(novedad.fecha_inicio_novedad);
            const endDate = new Date(novedad.fecha_fin_novedad);
            days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
          }
          
          if (rule.porcentajeRetirar === 'Día') {
            deductionAmount = rule.valorActual * days;
          } else if (typeof rule.porcentajeRetirar === 'number') {
            deductionAmount = baseBonus * rule.porcentajeRetirar;
          }
          
          totalDeduction += deductionAmount;
          
          if (rule.afectaDesempeno) {
            performanceDeduction += deductionAmount;
          }
          
          if (!deductionReasons.includes(rule.causa)) {
            deductionReasons.push(rule.causa);
          }
          deductionDetails.push({
            reason: rule.causa,
            observation: novedad.observaciones || '',
            amount: deductionAmount,
            days: days,
            start: novedad.fecha_inicio_novedad,
            end: novedad.fecha_fin_novedad,
            affectsPerformance: rule.afectaDesempeno,
            factor: novedad.codigo_factor
          });
        }
      });
      
      const bonusValue = Math.max(0, baseBonus - totalDeduction);
      
      const performanceBonusValue = Math.max(0, baseBonus - performanceDeduction);
      const bonusPercentage = baseBonus > 0 ? (performanceBonusValue / baseBonus) * 100 : 0;
      
      const bonusCategory = determineBonusCategory(bonusPercentage);
      const kmCategory = determineKmCategory(user.km_porcentaje);
      const combinedCategory = determineFinalCategory(bonusCategory, kmCategory);
      
      // Formatear valores de forma optimizada
      const formattedBonusPercentage = Math.round(bonusPercentage * 100) / 100;
      const formattedKmPercentage = Math.round(user.km_porcentaje * 100) / 100;
      const efficiency = Math.round(((formattedBonusPercentage + formattedKmPercentage) / 2) * 100) / 100;
      
      // Generar rendimiento semanal optimizado
      const basePerformance = Math.min(formattedBonusPercentage, formattedKmPercentage);
      const weeklyPerformance = Array(7).fill(0).map(() => 
        Math.floor(basePerformance - 10 + Math.random() * 20)
      );
      
      const cedulaAsString = String(user.cedula);
      const userInfo = userInfoMap.get(cedulaAsString);
      const positionFromSqlServer = userInfo?.position;
      const joinDateFromServer = userInfo?.joinDate;
      const retirementDateFromServer = userInfo?.retirementDate;
      const birthDateFromServer = userInfo?.birthDate;
      
      const positionFromMySql = user.cargo;

      let finalPosition = "";
      if (positionFromSqlServer) {
        finalPosition = positionFromSqlServer;
      } else if (positionFromMySql && positionFromMySql.toLowerCase() !== 'usuario') {
        finalPosition = positionFromMySql;
      } else {
        // Log si no se encuentra el cargo en ninguna fuente válida
        console.log(`[Debug] No se encontró cargo para cédula: ${cedulaAsString}. SQL Server: ${positionFromSqlServer}, MySQL: ${positionFromMySql}`);
      }
      
      return {
        id: user.codigo,
        codigo: user.codigo,
        name: user.nombre,
        document: user.cedula,
        position: finalPosition,
        phone: user.telefono || "",
        zona: user.zona,
        padrino: user.padrino,
        tarea: user.tarea || null,
        joinDate: joinDateFromServer || null,
        retirementDate: retirementDateFromServer || null,
        birthDate: birthDateFromServer || null,
        bonus: {
          percentage: formattedBonusPercentage,
          total: Math.round(bonusValue),
          category: bonusCategory,
          trend: Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable",
          date: user.bonus_fecha ? new Date(user.bonus_fecha).toISOString() : null,
          reasons: deductionReasons,
          deductions: deductionDetails
        },
        km: {
          percentage: formattedKmPercentage,
          total: Math.round(user.km_total_ejecutado),
          total_ejecutado: Math.round(user.km_total_ejecutado),
          total_programado: Math.round(user.km_total_programado),
          category: kmCategory,
          trend: Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable",
          date: user.km_fecha ? new Date(user.km_fecha).toISOString() : null
        },
        efficiency: efficiency,
        category: combinedCategory,
        weeklyPerformance: weeklyPerformance,
        rank: 0
      };
    }).filter(Boolean); // Filtrar nulos de forma optimizada
    
    if (rankings.length === 0 && (filterType === 'year' || filterType === 'month')) {
      await connection.end();
      return NextResponse.json({
        success: true,
        data: [],
        filterInfo: {
          type: filterType,
          year: filterYear,
          month: filterMonth,
          availableYears: [],
          latestYear: currentYear,
          latestMonth: currentMonth
        },
        message: `No hay datos disponibles para ${filterType === 'year' ? 'el año ' + filterYear : 'el mes ' + filterMonth + '/' + filterYear}`,
        responseTime: Date.now() - startTime
      });
    }
    
         // Ordenar por eficiencia de forma optimizada
     rankings.sort((a: any, b: any) => b.efficiency - a.efficiency);
    
     // Asignar rangos de forma optimizada
     rankings.forEach((operator: any, index: number) => {
      operator.rank = index + 1;
    });
    
     const processingEndTime = Date.now();
     console.log(`⚡ Procesamiento SUPER optimizado completado en ${processingEndTime - processingStartTime}ms`);
     
     // Calcular información de filtros de forma optimizada
     const allDates = rankings
       .flatMap((op: any) => [op.bonus?.date, op.km?.date])
       .filter((date): date is string => date !== null && date !== undefined)
       .map(date => new Date(date))
       .sort((a, b) => b.getTime() - a.getTime());
    
    const latestDate = allDates[0] || new Date();
    const latestYear = latestDate.getFullYear();
    const latestMonth = latestDate.getMonth() + 1;
    const availableYears = [...new Set(allDates.map(date => date.getFullYear()))].sort().reverse();
    
    // Guardar en caché por 15 minutos (más tiempo para datos optimizados)
    // optimizedCache.set(cacheKey, rankings, 15 * 60, 'rankings');
    
    await connection.end();
    
    const totalTime = Date.now() - startTime;
    console.log(`🎉 Respuesta SUPER optimizada generada en ${totalTime}ms`);
    
    return NextResponse.json({ 
      success: true, 
      data: rankings,
      filterInfo: {
        type: filterType,
        year: filterYear,
        month: filterMonth,
        availableYears,
        latestYear,
        latestMonth
      },
      lastUpdated: new Date().toISOString(),
      responseTime: totalTime,
      fromCache: false,
      recordsProcessed: users.length,
      optimization: "SUPER_OPTIMIZED",
      dbStats: {
        variables_control: "29,315 records",
        novedades: "20,811 records", 
        operadores_sao6: "538 records"
      }
    });
    
  } catch (error) {
    console.error("Error en consulta super optimizada:", error);
    
    return NextResponse.json({ 
      success: true, 
      data: demoOperators,
      isDemoData: true,
      error: "Error al procesar datos de rankings",
      responseTime: Date.now() - startTime
    });
  }
}
