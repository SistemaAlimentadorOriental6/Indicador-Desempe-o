import type { PersonKmData, MonthlyKmData } from "@/types/km-types";

// Interfaz para la respuesta de la API
interface KilometersApiResponse {
  success: boolean;
  data: {
    year: number;
    month: number;
    monthName: string;
    valor_programacion: number;
    valor_ejecucion: number;
    registros: any[];
  }[];
  summary: {
    totalProgrammed: string;
    totalExecuted: string;
    percentage: number;
  };
  availableYears: number[];
  availableMonths: number[];
}

// Interfaz para la respuesta de la API de usuarios
interface UsersApiResponse {
  success: boolean;
  data: {
    codigo: string;
    cedula: string;
    nombre: string;
    cargo: string;
    telefono?: string;
    avatar?: string;
  }[];
}

// Función para obtener datos de kilómetros de un usuario específico
export async function getUserKilometers(codigo: string, year?: number, month?: number): Promise<KilometersApiResponse> {
  let url = `/api/user/kilometers?codigo=${codigo}`;
  
  if (year) url += `&year=${year}`;
  if (month) url += `&month=${month}`;
  
  console.log(`Solicitando datos de kilómetros para usuario ${codigo}${year ? `, año ${year}` : ''}${month ? `, mes ${month}` : ''}`);
  
  try {
    const response = await fetch(url, {
      // Agregamos un tiempo de espera más largo para la solicitud
      signal: AbortSignal.timeout(30000) // 30 segundos
    });
    
    // Incluso si la respuesta no es ok (404), intentamos procesarla como JSON
    const data = await response.json().catch(e => {
      console.error(`Error al parsear respuesta JSON para usuario ${codigo}:`, e);
      // Si no podemos parsear la respuesta como JSON, lanzamos el error original
      throw new Error(`Error al obtener datos de kilómetros: ${response.status} ${response.statusText}`);
    });
    
    // Si tenemos una respuesta JSON pero no es exitosa, registramos el error pero no interrumpimos
    if (!data.success) {
      console.warn(`Respuesta no exitosa para usuario ${codigo}:`, data.message || 'Sin mensaje de error');
      // Devolvemos un objeto con estructura válida pero vacío
      return {
        success: true,
        data: [],
        summary: {
          totalProgrammed: '0',
          totalExecuted: '0',
          percentage: 0
        },
        availableYears: [],
        availableMonths: []
      };
    }
    
    console.log(`Datos de kilómetros recibidos para usuario ${codigo}:`, {
      success: data.success,
      dataLength: data.data?.length || 0,
      availableYears: data.availableYears?.length || 0,
      availableMonths: data.availableMonths?.length || 0
    });
    
    return data;
  } catch (error) {
    console.error(`Error al solicitar datos de kilómetros para usuario ${codigo}:`, error);
    throw new Error(`Error al obtener datos de kilómetros: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Función para obtener la lista de usuarios
export async function getUsers(): Promise<UsersApiResponse> {
  console.log('Solicitando lista de usuarios...');
  
  try {
    const response = await fetch('/api/admin/users', {
      // Agregamos un tiempo de espera más largo para la solicitud
      signal: AbortSignal.timeout(30000), // 30 segundos
      // Agregamos encabezados para evitar caché del navegador
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      // Intentamos obtener más información sobre el error
      const errorText = await response.text().catch(() => response.statusText);
      console.error(`Error en respuesta de API de usuarios (${response.status}):`, errorText);
      throw new Error(`Error al obtener lista de usuarios: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Datos de usuarios recibidos:', {
      success: data.success,
      count: data.data?.length || 0,
      pagination: data.pagination ? `Página ${data.pagination.page} de ${data.pagination.totalPages}` : 'No disponible'
    });
    
    return data;
  } catch (error) {
    console.error('Error al solicitar lista de usuarios:', error);
    throw new Error(`Error al obtener lista de usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Función para transformar los datos de la API al formato requerido por la UI
export function transformApiDataToPersonKmData(
  userData: UsersApiResponse['data'][0], 
  kmData: KilometersApiResponse
): PersonKmData {
  // Calcular la confiabilidad general
  const overallReliability = kmData.summary.percentage;
  
  // Determinar el estado basado en la confiabilidad
  let status: "excellent" | "good" | "warning" | "poor";
  if (overallReliability >= 95) status = "excellent";
  else if (overallReliability >= 85) status = "good";
  else if (overallReliability >= 75) status = "warning";
  else status = "poor";
  
  // Crear datos mensuales
  const monthlyData: MonthlyKmData[] = kmData.data.map(item => ({
    month: item.monthName,
    year: item.year,
    programmed: item.valor_programacion,
    executed: item.valor_ejecucion,
    reliability: item.valor_programacion > 0 
      ? Math.round((item.valor_ejecucion / item.valor_programacion) * 100) 
      : 0,
    days: 0, // Este dato no viene de la API, se podría calcular si es necesario
  }));
  
  // Determinar la tendencia (esto es una simplificación, se podría mejorar)
  let trend: "up" | "down" | "stable" = "stable";
  if (monthlyData.length >= 2) {
    const lastMonth = monthlyData[0];
    const previousMonth = monthlyData[1];
    if (lastMonth.reliability > previousMonth.reliability) trend = "up";
    else if (lastMonth.reliability < previousMonth.reliability) trend = "down";
  }
  
  // Crear el objeto PersonKmData
  return {
    id: parseInt(userData.codigo) || 0,
    code: userData.codigo,
    cedula: userData.cedula,
    name: userData.nombre, // Ya no tenemos apellido, usamos solo el nombre
    avatar: userData.avatar || userData.nombre.charAt(0),
    department: 'N/A', // No tenemos departamento, usamos un valor por defecto
    position: userData.cargo,
    monthlyData,
    totalProgrammed: parseFloat(kmData.summary.totalProgrammed),
    totalExecuted: parseFloat(kmData.summary.totalExecuted),
    overallReliability,
    trend,
    status,
    lastUpdate: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0].substring(0, 5),
    performanceScore: overallReliability, // Usamos la confiabilidad como puntaje de rendimiento
  };
}

// Función para obtener todos los datos de kilómetros
export async function getAllKilometersData(): Promise<PersonKmData[]> {
  console.log('Iniciando obtención de datos de kilómetros para todos los usuarios...');
  
  try {
    // Obtener la lista de usuarios
    console.log('Paso 1: Obteniendo lista de usuarios...');
    const usersResponse = await getUsers();
    
    if (!usersResponse.success || !usersResponse.data || usersResponse.data.length === 0) {
      console.error('No se pudo obtener la lista de usuarios o está vacía:', usersResponse);
      throw new Error('No se pudo obtener la lista de usuarios o está vacía');
    }
    
    console.log(`Paso 2: Obteniendo datos de kilómetros para ${usersResponse.data.length} usuarios...`);
    
    // Para cada usuario, obtener sus datos de kilómetros
    const kmPromises = usersResponse.data.map(async (user) => {
      try {
        console.log(`Obteniendo datos para usuario ${user.codigo} (${user.nombre})`);
        const kmResponse = await getUserKilometers(user.codigo);
        
        // Si no hay datos para este usuario o hay un error, creamos un objeto con datos vacíos
        if (!kmResponse.success || !kmResponse.data || kmResponse.data.length === 0) {
          console.warn(`No hay datos para el usuario ${user.codigo} o respuesta no exitosa`);
          
          // Creamos un objeto PersonKmData con valores predeterminados para este usuario
          return {
            id: user.codigo,
            name: user.nombre,
            avatar: user.avatar || user.nombre.charAt(0),
            department: 'N/A',
            position: user.cargo || 'N/A',
            monthlyData: [],
            totalProgrammed: 0,
            totalExecuted: 0,
            overallReliability: 0,
            trend: 'stable',
            status: 'inactive',
            lastUpdate: new Date().toISOString().split('T')[0],
            performanceScore: 0
          };
        }
        
        console.log(`Transformando datos para usuario ${user.codigo}...`);
        return transformApiDataToPersonKmData(user, kmResponse);
      } catch (error) {
        console.error(`Error al procesar usuario ${user.codigo}:`, error);
        // En caso de error, también creamos un objeto con datos vacíos
        return {
          id: user.codigo,
          name: user.nombre,
          avatar: user.avatar || user.nombre.charAt(0),
          department: 'N/A',
          position: user.cargo || 'N/A',
          monthlyData: [],
          totalProgrammed: 0,
          totalExecuted: 0,
          overallReliability: 0,
          trend: 'stable',
          status: 'error',
          lastUpdate: new Date().toISOString().split('T')[0],
          performanceScore: 0
        };
      }
    });
    
    // Esperar todas las promesas y filtrar los nulos
    console.log('Paso 3: Esperando resultados de todos los usuarios...');
    const results = await Promise.all(kmPromises);
    const validResults = results.filter((item): item is PersonKmData => item !== null);
    
    console.log(`Resultados obtenidos: ${validResults.length} válidos de ${results.length} totales`);
    
    if (validResults.length === 0) {
      console.error('No se obtuvieron datos válidos de la API');
      throw new Error('No se obtuvieron datos válidos de kilómetros para ningún usuario');
    }
    
    console.log('Datos de kilómetros obtenidos exitosamente');
    return validResults;
  } catch (error) {
    console.error("Error al obtener datos de kilómetros:", error);
    
    // Proporcionar más contexto sobre el error
    if (error instanceof Error) {
      // Preservar el mensaje original pero agregar más contexto
      const enhancedError = new Error(`Error al obtener datos de kilómetros: ${error.message}`);
      enhancedError.stack = error.stack; // Preservar el stack trace original
      throw enhancedError;
    }
    
    throw error;
  }
}
