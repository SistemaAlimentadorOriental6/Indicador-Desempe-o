// Script simple para probar la conexión a la base de datos
require('dotenv').config({ path: './.env.local' });
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('Verificando variables de entorno:');
  console.log('- DB_HOST:', process.env.DB_HOST || 'No definido');
  console.log('- DB_USER:', process.env.DB_USER || 'No definido');
  console.log('- DB_NAME:', process.env.DB_NAME || 'No definido');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Conexión exitosa a la base de datos');
    
    // Probar consulta simple
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM operadores_sao6');
    console.log(`Total de operadores: ${rows[0].count}`);
    
    await connection.end();
  } catch (error) {
    console.error('Error de conexión:', error);
  }
}

testConnection();
