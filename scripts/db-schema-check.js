// Script para verificar la estructura de las tablas y los datos disponibles
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkDatabaseSchema() {
  console.log('=== DIAGNÓSTICO DE ESTRUCTURA DE BASE DE DATOS ===');
  console.log('Verificando variables de entorno:');
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
    
    // Verificar tabla de operadores
    console.log('\n=== TABLA OPERADORES_SAO6 ===');
    
    // Verificar si la tabla existe
    const [tableCheck] = await connection.execute('SHOW TABLES LIKE "operadores_sao6"');
    if (tableCheck.length === 0) {
      console.log('❌ La tabla operadores_sao6 NO existe');
      return;
    }
    
    console.log('✅ La tabla operadores_sao6 existe');
    
    // Obtener estructura de la tabla
    const [columns] = await connection.execute('DESCRIBE operadores_sao6');
    console.log('\nEstructura de la tabla:');
    columns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type})`);
    });
    
    // Contar registros
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM operadores_sao6');
    console.log(`\nTotal de registros: ${countResult[0].total}`);
    
    // Mostrar primeros 5 registros
    if (countResult[0].total > 0) {
      const [sampleRows] = await connection.execute('SELECT * FROM operadores_sao6 LIMIT 5');
      console.log('\nPrimeros 5 registros:');
      sampleRows.forEach((row, index) => {
        console.log(`\nRegistro #${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
    }
    
    // Verificar tabla de variables (kilómetros)
    console.log('\n\n=== TABLA VARIABLES_SAO6 ===');
    
    // Verificar si la tabla existe
    const [varTableCheck] = await connection.execute('SHOW TABLES LIKE "variables_sao6"');
    if (varTableCheck.length === 0) {
      console.log('❌ La tabla variables_sao6 NO existe');
      return;
    }
    
    console.log('✅ La tabla variables_sao6 existe');
    
    // Obtener estructura de la tabla
    const [varColumns] = await connection.execute('DESCRIBE variables_sao6');
    console.log('\nEstructura de la tabla:');
    varColumns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type})`);
    });
    
    // Contar registros de kilómetros
    const [kmCountResult] = await connection.execute('SELECT COUNT(*) as total FROM variables_sao6 WHERE codigo_variable = "KMS"');
    console.log(`\nTotal de registros de kilómetros: ${kmCountResult[0].total}`);
    
    // Mostrar primeros 5 registros de kilómetros
    if (kmCountResult[0].total > 0) {
      const [kmSampleRows] = await connection.execute(
        'SELECT * FROM variables_sao6 WHERE codigo_variable = "KMS" LIMIT 5'
      );
      console.log('\nPrimeros 5 registros de kilómetros:');
      kmSampleRows.forEach((row, index) => {
        console.log(`\nRegistro #${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
      
      // Mostrar años y meses disponibles
      const [yearsResult] = await connection.execute(
        'SELECT DISTINCT YEAR(fecha_inicio_programacion) as year FROM variables_sao6 WHERE codigo_variable = "KMS" ORDER BY year DESC'
      );
      console.log('\nAños disponibles:');
      yearsResult.forEach(row => {
        console.log(`- ${row.year}`);
      });
      
      // Mostrar códigos de empleados únicos
      const [employeesResult] = await connection.execute(
        'SELECT DISTINCT codigo_empleado FROM variables_sao6 WHERE codigo_variable = "KMS" LIMIT 10'
      );
      console.log('\nCódigos de empleados (primeros 10):');
      employeesResult.forEach(row => {
        console.log(`- ${row.codigo_empleado}`);
      });
    }
    
    // Cerrar conexión
    await connection.end();
    console.log('\n=== DIAGNÓSTICO COMPLETADO ===');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Detalles del error:', error);
  }
}

// Ejecutar el diagnóstico
checkDatabaseSchema();
