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

function cleanKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/\s+/g, '') // quita espacios
    .replace(/[^a-z0-9]/g, ''); // solo letras y números
}

function findValue(obj: any, keys: string[]): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const objKeys = Object.keys(obj);
  for (const key of keys) {
    const cleanTarget = cleanKey(key);
    for (const objKey of objKeys) {
      if (cleanKey(objKey) === cleanTarget) {
        return obj[objKey];
      }
    }
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const operadoresExcel = body.operadores;
    const preview = body.preview !== false;
    if (!Array.isArray(operadoresExcel)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    // Obtener todos los operadores actuales (incluyendo nombre y padrino)
    const [operadoresDB]: any = await connection.execute('SELECT codigo, nombre, padrino FROM operadores_sao6');
    // Map de operadores por código
    type DBOp = { codigo: string; nombre: string; padrino: string };
    const dbMap = new Map<string, { nombre: string; padrino: string; codigoOriginal: string }>(
      (operadoresDB as DBOp[]).map((op) => [normalizeCodigo(op.codigo), { nombre: op.nombre, padrino: op.padrino, codigoOriginal: op.codigo }])
    );
    // Map de Excel por código
    const excelMap = new Map<string, { padrino: string; nombreExcel?: string; codigoOriginal: string }>();
    for (const op of operadoresExcel) {
      const codigo = findValue(op, ["codigo", "código", "CODIGO", "codigo conductor", "CODIGO CONDUCTOR"]);
      let padrinoNombre = findValue(op, ["padrino", "PADRINO"]);
      const nombreExcel = findValue(op, ["nombre", "NOMBRE", "descripción", "DESCRIPCIÓN"]);
      const codigoStr = String(codigo || '').trim();
      if (padrinoNombre) padrinoNombre = padrinoNombre.toUpperCase();
      if (codigoStr) {
        excelMap.set(normalizeCodigo(codigoStr), {
          padrino: padrinoNombre || '',
          nombreExcel: String(nombreExcel || ''),
          codigoOriginal: codigoStr
        });
      }
    }

    // Map para buscar nombre del padrino
    const padrinoNombreMap = new Map<string, string>(
      (operadoresDB as DBOp[]).map((op) => [normalizeCodigo(op.codigo), op.nombre])
    );

    const cambios: any[] = [];
    const sinPadrino: any[] = [];
    const sinCambios: any[] = [];

    let coincidencias = 0;
    let updatesRealizados = 0;
    for (const [codigoNorm, opExcel] of excelMap.entries()) {
      const dbOp = dbMap.get(codigoNorm);
      if (!dbOp) continue;
      coincidencias++;
      // Si el padrino es diferente (o uno está vacío y el otro no)
      if ((dbOp.padrino || '') !== (opExcel.padrino || '')) {
        if (!preview) {
          if (!opExcel.padrino || opExcel.padrino.trim() === '') {
            await connection.execute('UPDATE operadores_sao6 SET padrino = NULL WHERE codigo = ?', [dbOp.codigoOriginal]);
            updatesRealizados++;
          } else {
            await connection.execute('UPDATE operadores_sao6 SET padrino = ? WHERE codigo = ?', [opExcel.padrino, dbOp.codigoOriginal]);
            updatesRealizados++;
          }
        }
        cambios.push({
          codigo: dbOp.codigoOriginal,
          nombre: dbOp.nombre,
          padrinoAnterior: dbOp.padrino,
          padrinoNuevo: opExcel.padrino,
          nombrePadrinoAnterior: dbOp.padrino,
          nombrePadrinoNuevo: opExcel.padrino,
        });
      } else {
        sinCambios.push({
          codigo: dbOp.codigoOriginal,
          nombre: dbOp.nombre,
          padrinoAnterior: dbOp.padrino,
          padrinoNuevo: opExcel.padrino,
          nombrePadrinoAnterior: dbOp.padrino,
          nombrePadrinoNuevo: opExcel.padrino,
        });
      }
    }
    // Operadores que no recibieron padrino (no están en el Excel)
    for (const [codigoNorm, dbOp] of dbMap.entries()) {
      if (!excelMap.has(codigoNorm)) {
        sinPadrino.push({
          codigo: dbOp.codigoOriginal,
          nombre: dbOp.nombre,
          padrinoAnterior: dbOp.padrino,
          padrinoNuevo: null,
          nombrePadrinoAnterior: dbOp.padrino,
          nombrePadrinoNuevo: '',
        });
      }
    }
    await connection.end();
    return NextResponse.json({ cambios, sinCambios, sinPadrino, mensaje: preview ? 'Solo vista previa, no se guardó nada.' : `Cambios aplicados: ${updatesRealizados}` });
  } catch (error) {
    console.error('Error en el endpoint de padrinos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 