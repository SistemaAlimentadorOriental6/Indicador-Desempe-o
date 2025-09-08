import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { DEDUCTION_RULES } from '@/lib/deductions-config';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sao6',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userCode = searchParams.get('userCode');
  const year = searchParams.get('year');

  console.log(`[Global Efficiency] Iniciando request para usuario: ${userCode}, año: ${year}`);

  if (!userCode) {
    return NextResponse.json({ success: false, message: 'El código de usuario es requerido' }, { status: 400 });
  }

  if (!year) {
    return NextResponse.json({ success: false, message: 'El año es requerido' }, { status: 400 });
  }

  let connection;
  try {
    console.log(`[Global Efficiency] Conectando a la base de datos...`);
    connection = await mysql.createConnection(dbConfig);
    console.log(`[Global Efficiency] Conexión exitosa`);
    
    // 1. Obtener el último mes disponible en kilómetros para este usuario y año
    console.log(`[Global Efficiency] Buscando último mes en kilómetros...`);
    const [lastMonthRows]: [any[], any] = await connection.execute(
      `SELECT MAX(MONTH(fecha_inicio_programacion)) as last_month
       FROM variables_control
       WHERE codigo_empleado = ? 
         AND YEAR(fecha_inicio_programacion) = ?
         AND (codigo_variable LIKE 'km%' OR codigo_variable LIKE 'kilometr%')`,
      [userCode, year]
    );

    const lastMonth = lastMonthRows[0]?.last_month || 12; // Si no hay datos, usar diciembre
    console.log(`[Global Efficiency] Último mes en kilómetros: ${lastMonth}`);

    // 2. Obtener datos de kilómetros por mes
    console.log(`[Global Efficiency] Obteniendo datos de kilómetros...`);
    const [kmRows]: [any[], any] = await connection.execute(
      `SELECT 
        MONTH(fecha_inicio_programacion) as month,
        SUM(valor_ejecucion) as total_ejecutado,
        SUM(valor_programacion) as total_programado
      FROM variables_control
      WHERE codigo_empleado = ? 
        AND YEAR(fecha_inicio_programacion) = ?
        AND (codigo_variable LIKE 'km%' OR codigo_variable LIKE 'kilometr%')
      GROUP BY MONTH(fecha_inicio_programacion)
      ORDER BY month`,
      [userCode, year]
    );

    console.log(`[Global Efficiency] Datos de kilómetros obtenidos: ${kmRows.length} registros`);

    // 3. Validar que hay datos válidos antes de continuar
    if (kmRows.length === 0) {
      console.warn(`[Global Efficiency] No hay datos de kilómetros para el usuario ${userCode} en el año ${year}`);
      return NextResponse.json({ 
        success: false, 
        message: 'No hay datos de kilómetros disponibles para calcular eficiencia global' 
      }, { status: 404 });
    }

    // Calcular porcentaje de kilómetros por mes y total
    const kmDataByMonth: Record<number, { executed: number, programmed: number, percentage: number }> = {};
    let totalKmExecuted = 0;
    let totalKmProgrammed = 0;
    let validKmMonths = 0;

    // Solo procesar meses que tienen datos reales
    kmRows.forEach((row: any) => {
      const month = row.month;
      const executed = Number(Number(row.total_ejecutado || 0).toFixed(2));
      const programmed = Number(Number(row.total_programado || 0).toFixed(2));
      
      // Solo contar meses con programación válida
      if (programmed > 0) {
        const percentage = Number(((executed / programmed) * 100).toFixed(2));
        kmDataByMonth[month] = { executed, programmed, percentage };
        totalKmExecuted = Number((totalKmExecuted + executed).toFixed(2));
        totalKmProgrammed = Number((totalKmProgrammed + programmed).toFixed(2));
        validKmMonths++;
      }
    });

    // Validar que hay al menos un mes válido
    if (validKmMonths === 0) {
      console.warn(`[Global Efficiency] No hay meses válidos con datos de kilómetros`);
      return NextResponse.json({ 
        success: false, 
        message: 'No hay datos válidos de kilómetros para calcular eficiencia' 
      }, { status: 404 });
    }

    // Calcular porcentaje total de kilómetros
    const kmPercentage = totalKmProgrammed > 0 ? Number(((totalKmExecuted / totalKmProgrammed) * 100).toFixed(2)) : 0;
    console.log(`[Global Efficiency] Total KM: ${totalKmExecuted.toFixed(2)} / ${totalKmProgrammed.toFixed(2)} = ${kmPercentage.toFixed(2)}%`);

    // 4. Calcular bonos solo para los meses que tienen datos de kilómetros
    const baseBonus = parseInt(year) >= 2025 ? 142000 : 130000;
    let totalBonusExecuted = 0;
    let totalBonusProgrammed = 0;
    let validBonusMonths = 0;
    const monthsWithKmData = Object.keys(kmDataByMonth).map(Number);

    console.log(`[Global Efficiency] Calculando bonos para meses con datos de KM: [${monthsWithKmData.join(', ')}], base: ${baseBonus}`);

    // Crear mapa de reglas de deducción para lookups O(1)
    const factorMap = new Map(DEDUCTION_RULES.map(rule => [rule.item, rule]));

    for (const month of monthsWithKmData) {
      try {
        // Obtener todas las novedades que afectan este mes específico (incluye períodos que se extienden)
        const [novedadRows]: [any[], any] = await connection.execute(
          `SELECT 
            codigo_factor,
            observaciones,
            fecha_inicio_novedad,
            fecha_fin_novedad
          FROM novedades
          WHERE codigo_empleado = ? 
            AND (
              (YEAR(fecha_inicio_novedad) = ? AND MONTH(fecha_inicio_novedad) = ?) OR
              (YEAR(IFNULL(fecha_fin_novedad, CURDATE())) = ? AND MONTH(IFNULL(fecha_fin_novedad, CURDATE())) = ?) OR
              (fecha_inicio_novedad <= ? AND (fecha_fin_novedad >= ? OR fecha_fin_novedad IS NULL))
            )`,
          [
            userCode,
            year, month,
            year, month,
            `${year}-${String(month).padStart(2, '0')}-31`,
            `${year}-${String(month).padStart(2, '0')}-01`
          ]
        );

        let monthDeductions = 0;
        
        // Procesar cada novedad usando las reglas de deducción
        if (novedadRows && novedadRows.length > 0) {
          novedadRows.forEach((novedad: any) => {
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
              
              monthDeductions += deductionAmount;
            }
          });
        }

        monthDeductions = Number(monthDeductions.toFixed(2));
        const monthBonus = Number(Math.max(0, baseBonus - monthDeductions).toFixed(2));
        const monthBonusPercentage = Number(((monthBonus / baseBonus) * 100).toFixed(2));

        totalBonusExecuted = Number((totalBonusExecuted + monthBonus).toFixed(2));
        totalBonusProgrammed = Number((totalBonusProgrammed + baseBonus).toFixed(2));
        validBonusMonths++;

        console.log(`[Global Efficiency] Mes ${month}: Bono ${monthBonus.toFixed(0)} (${monthBonusPercentage.toFixed(1)}%), Deducciones: ${monthDeductions.toFixed(0)}`);
      } catch (monthError) {
        console.error(`[Global Efficiency] Error calculando bono para mes ${month}:`, monthError);
        // En caso de error, no asumir bono completo - ser más conservador
        console.warn(`[Global Efficiency] Saltando mes ${month} debido a error en cálculo de deducciones`);
        // No sumar nada para este mes - más realista
        totalBonusProgrammed = Number((totalBonusProgrammed + baseBonus).toFixed(2)); // Solo contar como programado
      }
    }

    // Validar que hay al menos un mes válido para bonos
    if (validBonusMonths === 0) {
      console.warn(`[Global Efficiency] No hay meses válidos con datos de bonos`);
      return NextResponse.json({ 
        success: false, 
        message: 'No se pudieron calcular bonos para ningún mes' 
      }, { status: 404 });
    }

    // Calcular porcentaje total de bonos
    const bonusPercentage = totalBonusProgrammed > 0 ? Number(((totalBonusExecuted / totalBonusProgrammed) * 100).toFixed(2)) : 0;
    console.log(`[Global Efficiency] Total Bonus: ${totalBonusExecuted.toFixed(2)} / ${totalBonusProgrammed.toFixed(2)} = ${bonusPercentage.toFixed(2)}%`);

    // 5. Calcular eficiencia global como promedio de bonos y kilómetros
    const efficiency = Number(((bonusPercentage + kmPercentage) / 2).toFixed(2));

    console.log(`[Global Efficiency] User: ${userCode}, Year: ${year}`);
    console.log(`[Global Efficiency] Meses válidos KM: ${validKmMonths}, Meses válidos Bonos: ${validBonusMonths}`);
    console.log(`[Global Efficiency] KM: ${kmPercentage.toFixed(2)}%, Bonus: ${bonusPercentage.toFixed(2)}%`);
    console.log(`[Global Efficiency] Final Efficiency: ${efficiency.toFixed(2)}%`);

    const response = { 
      success: true, 
      data: { 
        efficiency: Number(efficiency.toFixed(1)), // Redondear a 1 decimal con mejor precisión
        kmPercentage: Number(kmPercentage.toFixed(1)),
        bonusPercentage: Number(bonusPercentage.toFixed(1)),
        validKmMonths: validKmMonths,
        validBonusMonths: validBonusMonths,
        monthsAnalyzed: Math.max(validKmMonths, validBonusMonths)
      } 
    };

    console.log(`[Global Efficiency] Respuesta exitosa:`, response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('[Global Efficiency] Error completo:', error);
    console.error('[Global Efficiency] Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    
    if (connection) {
      try {
        await connection.end();
        console.log('[Global Efficiency] Conexión cerrada correctamente');
      } catch (closeError) {
        console.error('[Global Efficiency] Error cerrando conexión:', closeError);
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Error del servidor al obtener la eficiencia global',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 