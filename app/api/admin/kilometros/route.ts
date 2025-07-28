import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sao6',
};

function getValue(obj: any, keys: string[]): any {
  for (const key of keys) {
    if (obj[key] !== undefined) return obj[key];
    const found = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
    if (found) return obj[found];
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const datos = body.kilometros;
    const preview = body.preview !== false;

    if (!Array.isArray(datos)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    const cambios: any[] = [];
    const sinCambios: any[] = [];
    const sinKilometros: any[] = [];

    for (const dato of datos) {
      // Mapeo de campos flexible
      const codigo_empleado = getValue(dato, ['codigo_empleado', 'CÓDIGO EMPLEADO']);
      const codigo_variable = getValue(dato, ['codigo_variable', 'CÓDIGO VARIABLE DE CONTROL']);
      
      const raw_valor_programacion = getValue(dato, ['valor_programacion', 'VALOR VAR. PROGRAMACIÓN']);
      const raw_valor_ejecucion = getValue(dato, ['valor_ejecucion', 'VALOR VAR. EJECUCIÓN']);
      
      const valor_programacion = parseFloat(raw_valor_programacion);
      const valor_ejecucion = parseFloat(raw_valor_ejecucion);

      const fecha_inicio_programacion = getValue(dato, ['fecha_inicio_programacion', 'FECHA INICIO PROGRAMACIÓN (YYYY-MM-DD)']);
      const fecha_fin_programacion = getValue(dato, ['fecha_fin_programacion', 'FECHA FIN PROGRAMACIÓN (YYYY-MM-DD)']);
      const fecha_inicio_ejecucion = getValue(dato, ['fecha_inicio_ejecucion', 'FECHA INICIO EJECUCIÓN (YYYY-MM-DD)']);
      const fecha_fin_ejecucion = getValue(dato, ['fecha_fin_ejecucion', 'FECHA FIN EJECUCIÓN (YYYY-MM-DD)']);

      // Validación básica
      if (!codigo_empleado || !codigo_variable) {
        sinKilometros.push({ ...dato, motivo: 'Faltan campos obligatorios (código, variable)' });
        continue;
      }

      if (!fecha_inicio_programacion || !fecha_fin_programacion) {
        sinKilometros.push({ ...dato, motivo: 'Faltan campos obligatorios (fechas de programación)' });
        continue;
      }

      if (!preview) {
        // Upsert: clave primaria compuesta (codigo_empleado, codigo_variable, fecha_inicio_programacion, fecha_fin_programacion)
        await connection.execute(
          `INSERT INTO variables_control 
            (codigo_empleado, codigo_variable, valor_programacion, valor_ejecucion, fecha_inicio_programacion, fecha_fin_programacion, fecha_inicio_ejecucion, fecha_fin_ejecucion)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             valor_programacion = VALUES(valor_programacion),
             valor_ejecucion = VALUES(valor_ejecucion),
             fecha_inicio_ejecucion = VALUES(fecha_inicio_ejecucion),
             fecha_fin_ejecucion = VALUES(fecha_fin_ejecucion)
          `,
          [
            codigo_empleado,
            codigo_variable,
            isNaN(valor_programacion) ? 0 : valor_programacion,
            isNaN(valor_ejecucion) ? 0 : valor_ejecucion,
            fecha_inicio_programacion,
            fecha_fin_programacion,
            fecha_inicio_ejecucion,
            fecha_fin_ejecucion,
          ]
        );
      }

      cambios.push({
        codigo_empleado, codigo_variable, valor_programacion, valor_ejecucion,
        fecha_inicio_programacion, fecha_fin_programacion,
        fecha_inicio_ejecucion, fecha_fin_ejecucion
      });
    }

    await connection.end();
    return NextResponse.json({ cambios, sinCambios, sinKilometros });
  } catch (error) {
    console.error('Error en el endpoint de kilometros:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 