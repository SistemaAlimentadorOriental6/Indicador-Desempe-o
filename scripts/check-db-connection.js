// Script para verificar la conexión a la base de datos
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkDatabaseConnection() {
  console.log('Verificando conexión a la base de datos...');
  console.log('Variables de entorno:');
  console.log('- DB_HOST:', process.env.DB_HOST || 'No definido');
  console.log('- DB_USER:', process.env.DB_USER || 'No definido');
  console.log('- DB_NAME:', process.env.DB_NAME || 'No definido');
  console.log('- DB_PORT:', process.env.DB_PORT || '3306 (default)');
  
  try {
    // Configuración de la conexión
    const config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      connectTimeout: 10000 // 10 segundos
    };
    
    console.log('\nIntentando conectar a la base de datos...');
    
    // Crear conexión
    const connection = await mysql.createConnection(config);
    console.log('¡Conexión exitosa!');
    
    // Verificar tablas
    console.log('\nVerificando tablas necesarias...');
    
    // Verificar tabla de operadores
    const [operadoresRows] = await connection.execute('SHOW TABLES LIKE "operadores_sao6"');
    if (operadoresRows.length > 0) {
      console.log('✓ Tabla "operadores_sao6" encontrada');
      
      // Contar registros
      const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM operadores_sao6');
      console.log(`  - Registros: ${countResult[0].total}`);
      
      // Mostrar primeros 3 registros
      if (countResult[0].total > 0) {
        const [sampleRows] = await connection.execute('SELECT codigo, nombre, apellido FROM operadores_sao6 LIMIT 3');
        console.log('  - Ejemplos:');
        sampleRows.forEach(row => {
          console.log(`    * ${row.codigo}: ${row.nombre} ${row.apellido}`);
        });
      }
    } else {
      console.log('✗ Tabla "operadores_sao6" NO encontrada');
    }
    
    // Verificar tabla de kilómetros
    const [kmRows] = await connection.execute('SHOW TABLES LIKE "variables_sao6"');
    if (kmRows.length > 0) {
      console.log('✓ Tabla "variables_sao6" encontrada');
      
      // Contar registros
      const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM variables_sao6 WHERE codigo_variable = "KMS"');
      console.log(`  - Registros de kilómetros: ${countResult[0].total}`);
      
      // Mostrar primeros 3 registros
      if (countResult[0].total > 0) {
        const [sampleRows] = await connection.execute(
          'SELECT codigo_empleado, valor_programacion, valor_ejecucion, YEAR(fecha_inicio_programacion) as year, MONTH(fecha_inicio_programacion) as month FROM variables_sao6 WHERE codigo_variable = "KMS" LIMIT 3'
        );
        console.log('  - Ejemplos:');
        sampleRows.forEach(row => {
          console.log(`    * Empleado ${row.codigo_empleado}: Programado=${row.valor_programacion}, Ejecutado=${row.valor_ejecucion}, Fecha=${row.year}-${row.month}`);
        });
      }
    } else {
      console.log('✗ Tabla "variables_sao6" NO encontrada');
    }
    
    // Cerrar conexión
    await connection.end();
    console.log('\nVerificación completada.');
    
  } catch (error) {
    console.error('\n¡Error de conexión!', error.message);
    console.error('Detalles del error:', error);
    
    // Sugerencias basadas en el error
    if (error.code === 'ECONNREFUSED') {
      console.log('\nSugerencias:');
      console.log('1. Verifica que el servidor MySQL esté en ejecución');
      console.log('2. Confirma que el host y puerto sean correctos');
      console.log('3. Asegúrate de que no haya un firewall bloqueando la conexión');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\nSugerencias:');
      console.log('1. Verifica que el usuario y contraseña sean correctos');
      console.log('2. Confirma que el usuario tenga permisos para acceder a la base de datos');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\nSugerencias:');
      console.log('1. La base de datos especificada no existe');
      console.log('2. Crea la base de datos o corrige el nombre en las variables de entorno');
    }
  }
}

// Ejecutar la verificación
checkDatabaseConnection();
