import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

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

    // 3. Calcular porcentaje de kilómetros por mes y total
    const kmDataByMonth: Record<number, { executed: number, programmed: number, percentage: number }> = {};
    let totalKmExecuted = 0;
    let totalKmProgrammed = 0;

    // Inicializar todos los meses hasta el último con 0
    for (let month = 1; month <= lastMonth; month++) {
      kmDataByMonth[month] = { executed: 0, programmed: 0, percentage: 0 };
    }

    // Llenar con datos reales
    kmRows.forEach((row: any) => {
      const month = row.month;
      const executed = parseFloat(row.total_ejecutado) || 0;
      const programmed = parseFloat(row.total_programado) || 0;
      const percentage = programmed > 0 ? (executed / programmed) * 100 : 0;
      
      kmDataByMonth[month] = { executed, programmed, percentage };
      totalKmExecuted += executed;
      totalKmProgrammed += programmed;
    });

    // Calcular porcentaje total de kilómetros
    const kmPercentage = totalKmProgrammed > 0 ? (totalKmExecuted / totalKmProgrammed) * 100 : 0;
    console.log(`[Global Efficiency] Total KM: ${totalKmExecuted.toFixed(2)} / ${totalKmProgrammed.toFixed(2)} = ${kmPercentage.toFixed(2)}%`);

    // 4. Calcular bonos por mes hasta el último mes de kilómetros
    const baseBonus = parseInt(year) >= 2025 ? 142000 : 130000;
    let totalBonusExecuted = 0;
    let totalBonusProgrammed = 0;

    console.log(`[Global Efficiency] Calculando bonos para ${lastMonth} meses con base: ${baseBonus}`);

    for (let month = 1; month <= lastMonth; month++) {
      try {
        // Obtener deducciones para este mes específico
        const [deductionRows]: [any[], any] = await connection.execute(
          `SELECT
            SUM(CASE 
              WHEN codigo_factor IN ('1', '2', '5', '12', 'DL', 'DEL', 'INT', 'OM', 'NPD') THEN 
                CASE 
                  WHEN codigo_factor IN ('1', '5', 'DL', 'DEL', 'INT', 'OM', 'NPD') THEN ?
                  WHEN codigo_factor IN ('2') THEN ?
                  WHEN codigo_factor IN ('12') THEN ?
                END
              WHEN codigo_factor IN ('3', '4', '6', '7', '8', '9', '11') THEN 
                (DATEDIFF(IFNULL(fecha_fin_novedad, CURDATE()), fecha_inicio_novedad) + 1) * 4733
              ELSE 0
            END) as total_deducciones
          FROM novedades
          WHERE codigo_empleado = ? 
            AND YEAR(fecha_inicio_novedad) = ?
            AND MONTH(fecha_inicio_novedad) = ?`,
          [
            baseBonus * 0.25,
            baseBonus,
            baseBonus * 0.5,
            userCode, 
            year, 
            month
          ]
        );

        const monthDeductions = parseFloat(deductionRows[0]?.total_deducciones) || 0;
        const monthBonus = Math.max(0, baseBonus - monthDeductions);
        const monthBonusPercentage = (monthBonus / baseBonus) * 100;

        totalBonusExecuted += monthBonus;
        totalBonusProgrammed += baseBonus;

        console.log(`[Global Efficiency] Mes ${month}: Bono ${monthBonus.toFixed(0)} (${monthBonusPercentage.toFixed(1)}%), Deducciones: ${monthDeductions.toFixed(0)}`);
      } catch (monthError) {
        console.error(`[Global Efficiency] Error calculando bono para mes ${month}:`, monthError);
        // Si hay error en un mes específico, continuar con el siguiente
        totalBonusExecuted += baseBonus; // Asumir bono completo
        totalBonusProgrammed += baseBonus;
      }
    }

    // Calcular porcentaje total de bonos
    const bonusPercentage = totalBonusProgrammed > 0 ? (totalBonusExecuted / totalBonusProgrammed) * 100 : 0;
    console.log(`[Global Efficiency] Total Bonus: ${totalBonusExecuted.toFixed(2)} / ${totalBonusProgrammed.toFixed(2)} = ${bonusPercentage.toFixed(2)}%`);

    // 5. Calcular eficiencia global como promedio de bonos y kilómetros
    const efficiency = (bonusPercentage + kmPercentage) / 2;

    console.log(`[Global Efficiency] User: ${userCode}, Year: ${year}, Last Month: ${lastMonth}`);
    console.log(`[Global Efficiency] KM: ${kmPercentage.toFixed(2)}%, Bonus: ${bonusPercentage.toFixed(2)}%`);
    console.log(`[Global Efficiency] Final Efficiency: ${efficiency.toFixed(2)}%`);

    const response = { 
      success: true, 
      data: { 
        efficiency: Math.round(efficiency * 10) / 10, // Redondear a 1 decimal
        kmPercentage: Math.round(kmPercentage * 10) / 10,
        bonusPercentage: Math.round(bonusPercentage * 10) / 10,
        lastMonth: lastMonth,
        monthsAnalyzed: lastMonth
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