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
        // Query para obtener solo los meses que realmente tienen datos
        const query = `
            SELECT DISTINCT
                YEAR(fecha_inicio_programacion) as year,
                MONTH(fecha_inicio_programacion) as month
            FROM variables_control
            WHERE codigo_variable = 'KMS' 
            AND codigo_empleado = ?
            AND fecha_inicio_programacion IS NOT NULL
            ORDER BY year DESC, month DESC
        `;

        const results = await db.executeQuery<{ year: number; month: number }[]>(query, [userCode]);

        if (!results || results.length === 0) {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;
            return apiResponse.success({
                years: [currentYear],
                months: { [currentYear]: [currentMonth] }
            }, 'No se encontraron fechas, se devuelve el mes actual.');
        }

        // Construir objeto de fechas disponibles basado en datos reales
        const availableDates: { years: number[]; months: { [year: number]: number[] } } = { 
            years: [], 
            months: {} 
        };

        for (const row of results) {
            const { year, month } = row;
            
            if (!availableDates.years.includes(year)) {
                availableDates.years.push(year);
                availableDates.months[year] = [];
            }
            
            if (!availableDates.months[year].includes(month)) {
                availableDates.months[year].push(month);
            }
        }

        // Years ya están ordenados por el ORDER BY DESC
        // Pero aseguramos el orden de los meses por año
        for (const year in availableDates.months) {
            availableDates.months[year].sort((a, b) => b - a);
        }

        return apiResponse.success(availableDates);
    } catch (error) {
        console.error(`[AvailableDates] Error al obtener fechas para ${userCode}:`, error);
        throw error;
    }
}

export const GET = withErrorHandling(handleGet);