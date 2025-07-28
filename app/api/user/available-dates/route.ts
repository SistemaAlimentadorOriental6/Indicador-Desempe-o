import { withErrorHandling, apiResponse, QueryValidator, commonParams } from '@/lib/api-helpers';
import { getDatabase } from '@/lib/database';

async function handleGet(request: Request) {
  const { searchParams } = new URL(request.url);
  const validator = new QueryValidator(searchParams);
  validator.required('userCode', 'Código de usuario');
  validator.throwIfErrors();

  const userCode = commonParams.getUserCode(searchParams)!;
  const db = getDatabase();

  try {
    const query = `
      SELECT 
        MIN(fecha_inicio_programacion) as first_date,
        MAX(COALESCE(fecha_fin_programacion, CURDATE())) as last_date
      FROM variables_control
      WHERE codigo_variable = 'KMS' AND codigo_empleado = ?
    `;

    const results = await db.executeQuery<{ first_date: string; last_date: string }[]>(query, [userCode]);

    if (!results || results.length === 0 || !results[0].first_date) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      return apiResponse.success({
          years: [currentYear],
          months: { [currentYear]: Array.from({length: currentMonth}, (_,i) => i + 1) }
      }, 'No se encontraron fechas, se devuelven las actuales.');
    }

    const firstDate = new Date(results[0].first_date);
    const lastDate = new Date(results[0].last_date);
    
    // Generar todos los meses desde la primera fecha hasta la última
    const availableDates: { years: number[]; months: { [year: number]: number[] } } = { years: [], months: {} };
    
    const current = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    const end = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);
    
    while (current <= end) {
      const year = current.getFullYear();
      const month = current.getMonth() + 1;
      
      if (!availableDates.years.includes(year)) {
        availableDates.years.push(year);
        availableDates.months[year] = [];
      }
      
      availableDates.months[year].push(month);
      current.setMonth(current.getMonth() + 1);
    }
    
    // Sort years descending
    availableDates.years.sort((a, b) => b - a);
    // Sort months descending for each year
    Object.values(availableDates.months).forEach(months => months.sort((a, b) => b - a));

    return apiResponse.success(availableDates);
  } catch (error) {
    console.error(`[AvailableDates] Error al obtener fechas para ${userCode}:`, error);
    throw error;
  }
}

export const GET = withErrorHandling(handleGet); 