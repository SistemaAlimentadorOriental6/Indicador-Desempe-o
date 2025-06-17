import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { cache } from "@/utils/server-cache";

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
};

// Valor por día para deducciones basadas en días
const DAILY_DEDUCTION = 4333;

// Rangos de porcentajes para categorías de bonos
const BONUS_RANGES = {
  Oro: { min: 100, max: Infinity },
  Plata: { min: 95, max: 100 },
  Bronce: { min: 90, max: 95 },
  Mejorar: { min: 60, max: 90 },
  "Taller Conciencia": { min: 0, max: 60 }
};

// Rangos de porcentajes para categorías de kilómetros
const KM_RANGES = {
  Oro: { min: 94, max: Infinity },
  Plata: { min: 90, max: 94 },
  Bronce: { min: 85, max: 90 },
  Mejorar: { min: 70, max: 85 },
  "Taller Conciencia": { min: 0, max: 70 }
};

// Matriz de valoración cualitativa para determinar la categoría final
const CATEGORY_MATRIX: Record<string, Record<string, string>> = {
  Oro: {
    Oro: "Oro",
    Plata: "Plata",
    Bronce: "Plata",
    Mejorar: "Bronce",
    "Taller Conciencia": "Bronce"
  },
  Plata: {
    Oro: "Plata",
    Plata: "Plata",
    Bronce: "Bronce",
    Mejorar: "Bronce",
    "Taller Conciencia": "Bronce"
  },
  Bronce: {
    Oro: "Plata",
    Plata: "Plata",
    Bronce: "Bronce",
    Mejorar: "Bronce",
    "Taller Conciencia": "Bronce"
  },
  Mejorar: {
    Oro: "Mejorar",
    Plata: "Mejorar",
    Bronce: "Mejorar",
    Mejorar: "Mejorar",
    "Taller Conciencia": "Taller Conciencia"
  },
  "Taller Conciencia": {
    Oro: "Taller Conciencia",
    Plata: "Taller Conciencia",
    Bronce: "Taller Conciencia",
    Mejorar: "Taller Conciencia",
    "Taller Conciencia": "Taller Conciencia"
  }
};

// Determina la categoría de bono basada en el porcentaje
const determineBonusCategory = (percentage: number): string => {
  for (const [category, range] of Object.entries(BONUS_RANGES)) {
    if (percentage >= range.min && percentage < range.max) {
      return category;
    }
  }
  return "Taller Conciencia"; // Categoría por defecto
};

// Determina la categoría de kilómetros basada en el porcentaje
const determineKmCategory = (percentage: number): string => {
  for (const [category, range] of Object.entries(KM_RANGES)) {
    if (percentage >= range.min && percentage < range.max) {
      return category;
    }
  }
  return "Taller Conciencia"; // Categoría por defecto
};

// Determina la categoría final basada en la matriz de valoración cualitativa
const determineFinalCategory = (bonusCategory: string, kmCategory: string): string => {
  return CATEGORY_MATRIX[bonusCategory]?.[kmCategory] || "Taller Conciencia";
};

// Importar datos de demostración como fallback
import { operators as demoOperators } from "@/data/operators-data";

export async function GET(request: Request) {
  // Obtener parámetros de filtro de tiempo de la URL
  const { searchParams } = new URL(request.url);
  const filterType = searchParams.get('filterType') || 'global';
  const filterValue = searchParams.get('filterValue');
  
  // Obtener fecha actual para filtros por defecto
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Determinar año y mes para filtrar (por defecto, el último mes)
  let filterYear = currentYear;
  let filterMonth: number | undefined = currentMonth;
  
  if (filterType === 'year' && filterValue) {
    filterYear = parseInt(filterValue);
    filterMonth = undefined; // Si filtramos por año, no filtramos por mes específico
  } else if (filterType === 'month' && filterValue) {
    // filterValue formato: YYYY-MM
    const [year, month] = filterValue.split('-').map(Number);
    filterYear = year || currentYear;
    filterMonth = month || currentMonth;
  }
  
  console.log(`Filtro aplicado: ${filterType}, Año: ${filterYear}, Mes: ${filterMonth || 'todos'}`);
  
  // Verificar si estamos buscando datos para un mes/año que existe en la tabla
  console.log(`Buscando datos para: ${filterType === 'month' ? `mes ${filterMonth}/${filterYear}` : filterType === 'year' ? `año ${filterYear}` : 'todos los datos'}`);
  
  try {
    // Para desarrollo, omitimos la verificación de autenticación
    // En un entorno de producción, aquí iría la lógica de autenticación

    // Crear una clave de caché única basada en los filtros de tiempo
    const cacheKey = `rankings_data_${filterType}_${filterYear}_${filterMonth || 'all'}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({ 
        success: true, 
        data: cachedData,
        filterInfo: {
          type: filterType,
          year: filterYear,
          month: filterMonth
        }
      });
    }
    
    // Verificar si las variables de entorno están configuradas
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      console.warn("Variables de entorno de base de datos no configuradas. Usando datos de demostración.");
      return NextResponse.json({ 
        success: true, 
        data: demoOperators,
        isDemoData: true
      });
    }

    // Intentar crear conexión a la base de datos MySQL
    let connection;
    try {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      });
    } catch (dbError) {
      console.error("Error al conectar con la base de datos:", dbError);
      return NextResponse.json({ 
        success: true, 
        data: demoOperators,
        isDemoData: true,
        error: "Error de conexión a la base de datos"
      });
    }

    // Obtener datos de usuarios (de la tabla operadores_sao6)
    const [usersRows] = await connection.execute(`
      SELECT 
        codigo, 
        nombre, 
        cedula, 
        rol AS cargo, 
        telefono,
        NULL AS fecha_ingreso
      FROM operadores_sao6
    `);

    // Construir la consulta SQL para bonos con filtros de tiempo
    let bonusQuery = `
      SELECT 
        v.codigo_empleado AS codigo,
        COALESCE(ROUND(SUM(v.valor_ejecucion) / NULLIF(SUM(v.valor_programacion), 0) * 100, 2), 0) AS porcentaje,
        COALESCE(SUM(v.valor_ejecucion), 0) AS total,
        MAX(v.fecha_fin_ejecucion) AS fecha
      FROM variables_control v
      WHERE (v.codigo_variable LIKE '%bono%' OR v.codigo_variable LIKE '%incentivo%')
    `;
    
    // Aplicar filtros de tiempo según el tipo de filtro
    if (filterType === 'year') {
      bonusQuery += ` AND (
        YEAR(v.fecha_inicio_programacion) = ${filterYear} OR
        YEAR(v.fecha_fin_programacion) = ${filterYear} OR
        (v.fecha_inicio_programacion <= '${filterYear}-12-31' AND v.fecha_fin_programacion >= '${filterYear}-01-01')
      )`;
      console.log(`Aplicando filtro de año ${filterYear} a la consulta de bonos`);
    } else if (filterType === 'month' && filterMonth !== undefined) {
      // Para filtros de mes, considerar tanto fecha_inicio_programacion como fecha_fin_programacion
      const formattedMonth = filterMonth.toString().padStart(2, '0');
      const startDate = `${filterYear}-${formattedMonth}-01`;
      const lastDay = new Date(filterYear, filterMonth, 0).getDate();
      const endDate = `${filterYear}-${formattedMonth}-${lastDay}`;
      
      bonusQuery += ` AND (
        (YEAR(v.fecha_inicio_programacion) = ${filterYear} AND MONTH(v.fecha_inicio_programacion) = ${filterMonth}) OR
        (YEAR(v.fecha_fin_programacion) = ${filterYear} AND MONTH(v.fecha_fin_programacion) = ${filterMonth}) OR
        (v.fecha_inicio_programacion <= '${endDate}' AND v.fecha_fin_programacion >= '${startDate}')
      )`;
      console.log(`Aplicando filtro de mes ${filterMonth}/${filterYear} a la consulta de bonos`);
      console.log(`Rango de fechas para bonos: ${startDate} a ${endDate}`);
    }
    
    bonusQuery += ` GROUP BY v.codigo_empleado`;
    
    console.log('Consulta SQL para bonos:');
    console.log(bonusQuery);
    
    // Ejecutar la consulta con los filtros aplicados
    const [bonusRows] = await connection.execute(bonusQuery);
    
    console.log(`Datos de bonos obtenidos: ${(bonusRows as any[]).length} registros`);
    if ((bonusRows as any[]).length > 0) {
      console.log('Muestra de datos de bonos:', JSON.stringify((bonusRows as any[]).slice(0, 2), null, 2));
    } else {
      console.log('No se encontraron datos de bonos para el filtro aplicado');
    }
    
    // Consulta para obtener las novedades (descuentos) por empleado
    const [noveltyRows] = await connection.execute(`
      SELECT 
        n.codigo_empleado AS codigo,
        n.codigo_factor,
        DATEDIFF(IFNULL(n.fecha_fin_novedad, CURDATE()), n.fecha_inicio_novedad) + 1 as dias_novedad
      FROM novedades n
      WHERE n.fecha_inicio_novedad >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    `);

    console.log('Datos de novedades obtenidos:', JSON.stringify(noveltyRows, null, 2));
    
    // Construir la consulta SQL para kilómetros con filtros de tiempo
    let kmQuery = `
      SELECT 
        v.codigo_empleado AS codigo,
        COALESCE(ROUND(SUM(v.valor_ejecucion) / NULLIF(SUM(v.valor_programacion), 0) * 100, 2), 0) AS porcentaje,
        COALESCE(SUM(v.valor_ejecucion), 0) AS total_ejecutado,
        COALESCE(SUM(v.valor_programacion), 0) AS total_programado,
        MAX(v.fecha_fin_ejecucion) AS fecha
      FROM variables_control v
      WHERE (v.codigo_variable LIKE '%km%' OR v.codigo_variable LIKE '%kilometr%')
    `;
    
    // Aplicar filtros de tiempo según el tipo de filtro
    if (filterType === 'year') {
      kmQuery += ` AND (
        YEAR(v.fecha_inicio_programacion) = ${filterYear} OR
        YEAR(v.fecha_fin_programacion) = ${filterYear} OR
        (v.fecha_inicio_programacion <= '${filterYear}-12-31' AND v.fecha_fin_programacion >= '${filterYear}-01-01')
      )`;
      console.log(`Aplicando filtro de año ${filterYear} a la consulta de kilómetros`);
    } else if (filterType === 'month' && filterMonth !== undefined) {
      // Para filtros de mes, considerar tanto fecha_inicio_programacion como fecha_fin_programacion
      const formattedMonth = filterMonth.toString().padStart(2, '0');
      const startDate = `${filterYear}-${formattedMonth}-01`;
      const lastDay = new Date(filterYear, filterMonth, 0).getDate();
      const endDate = `${filterYear}-${formattedMonth}-${lastDay}`;
      
      kmQuery += ` AND (
        (YEAR(v.fecha_inicio_programacion) = ${filterYear} AND MONTH(v.fecha_inicio_programacion) = ${filterMonth}) OR
        (YEAR(v.fecha_fin_programacion) = ${filterYear} AND MONTH(v.fecha_fin_programacion) = ${filterMonth}) OR
        (v.fecha_inicio_programacion <= '${endDate}' AND v.fecha_fin_programacion >= '${startDate}')
      )`;
      console.log(`Aplicando filtro de mes ${filterMonth}/${filterYear} a la consulta de kilómetros`);
      console.log(`Rango de fechas: ${startDate} a ${endDate}`);
    }
    
    kmQuery += ` GROUP BY v.codigo_empleado`;
    
    console.log('Consulta SQL para kilómetros:');
    console.log(kmQuery);
    
    // Ejecutar la consulta con los filtros aplicados
    const [kmRows] = await connection.execute(kmQuery);

    console.log(`Datos de kilómetros obtenidos: ${(kmRows as any[]).length} registros`);
    if ((kmRows as any[]).length > 0) {
      console.log('Muestra de datos de kilómetros:', JSON.stringify((kmRows as any[]).slice(0, 2), null, 2));
    } else {
      console.log('No se encontraron datos de kilómetros para el filtro aplicado');
    }
    
    // Verificar si se obtuvieron datos
    if (!usersRows || (usersRows as any[]).length === 0) {
      console.warn("No se encontraron usuarios en la base de datos. Usando datos de demostración.");
      await connection.end(); // Cerrar la conexión antes de retornar
      return NextResponse.json({ 
        success: true, 
        data: demoOperators,
        isDemoData: true
      });
    }

    // Procesar y combinar los datos
    const users = usersRows as any[] || [];
    const bonusData = bonusRows as any[] || [];
    const kmData = kmRows as any[] || [];
    const noveltyData = noveltyRows as any[] || [];
    
    console.log('Datos de novedades obtenidos:', JSON.stringify(noveltyData, null, 2));

    // Mapear los datos de usuarios a la estructura de operadores
    let rankings = users.map((user: any) => {
      // Buscar datos de bonos para este usuario
      const userBonus = bonusData.find((b: any) => b.codigo === user.codigo);
      console.log(`Buscando bono para usuario ${user.codigo}:`, userBonus);
      
      // Si no hay datos de bonos, usar valores predeterminados
      let bonusValue = userBonus ? userBonus.total : 142000;
      let bonusPercentage = userBonus ? Math.min(userBonus.porcentaje, 100) : 100;
      
      // Buscar novedades (descuentos) para este usuario
      const userNovelties = noveltyData.filter(n => n.codigo === user.codigo);
      
      // Calcular descuentos basados en las novedades
      if (userNovelties.length > 0) {
        console.log(`Aplicando ${userNovelties.length} descuentos para usuario ${user.codigo}`);
        
        // Valor base para calcular descuentos porcentuales
        const baseForDeductions = bonusValue;
        let totalDeduction = 0;
        
        userNovelties.forEach(novedad => {
          const factorValue = FACTOR_DEDUCTIONS[novedad.codigo_factor];
          
          if (factorValue !== undefined) {
            if (factorValue === "Día") {
              const dias = novedad.dias_novedad || 1;
              const deduction = DAILY_DEDUCTION * dias;
              console.log(`Descuento por días: ${deduction} (${dias} días)`);
              totalDeduction += deduction;
            } else {
              const deduction = (baseForDeductions * (factorValue as number)) / 100;
              console.log(`Descuento porcentual: ${deduction} (${factorValue}%)`);
              totalDeduction += deduction;
            }
          }
        });
        
        // Limitar el descuento al valor total del bono
        totalDeduction = Math.min(totalDeduction, bonusValue);
        
        // Aplicar descuentos
        bonusValue -= totalDeduction;
        
        // Recalcular porcentaje
        if (baseForDeductions > 0) {
          bonusPercentage = Math.min((bonusValue / baseForDeductions) * 100, 100);
        }
        
        console.log(`Bono final para ${user.codigo}: ${bonusValue} (${bonusPercentage.toFixed(2)}%)`);
      }
      
      const bonusData_processed = {
        porcentaje: bonusPercentage,
        total: bonusValue,
        fecha: userBonus ? userBonus.fecha : null
      };
      
      // Buscar datos de kilómetros para este usuario
      const userKm = kmData.find(k => k.codigo === user.codigo);
      
      // Si no hay datos de kilómetros, usar valores predeterminados solo si no estamos filtrando por año o mes
      // Si estamos filtrando por año o mes y no hay datos, no mostrar valores predeterminados
      const kmData_processed = userKm ? {
        porcentaje: Math.min(userKm.porcentaje, 100), // Limitar a 100% máximo
        total: userKm.total_ejecutado,
        total_ejecutado: userKm.total_ejecutado,
        total_programado: userKm.total_programado,
        fecha: userKm.fecha
      } : (filterType === 'global' ? {
        porcentaje: 100, // Valor predeterminado 100% solo para filtro global
        total: 0, // Sin valor predeterminado para filtros específicos
        total_ejecutado: 0,
        total_programado: 0,
        fecha: null
      } : null); // Retornar null para indicar que no hay datos para este período
      
      // Si no hay datos de kilómetros para el período filtrado, omitir este operador
      if (kmData_processed === null) {
        return null; // Este operador será filtrado más adelante
      }
      
      // Calcular categorías
      const bonusCategory = determineBonusCategory(bonusData_processed.porcentaje);
      const kmCategory = determineKmCategory(kmData_processed.porcentaje);
      const combinedCategory = determineFinalCategory(bonusCategory, kmCategory);
      
      // Calcular tendencias (simuladas para este ejemplo)
      const bonusTrend = Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable";
      const kmTrend = Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable";
      
      // Formatear los valores para mejor visualización
      // Asegurarse de que los valores sean números antes de usar toFixed()
      const formattedBonusPercentage = typeof bonusData_processed.porcentaje === 'number' 
        ? parseFloat(bonusData_processed.porcentaje.toFixed(2)) 
        : parseFloat(parseFloat(bonusData_processed.porcentaje || '0').toFixed(2));
      
      const formattedKmPercentage = typeof kmData_processed.porcentaje === 'number' 
        ? parseFloat(kmData_processed.porcentaje.toFixed(2)) 
        : parseFloat(parseFloat(kmData_processed.porcentaje || '0').toFixed(2));
      
      console.log(`Usuario ${user.codigo} - Porcentaje de bono:`, formattedBonusPercentage);
      
      // Calcular la eficiencia como promedio de bonos y kilómetros
      const efficiency = Math.round((formattedBonusPercentage + formattedKmPercentage) / 2);
      
      // Generar datos de rendimiento semanal aleatorios (para demostración)
      const weeklyPerformance = Array(7).fill(0).map(() => 
        Math.floor(Math.min(formattedBonusPercentage, formattedKmPercentage) - 10 + Math.random() * 20)
      );
      
      return {
        id: user.codigo,
        name: user.nombre,
        document: user.cedula,
        position: user.cargo || "Operador",
        phone: user.telefono || "",
        joinDate: user.fecha_ingreso ? new Date(user.fecha_ingreso).toISOString() : null,
        bonus: {
          percentage: formattedBonusPercentage, // Devolver como número para que funcione toFixed()
          total: Math.round(typeof bonusData_processed.total === 'number' ? bonusData_processed.total : parseFloat(bonusData_processed.total || '0')),
          category: bonusCategory,
          trend: bonusTrend,
          date: bonusData_processed.fecha ? new Date(bonusData_processed.fecha).toISOString() : null
        },
        km: {
          percentage: formattedKmPercentage, // Devolver como número para que funcione toFixed()
          total: Math.round(typeof kmData_processed.total === 'number' ? kmData_processed.total : parseFloat(kmData_processed.total || '0')),
          total_ejecutado: Math.round(typeof kmData_processed.total_ejecutado === 'number' ? kmData_processed.total_ejecutado : parseFloat(String(kmData_processed.total_ejecutado || '0'))),
          total_programado: Math.round(typeof kmData_processed.total_programado === 'number' ? kmData_processed.total_programado : parseFloat(String(kmData_processed.total_programado || '0'))),
          category: kmCategory,
          trend: kmTrend,
          date: kmData_processed.fecha ? new Date(kmData_processed.fecha).toISOString() : null
        },
        efficiency: efficiency,
        category: combinedCategory,
        weeklyPerformance: weeklyPerformance,
        rank: 0 // Se calculará después de ordenar
      };
    });
    
    // Filtrar operadores nulos (aquellos que no tienen datos para el período filtrado)
    const filteredRankings = rankings.filter(operator => operator !== null);
    
    // Verificar si hay datos para el período filtrado
    if (filteredRankings.length === 0 && (filterType === 'year' || filterType === 'month')) {
      console.log(`No se encontraron datos para ${filterType === 'year' ? 'el año ' + filterYear : 'el mes ' + filterMonth + '/' + filterYear}`);
      
      // Verificar si hay datos en la tabla variables_control para este período
      const [checkDataQuery, checkDataParams] = filterType === 'year' 
        ? [`SELECT COUNT(*) as count FROM variables_control WHERE YEAR(fecha_inicio_programacion) = ? OR YEAR(fecha_fin_programacion) = ?`, [filterYear, filterYear]]
        : [`SELECT COUNT(*) as count FROM variables_control WHERE (YEAR(fecha_inicio_programacion) = ? AND MONTH(fecha_inicio_programacion) = ?) OR (YEAR(fecha_fin_programacion) = ? AND MONTH(fecha_fin_programacion) = ?)`, 
           [filterYear, filterMonth, filterYear, filterMonth]];
      
      console.log('Verificando si existen datos en la tabla:', checkDataQuery);
      console.log('Parámetros:', checkDataParams);
      
      try {
        const [checkResult] = await connection.execute(checkDataQuery, checkDataParams);
        const count = (checkResult as any[])[0]?.count || 0;
        console.log(`Se encontraron ${count} registros en la tabla variables_control para el filtro aplicado`);
      } catch (checkError) {
        console.error('Error al verificar datos disponibles:', checkError);
      }
      
      await connection.end(); // Cerrar la conexión antes de retornar
      return NextResponse.json({
        success: true,
        data: [], // Array vacío para indicar que no hay datos
        filterInfo: {
          type: filterType,
          year: filterYear,
          month: filterMonth,
          availableYears: [], // No hay años disponibles para este filtro
          latestYear: currentYear,
          latestMonth: currentMonth
        },
        message: `No hay datos disponibles para ${filterType === 'year' ? 'el año ' + filterYear : 'el mes ' + filterMonth + '/' + filterYear}`
      });
    }
    
    // Ordenar por eficiencia (de mayor a menor)
    const sortedRankings = [...filteredRankings].sort((a, b) => {
      return b.efficiency - a.efficiency;
    });
    
    // Asignar rangos basados en la posición en la lista ordenada
    sortedRankings.forEach((operator, index) => {
      operator.rank = index + 1;
    });
    
    // Guardar en caché por 5 minutos
    cache.set(cacheKey, sortedRankings, 5 * 60);

    // Determinar la última fecha disponible en los datos para establecer filtro por defecto
    const allDates = [...new Set(
      [...sortedRankings
        .filter(op => op.bonus?.date || op.km?.date)
        .flatMap(op => [
          op.bonus?.date ? new Date(op.bonus.date) : null,
          op.km?.date ? new Date(op.km.date) : null
        ])
        .filter((date): date is Date => date !== null)
      ]
    )];
    
    // Ordenar las fechas de más reciente a más antigua
    allDates.sort((a, b) => b.getTime() - a.getTime());
    
    const latestDate = allDates.length > 0 ? allDates[0] : new Date();
    const latestYear = latestDate.getFullYear();
    const latestMonth = latestDate.getMonth() + 1;
    const availableYears = [...new Set(allDates.map(date => date.getFullYear()))].sort().reverse();
    
    // Cerrar la conexión antes de finalizar
    await connection.end();
    
    return NextResponse.json({ 
      success: true, 
      data: sortedRankings,
      filterInfo: {
        type: filterType,
        year: filterYear,
        month: filterMonth,
        availableYears,
        latestYear,
        latestMonth
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error al obtener datos de rankings:", error);
    
    // En caso de error, devolver datos de demostración como fallback
    return NextResponse.json({ 
      success: true, 
      data: demoOperators,
      isDemoData: true,
      error: "Error al procesar datos de rankings"
    });
  }
}
