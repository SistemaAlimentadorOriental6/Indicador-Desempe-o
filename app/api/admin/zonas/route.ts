import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sao6',
};

function normalizeCodigo(codigo: string | number | undefined | null): string {
  if (codigo === undefined || codigo === null) return '';
  return String(codigo).trim().replace(/^0+/, '').toUpperCase();
}

function findValue(obj: any, keys: string[]): string | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    const objKeys = Object.keys(obj);
    for (const key of keys) {
        const upperKey = key.toUpperCase();
        for (const objKey of objKeys) {
            if (objKey.trim().toUpperCase() === upperKey) {
                return obj[objKey];
            }
        }
    }
    return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const operadoresExcel = body.operadores; // Ahora son los datos crudos del Excel
    const preview = body.preview !== false;
    if (!Array.isArray(operadoresExcel)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    const [operadoresDB]: any = await connection.execute('SELECT codigo, zona, nombre FROM operadores_sao6');

    type DBOp = { codigo: string; zona: string; nombre: string };
    const dbMap = new Map<string, { zona: string; nombre: string; codigoOriginal: string }>(
      (operadoresDB as DBOp[]).map((op) => [normalizeCodigo(op.codigo), { zona: op.zona, nombre: op.nombre, codigoOriginal: op.codigo }])
    );

    const excelMap = new Map<string, { zona: string; nombreExcel?: string; codigoOriginal: string }>();
    for (const op of operadoresExcel) {
        const codigo = findValue(op, ["codigo", "código", "CODIGO"]);
        const zona = findValue(op, ["zona", "ZONA"]);
        const nombreExcel = findValue(op, ["nombre", "NOMBRE"]);
        const codigoStr = String(codigo || '').trim();
        if (codigoStr) { // Solo procesar si hay un código
            excelMap.set(normalizeCodigo(codigoStr), {
                zona: String(zona || ''),
                nombreExcel: String(nombreExcel || ''),
                codigoOriginal: codigoStr
            });
        }
    }
    
    console.log('=== DEBUG INFO ===');
    console.log('Primeros 5 códigos de la base de datos:', (operadoresDB as any[]).slice(0, 5).map(op => ({ original: op.codigo, normalizado: normalizeCodigo(op.codigo) })));
    console.log('Primeros 5 códigos del Excel (procesados):', Array.from(excelMap.values()).slice(0, 5).map(op => ({ original: op.codigoOriginal, normalizado: normalizeCodigo(op.codigoOriginal) })));
    console.log('Total códigos en DB:', dbMap.size);
    console.log('Total códigos en Excel (con código válido):', excelMap.size);

    const cambios: any[] = [];
    const sinZona: any[] = [];
    const sinCambios: any[] = [];

    let coincidencias = 0;
    for (const [codigoNorm, opExcel] of excelMap.entries()) {
      const dbOp = dbMap.get(codigoNorm);
      if (!dbOp) {
        console.log(`Código del Excel no encontrado en DB: ${codigoNorm} (original: ${opExcel.codigoOriginal})`);
        continue;
      }
      coincidencias++;
      if ((dbOp.zona || '') !== (opExcel.zona || '')) {
        if (!preview) {
          await connection.execute('UPDATE operadores_sao6 SET zona = ? WHERE codigo = ?', [opExcel.zona, dbOp.codigoOriginal]);
        }
        cambios.push({ codigo: dbOp.codigoOriginal, nombre: dbOp.nombre, zonaAnterior: dbOp.zona, zonaNueva: opExcel.zona });
      } else {
        sinCambios.push({ codigo: dbOp.codigoOriginal, nombre: dbOp.nombre, zonaAnterior: dbOp.zona, zonaNueva: opExcel.zona });
      }
    }

    console.log(`Coincidencias encontradas: ${coincidencias}`);

    for (const [codigoNorm, dbOp] of dbMap.entries()) {
      if (!excelMap.has(codigoNorm)) {
        sinZona.push({ codigo: dbOp.codigoOriginal, nombre: dbOp.nombre, zonaAnterior: dbOp.zona, zonaNueva: null });
      }
    }

    await connection.end();

    return NextResponse.json({ cambios, sinCambios, sinZona });
  } catch (error) {
    console.error('Error en el endpoint de zonas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
 