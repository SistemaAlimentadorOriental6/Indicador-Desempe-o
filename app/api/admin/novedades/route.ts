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
    const datos = body.novedades;
    const preview = body.preview !== false;

    if (!Array.isArray(datos)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    const cambios: any[] = [];
    const sinCambios: any[] = [];
    const sinNovedad: any[] = [];

    for (const row of datos) {
      const fecha_inicio_novedad = getValue(row, ['fecha_inicio_novedad', 'FECHA INICIO NOVEDAD (YYYY-MM-DD)']);
      const fecha_fin_novedad = getValue(row, ['fecha_fin_novedad', 'FECHA FIN NOVEDAD (YYYY-MM-DD)']);
      const codigo_empleado = getValue(row, ['codigo_empleado', 'CÓDIGO EMPLEADO', 'codigo']);
      const codigo_factor = getValue(row, ['codigo_factor', 'CÓDIGO FACTOR DE CALIFICACIÓN', 'factor']);
      const observaciones = getValue(row, ['observaciones', 'OBSERVACIONES']);

      if (!codigo_empleado || !fecha_inicio_novedad || !codigo_factor) {
        sinNovedad.push({ ...row, motivo: 'Faltan campos obligatorios (código, fecha inicio, factor)' });
        continue;
      }

      if (!preview) {
        await connection.execute(
          `INSERT INTO novedades 
            (fecha_inicio_novedad, fecha_fin_novedad, codigo_empleado, codigo_factor, observaciones)
           VALUES (?, ?, ?, ?, ?)`,
          [
            fecha_inicio_novedad, fecha_fin_novedad, codigo_empleado, codigo_factor, observaciones
          ]
        );
      }

      cambios.push({
        fecha_inicio_novedad, fecha_fin_novedad, codigo_empleado, codigo_factor, observaciones
      });
    }

    await connection.end();
    return NextResponse.json({ cambios, sinCambios, sinNovedad });
  } catch (error) {
    console.error('Error en el endpoint de novedades:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 