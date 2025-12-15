"use client"

import React from 'react';
import { clasificarOperador, validarPorcentajes, obtenerInfoCategoria } from '@/utils/clasificacion-cualitativa';
import { clasificarOperadorIndividual } from '@/utils/operator-utils';
import { getCategoryColor } from '@/utils/operator-utils';

interface CasoPrueba {
  nombre: string;
  bono: number;
  km: number;
  esperado?: string;
}

// Casos de prueba basados en las tablas proporcionadas
const casosPrueba: CasoPrueba[] = [
  // Casos Oro
  { nombre: "Oro perfecto", bono: 100, km: 94, esperado: "Oro" },
  { nombre: "Oro con km alto", bono: 100, km: 98, esperado: "Oro" },
  
  // Casos Plata
  { nombre: "Plata típico", bono: 97, km: 92, esperado: "Plata" },
  { nombre: "Oro-Plata", bono: 100, km: 92, esperado: "Plata" },
  
  // Casos Bronce
  { nombre: "Bronce típico", bono: 92, km: 87, esperado: "Bronce" },
  { nombre: "Oro-Bronce", bono: 100, km: 87, esperado: "Plata" },
  { nombre: "Plata-Bronce", bono: 97, km: 87, esperado: "Bronce" },
  
  // Casos Mejorar
  { nombre: "Mejorar típico", bono: 75, km: 80, esperado: "Mejorar" },
  { nombre: "Oro-Mejorar", bono: 100, km: 80, esperado: "Bronce" },
  
  // Casos Taller Conciencia
  { nombre: "Taller típico", bono: 50, km: 65, esperado: "Taller Conciencia" },
  { nombre: "Oro-Taller", bono: 100, km: 65, esperado: "Bronce" },
];

export default function TestClasificacion() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Prueba de Clasificación Cualitativa
        </h1>
        <p className="text-gray-600">
          Validación del sistema de clasificación basado en porcentajes de Bono y Km
        </p>
      </div>

      {/* Tabla de rangos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Rangos de Bono</h2>
          <div className="space-y-2">
            <div className="flex justify-between p-2 bg-yellow-50 rounded">
              <span className="font-medium">Oro:</span>
              <span>100%</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="font-medium">Plata:</span>
              <span>95% - 99%</span>
            </div>
            <div className="flex justify-between p-2 bg-amber-50 rounded">
              <span className="font-medium">Bronce:</span>
              <span>90% - 94%</span>
            </div>
            <div className="flex justify-between p-2 bg-orange-50 rounded">
              <span className="font-medium">Mejorar:</span>
              <span>60% - 89%</span>
            </div>
            <div className="flex justify-between p-2 bg-red-50 rounded">
              <span className="font-medium">Taller:</span>
              <span>&lt; 60%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Rangos de Km</h2>
          <div className="space-y-2">
            <div className="flex justify-between p-2 bg-yellow-50 rounded">
              <span className="font-medium">Oro:</span>
              <span>≥ 94%</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="font-medium">Plata:</span>
              <span>90% - 93%</span>
            </div>
            <div className="flex justify-between p-2 bg-amber-50 rounded">
              <span className="font-medium">Bronce:</span>
              <span>85% - 89%</span>
            </div>
            <div className="flex justify-between p-2 bg-orange-50 rounded">
              <span className="font-medium">Mejorar:</span>
              <span>70% - 84%</span>
            </div>
            <div className="flex justify-between p-2 bg-red-50 rounded">
              <span className="font-medium">Taller:</span>
              <span>&lt; 70%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Casos de prueba */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Casos de Prueba</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Caso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bono %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Km %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cat. Bono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cat. Km
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resultado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Esperado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {casosPrueba.map((caso, index) => {
                const validacion = validarPorcentajes(caso.bono, caso.km);
                if (!validacion.esValido) {
                  return (
                    <tr key={index} className="bg-red-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {caso.nombre}
                      </td>
                      <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        Error: {validacion.errores.join(', ')}
                      </td>
                    </tr>
                  );
                }

                const clasificacion = clasificarOperador(caso.bono, caso.km);
                const esCorrect = !caso.esperado || clasificacion.categoriaFinal === caso.esperado;
                const colorCategoria = getCategoryColor(clasificacion.categoriaFinal);

                return (
                  <tr key={index} className={esCorrect ? "bg-white" : "bg-red-50"}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {caso.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caso.bono}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caso.km}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(clasificacion.categoriaBono).bgLight} ${getCategoryColor(clasificacion.categoriaBono).text}`}>
                        {clasificacion.categoriaBono}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(clasificacion.categoriaKm).bgLight} ${getCategoryColor(clasificacion.categoriaKm).text}`}>
                        {clasificacion.categoriaKm}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorCategoria.bgLight} ${colorCategoria.text}`}>
                        {clasificacion.categoriaFinal}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caso.esperado || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {esCorrect ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          ✓ Correcto
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          ✗ Error
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Información del Sistema
        </h3>
        <p className="text-blue-800 text-sm mb-4">
          El sistema de clasificación cualitativa combina los porcentajes de Bono y Km 
          para determinar la categoría final del operador según la matriz de clasificación establecida.
        </p>
        <div className="text-xs text-blue-700">
          <p><strong>Lógica:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Se clasifica individualmente el porcentaje de Bono y Km</li>
            <li>Se aplica la matriz de combinaciones para obtener la categoría final</li>
            <li>La categoría final puede ser diferente a las individuales según las reglas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
