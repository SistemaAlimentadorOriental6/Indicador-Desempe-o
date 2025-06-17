import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { cache } from "@/utils/server-cache";

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

export async function GET() {
  try {
    // Para desarrollo, omitimos la verificación de autenticación
    // En un entorno de producción, aquí iría la lógica de autenticación

    // Verificar si hay datos en caché
    const cacheKey = "rankings_data";
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json({ success: true, data: cachedData });
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

    // Obtener datos de bonos del último mes registrado
    const [bonusRows] = await connection.execute(`
      SELECT 
        v.codigo_empleado AS codigo,
        COALESCE(ROUND((v.valor_ejecucion / NULLIF(v.valor_programacion, 0) * 100), 2), 0) AS porcentaje,
        COALESCE(v.valor_ejecucion, 0) AS total,
        v.fecha_fin_ejecucion AS fecha
      FROM variables_control v
      INNER JOIN (
        SELECT codigo_empleado, MAX(fecha_fin_ejecucion) as max_fecha
        FROM variables_control
        WHERE codigo_variable LIKE '%bono%' OR codigo_variable LIKE '%incentivo%'
        GROUP BY codigo_empleado
      ) vm ON v.codigo_empleado = vm.codigo_empleado AND v.fecha_fin_ejecucion = vm.max_fecha
      WHERE v.codigo_variable LIKE '%bono%' OR v.codigo_variable LIKE '%incentivo%'
    `);
    
    console.log('Datos de bonos obtenidos:', JSON.stringify(bonusRows, null, 2));

    // Obtener datos de kilómetros del último mes registrado
    const [kmRows] = await connection.execute(`
      SELECT 
        v.codigo_empleado AS codigo,
        COALESCE(ROUND((v.valor_ejecucion / NULLIF(v.valor_programacion, 0) * 100), 2), 0) AS porcentaje,
        COALESCE(v.valor_ejecucion, 0) AS total,
        v.fecha_fin_ejecucion AS fecha
      FROM variables_control v
      INNER JOIN (
        SELECT codigo_empleado, MAX(fecha_fin_ejecucion) as max_fecha
        FROM variables_control
        WHERE codigo_variable LIKE '%km%' OR codigo_variable LIKE '%kilometr%'
        GROUP BY codigo_empleado
      ) vm ON v.codigo_empleado = vm.codigo_empleado AND v.fecha_fin_ejecucion = vm.max_fecha
      WHERE v.codigo_variable LIKE '%km%' OR v.codigo_variable LIKE '%kilometr%'
    `);

    // Cerrar la conexión
    await connection.end();

    // Verificar si se obtuvieron datos
    if (!usersRows || (usersRows as any[]).length === 0) {
      console.warn("No se encontraron usuarios en la base de datos. Usando datos de demostración.");
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

    // Mapear los datos de usuarios con sus bonos y kilómetros
    const rankings = users.map(user => {
      // Buscar datos de bono para este usuario
      const userBonus = bonusData.find(b => b.codigo === user.codigo);
      console.log(`Buscando bono para usuario ${user.codigo}:`, userBonus);
      
      // Si no hay datos de bonos, usar valores por defecto o aleatorios para demostración
      const bonusData_processed = userBonus ? {
        porcentaje: userBonus.porcentaje,
        total: userBonus.total,
        fecha: userBonus.fecha
      } : {
        porcentaje: Math.floor(Math.random() * 100), // Valor aleatorio entre 0-100 para demostración
        total: Math.floor(Math.random() * 1000000) + 100000, // Valor aleatorio entre 100,000-1,100,000 para demostración
        fecha: null
      };
      
      // Buscar datos de kilómetros para este usuario
      const userKm = kmData.find(k => k.codigo === user.codigo);
      
      // Si no hay datos de kilómetros, usar el valor máximo de 142,000
      const kmData_processed = userKm ? {
        porcentaje: userKm.porcentaje,
        total: userKm.total,
        fecha: userKm.fecha
      } : {
        porcentaje: 100, // 100% para el valor máximo
        total: 142000, // Valor máximo de 142,000
        fecha: null
      };
      
      // Calcular categorías
      const bonusCategory = determineBonusCategory(bonusData_processed.porcentaje);
      const kmCategory = determineKmCategory(kmData_processed.porcentaje);
      const combinedCategory = determineFinalCategory(bonusCategory, kmCategory);
      
      // Calcular tendencias (simuladas para este ejemplo)
      const bonusTrend = Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable";
      const kmTrend = Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable";
      
      // Formatear los valores para mejor visualización
      // Asegurarse de que los valores sean números antes de usar toFixed()
      const bonusPercentage = typeof bonusData_processed.porcentaje === 'number' ? bonusData_processed.porcentaje : parseFloat(bonusData_processed.porcentaje || '0');
      const kmPercentage = typeof kmData_processed.porcentaje === 'number' ? kmData_processed.porcentaje : parseFloat(kmData_processed.porcentaje || '0');
      
      console.log(`Usuario ${user.codigo} - Porcentaje de bono:`, bonusPercentage);
      
      const formattedBonusPercentage = parseFloat(bonusPercentage.toFixed(2));
      const formattedKmPercentage = parseFloat(kmPercentage.toFixed(2));
      
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
          percentage: formattedBonusPercentage,
          total: Math.round(typeof bonusData_processed.total === 'number' ? bonusData_processed.total : parseFloat(bonusData_processed.total || '0')),
          category: bonusCategory,
          trend: bonusTrend,
          date: bonusData_processed.fecha ? new Date(bonusData_processed.fecha).toISOString() : null
        },
        km: {
          percentage: formattedKmPercentage,
          total: Math.round(typeof kmData_processed.total === 'number' ? kmData_processed.total : parseFloat(kmData_processed.total || '0')),
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

    // Ordenar por eficiencia (de mayor a menor)
    const sortedRankings = [...rankings].sort((a, b) => {
      return b.efficiency - a.efficiency;
    });
    
    // Asignar rangos basados en la posición en la lista ordenada
    sortedRankings.forEach((operator, index) => {
      operator.rank = index + 1;
    });
    
    // Guardar en caché por 5 minutos
    cache.set(cacheKey, sortedRankings, 5 * 60);

    return NextResponse.json({ 
      success: true, 
      data: sortedRankings,
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
