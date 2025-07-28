import sql from 'mssql'

const config = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_SERVER ,
  database: process.env.MSSQL_DATABASE,
  port: parseInt(process.env.MSSQL_PORT || '1433'),
  options: {
    encrypt: process.env.NODE_ENV === 'production',
    trustServerCertificate: true // Ideal para desarrollo local
  }
}

let pool: sql.ConnectionPool | null = null;

export async function getMssqlPool(): Promise<sql.ConnectionPool> {
  if (pool) {
    return pool;
  }
  try {
    const newPool = new sql.ConnectionPool(config);
    const poolConnect = newPool.connect();
    
    newPool.on('error', (err: any) => {
      console.error('SQL Server Pool Error:', err);
      pool = null; // Reset pool en caso de error
    });

    await poolConnect;
    pool = newPool;
    console.log('Pool de SQL Server creado y conectado.');
    return pool;
  } catch (err: any) {
    console.error('Error al conectar a la base de datos de SQL Server:', err);
    throw new Error('No se pudo conectar a la base de datos de SQL Server.');
  }
} 