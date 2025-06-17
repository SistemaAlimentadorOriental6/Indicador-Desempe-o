import { NextResponse } from "next/server"
import { createPool, Pool } from "mysql2/promise"
import NodeCache from "node-cache"

// Cache para almacenar resultados por 5 minutos
const cache = new NodeCache({ stdTTL: 300 })

// Verificar que las variables de entorno estén definidas
const envVars = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || '3306'
};

console.log('Variables de entorno para conexión a la base de datos:', {
  host: envVars.host ? `${envVars.host.substring(0, 3)}...` : 'No definido',
  user: envVars.user ? 'Definido' : 'No definido',
  password: envVars.password ? 'Definido' : 'No definido',
  database: envVars.database ? envVars.database : 'No definido',
  port: envVars.port
});

if (!envVars.host || !envVars.user || !envVars.database) {
  console.error('Variables de entorno de base de datos no configuradas correctamente');
}

// Configuración del pool de conexiones
const poolConfig = {
  host: envVars.host,
  user: envVars.user,
  password: envVars.password,
  database: envVars.database,
  port: envVars.port ? Number(envVars.port) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Aumentar el tiempo de espera para la conexión
  connectTimeout: 60000, // 60 segundos
  // Configuración de SSL si es necesario
  ssl: process.env.DB_SSL === 'true' ? {} : undefined
};

console.log('Configurando pool de conexiones con:', {
  host: poolConfig.host ? `${poolConfig.host.substring(0, 3)}...` : 'No definido',
  database: poolConfig.database,
  port: poolConfig.port
});

// Definir el tipo para el pool de conexiones

let pool: Pool | null = null;
try {
  pool = createPool(poolConfig);
  console.log('Pool de conexiones creado exitosamente');
} catch (error) {
  console.error('Error al crear el pool de conexiones:', error);
  // Continuamos la ejecución, el error se manejará en las rutas
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '100') // Aumentamos el tamaño por defecto
  const cacheKey = `users-${page}-${pageSize}`
  
  // Verificar si tenemos datos en caché
  const cachedData = cache.get(cacheKey)
  if (cachedData) {
    return NextResponse.json(cachedData)
  }
  
  // Validate pagination parameters
  const validPage = page > 0 ? page : 1
  const validPageSize = pageSize > 0 && pageSize <= 500 ? pageSize : 100 // Permitimos hasta 500 usuarios
  
  // Calculate offset
  const offset = (validPage - 1) * validPageSize
  
  try {
    if (!pool) {
      throw new Error('El pool de conexiones no está disponible. Verifica las variables de entorno.');
    }
    
    console.log('Intentando conectar a la base de datos...');
    console.log('Configuración de conexión:', {
      host: poolConfig.host ? `${poolConfig.host.substring(0, 3)}...` : 'No definido',
      database: poolConfig.database,
      port: poolConfig.port
    });
    
    // Obtener una conexión del pool con un tiempo de espera más largo
    const connection = await Promise.race([
      pool.getConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tiempo de espera agotado al intentar conectar a la base de datos (10s)')), 10000)
      )
    ]) as any;
    
    console.log('Conexión establecida con éxito');
    
    try {
      console.log('Ejecutando consulta para contar usuarios...');
      // Query to get total count of users
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM operadores_sao6`
      );
      console.log('Resultado de conteo:', countResult);
      
      // Type assertion to handle the result properly
      const countData = Array.isArray(countResult) && countResult.length > 0 ? countResult[0] : { total: 0 }
      const totalUsers = (countData as any).total || 0
      const totalPages = Math.ceil(totalUsers / validPageSize)
      
      console.log('Ejecutando consulta para obtener detalles de usuarios...');
      // Query to get users with their details
      const [usersResult] = await connection.execute(
        `SELECT 
          o.codigo AS codigo,
          o.nombre AS nombre,
          o.cedula AS cedula,
          o.telefono AS telefono
        FROM operadores_sao6 o
        ORDER BY o.nombre
        LIMIT ? OFFSET ?`,
        [validPageSize, offset]
      );
      console.log(`Obtenidos ${usersResult ? (usersResult as any[]).length : 0} usuarios`);
      
      // Liberar la conexión de vuelta al pool
      connection.release();
      console.log('Conexión liberada');
      
      // Preparar la respuesta
      const responseData = {
        success: true,
        data: usersResult || [],
        pagination: {
          page: validPage,
          pageSize: validPageSize,
          totalItems: totalUsers,
          totalPages: totalPages
        }
      }
      
      // Guardar en caché
      cache.set(cacheKey, responseData);
      console.log('Datos guardados en caché');
      
      // Return the users with pagination metadata
      return NextResponse.json(responseData);
    } catch (error) {
      console.error("Error en la consulta a la base de datos:", error);
      
      try {
        // Asegurarse de liberar la conexión en caso de error
        connection.release();
        console.log('Conexión liberada después de error');
      } catch (releaseError) {
        console.error("Error al liberar la conexión:", releaseError);
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: "Error al obtener usuarios de la base de datos", 
          details: "Verifica la configuración de la base de datos y que las tablas existan",
          error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error de conexión a la base de datos:", error);
    
    // Si estamos en desarrollo, vamos a intentar hacer un ping al host para verificar conectividad
    let pingResult = 'No realizado';
    try {
      if (process.env.NODE_ENV === "development" && poolConfig.host) {
        console.log(`Intentando verificar conectividad con el host: ${poolConfig.host}`);
        // Nota: Este código no funcionará en el navegador, solo en el servidor
        pingResult = 'Verificación de conectividad no disponible en este entorno';
      }
    } catch (pingError) {
      console.error('Error al verificar conectividad:', pingError);
      pingResult = `Error: ${(pingError as Error).message}`;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Error de conexión a la base de datos", 
        details: "Verifica que las variables de entorno DB_HOST, DB_USER, DB_PASSWORD y DB_NAME estén configuradas correctamente",
        connectionInfo: {
          host: poolConfig.host ? `${poolConfig.host.substring(0, 3)}...` : 'No definido',
          database: poolConfig.database || 'No definido',
          port: poolConfig.port || '3306 (default)',
          connectivityCheck: pingResult
        },
        errorType: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
