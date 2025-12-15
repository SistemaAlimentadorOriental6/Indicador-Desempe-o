"use client"

import React, { useState } from 'react';
import { clasificarOperador, validarPorcentajes } from '@/utils/clasificacion-cualitativa';
import { getCategoryColor } from '@/utils/operator-utils';

export default function DebugClasificacion() {
  const [bonoPorcentaje, setBonoPorcentaje] = useState<number>(100);
  const [kmPorcentaje, setKmPorcentaje] = useState<number>(94);
  const [filtroTipo, setFiltroTipo] = useState<'month' | 'year' | 'global'>('month');

  const validacion = validarPorcentajes(bonoPorcentaje, kmPorcentaje);
  const clasificacion = validacion.esValido ? clasificarOperador(bonoPorcentaje, kmPorcentaje) : null;

  const colorBono = clasificacion ? getCategoryColor(clasificacion.categoriaBono) : null;
  const colorKm = clasificacion ? getCategoryColor(clasificacion.categoriaKm) : null;
  const colorFinal = clasificacion ? getCategoryColor(clasificacion.categoriaFinal) : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Debug: Clasificación Cualitativa
        </h1>
        <p className="text-gray-600">
          Herramienta para probar la clasificación en tiempo real
        </p>
      </div>

      {/* Controles de entrada */}
      {/* Casos de prueba predefinidos */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-blue-800">Casos de Prueba Rápidos</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <button onClick={() => {setBonoPorcentaje(100); setKmPorcentaje(94);}} className="px-3 py-2 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600">Oro+Oro→Oro</button>
          <button onClick={() => {setBonoPorcentaje(100); setKmPorcentaje(92);}} className="px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">Oro+Plata→Plata</button>
          <button onClick={() => {setBonoPorcentaje(92); setKmPorcentaje(92);}} className="px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">Bronce+Plata→Plata</button>
          <button onClick={() => {setBonoPorcentaje(75); setKmPorcentaje(65);}} className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600">Mejorar+Taller→Taller</button>
          <button onClick={() => {setBonoPorcentaje(50); setKmPorcentaje(94);}} className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600">Taller+Oro→Taller</button>
          <button onClick={() => {setBonoPorcentaje(97); setKmPorcentaje(87);}} className="px-3 py-2 bg-amber-500 text-white rounded text-sm hover:bg-amber-600">Plata+Bronce→Bronce</button>
        </div>
      </div>

      {/* Prueba de API Anual */}
      <div className="bg-green-50 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-green-800">Prueba API Datos Anuales 2025</h2>
        <div className="flex gap-2">
          <button 
            onClick={async () => {
              console.log('🔍 Solicitando datos anuales 2025...');
              try {
                const response = await fetch('/api/user/rankings?filterType=year&filterValue=2025');
                const data = await response.json();
                console.log('📊 Datos anuales 2025:', data);
                console.log('📊 Total operadores:', data.data?.length || 0);
                
                // Buscar específicamente a DANILO y LUIS DANIEL
                const danilo = data.data?.find((op: any) => 
                  op.name?.toUpperCase().includes('DANILO') || 
                  op.nombre?.toUpperCase().includes('DANILO')
                );
                const luis = data.data?.find((op: any) => 
                  op.name?.toUpperCase().includes('LUIS DANIEL') || 
                  op.nombre?.toUpperCase().includes('LUIS DANIEL')
                );
                
                if (danilo) {
                  console.log('🚨 DANILO encontrado en API:', danilo);
                  console.log('🚨 Clasificación DANILO:', {
                    categoria: danilo.category,
                    bono: danilo.bonus,
                    km: danilo.km,
                    efficiency: danilo.efficiency
                  });
                }
                
                if (luis) {
                  console.log('🚨 LUIS DANIEL encontrado en API:', luis);
                  console.log('🚨 Clasificación LUIS DANIEL:', {
                    categoria: luis.category,
                    bono: luis.bonus,
                    km: luis.km,
                    efficiency: luis.efficiency
                  });
                }
                
                if (data.data?.length > 0) {
                  console.log('📊 Primer operador:', data.data[0]);
                }
              } catch (error) {
                console.error('❌ Error:', error);
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Solicitar Datos Anuales 2025
          </button>
          <button 
            onClick={async () => {
              console.log('🔍 Solicitando datos globales...');
              try {
                const response = await fetch('/api/user/rankings');
                const data = await response.json();
                console.log('📊 Datos globales:', data);
                console.log('📊 Total operadores:', data.data?.length || 0);
                if (data.data?.length > 0) {
                  console.log('📊 Primer operador:', data.data[0]);
                }
              } catch (error) {
                console.error('❌ Error:', error);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Solicitar Datos Globales
          </button>
        </div>
        <p className="text-sm text-green-600 mt-2">
          Revisa la consola del navegador para ver los resultados y el tipo de filtro aplicado.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Parámetros de Entrada</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Porcentaje de Bono (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={bonoPorcentaje}
              onChange={(e) => setBonoPorcentaje(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Porcentaje de Km (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={kmPorcentaje}
              onChange={(e) => setKmPorcentaje(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Validación */}
      {!validacion.esValido && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Errores de Validación</h3>
          <ul className="list-disc list-inside text-red-700">
            {validacion.errores.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Resultados */}
      {clasificacion && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Resultados de Clasificación</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Categoría de Bono */}
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Categoría Bono</h3>
              <div className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${colorBono?.bgLight} ${colorBono?.text}`}>
                {clasificacion.categoriaBono}
              </div>
              <p className="text-sm text-gray-600 mt-2">{bonoPorcentaje}%</p>
            </div>

            {/* Categoría de Km */}
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Categoría Km</h3>
              <div className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${colorKm?.bgLight} ${colorKm?.text}`}>
                {clasificacion.categoriaKm}
              </div>
              <p className="text-sm text-gray-600 mt-2">{kmPorcentaje}%</p>
            </div>

            {/* Categoría Final */}
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Categoría Final</h3>
              <div className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${colorFinal?.bgLight} ${colorFinal?.text}`}>
                {clasificacion.categoriaFinal}
              </div>
              <p className="text-sm text-gray-600 mt-2">Resultado combinado</p>
            </div>
          </div>

          {/* Razonamiento */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Razonamiento</h3>
            <p className="text-blue-800">{clasificacion.detalles.razonamiento}</p>
          </div>
        </div>
      )}

      {/* Matriz de referencia */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Matriz de Referencia</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rangos de Bono */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">Rangos de Bono</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                <span className="font-medium text-yellow-800">Oro</span>
                <span className="text-yellow-700">100%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded border-l-4 border-gray-400">
                <span className="font-medium text-gray-800">Plata</span>
                <span className="text-gray-700">95% - 99%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-amber-50 rounded border-l-4 border-amber-400">
                <span className="font-medium text-amber-800">Bronce</span>
                <span className="text-amber-700">90% - 94%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-orange-50 rounded border-l-4 border-orange-400">
                <span className="font-medium text-orange-800">Mejorar</span>
                <span className="text-orange-700">60% - 89%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-50 rounded border-l-4 border-red-400">
                <span className="font-medium text-red-800">Taller</span>
                <span className="text-red-700">&lt; 60%</span>
              </div>
            </div>
          </div>

          {/* Rangos de Km */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">Rangos de Km</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                <span className="font-medium text-yellow-800">Oro</span>
                <span className="text-yellow-700">≥ 94%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded border-l-4 border-gray-400">
                <span className="font-medium text-gray-800">Plata</span>
                <span className="text-gray-700">90% - 93%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-amber-50 rounded border-l-4 border-amber-400">
                <span className="font-medium text-amber-800">Bronce</span>
                <span className="text-amber-700">85% - 89%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-orange-50 rounded border-l-4 border-orange-400">
                <span className="font-medium text-orange-800">Mejorar</span>
                <span className="text-orange-700">70% - 84%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-50 rounded border-l-4 border-red-400">
                <span className="font-medium text-red-800">Taller</span>
                <span className="text-red-700">&lt; 70%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Casos de ejemplo rápidos */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Casos de Ejemplo Rápidos</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setBonoPorcentaje(100); setKmPorcentaje(95); }}
            className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm hover:bg-yellow-200"
          >
            Oro (100%, 95%)
          </button>
          <button
            onClick={() => { setBonoPorcentaje(97); setKmPorcentaje(92); }}
            className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200"
          >
            Plata (97%, 92%)
          </button>
          <button
            onClick={() => { setBonoPorcentaje(92); setKmPorcentaje(87); }}
            className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm hover:bg-amber-200"
          >
            Bronce (92%, 87%)
          </button>
          <button
            onClick={() => { setBonoPorcentaje(75); setKmPorcentaje(80); }}
            className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm hover:bg-orange-200"
          >
            Mejorar (75%, 80%)
          </button>
          <button
            onClick={() => { setBonoPorcentaje(50); setKmPorcentaje(65); }}
            className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm hover:bg-red-200"
          >
            Taller (50%, 65%)
          </button>
        </div>
      </div>
    </div>
  );
}
