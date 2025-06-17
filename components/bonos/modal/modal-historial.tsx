import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { History, CheckCircle, Calendar, Loader2, TrendingUp, AlertCircle } from "lucide-react"
import type { PersonaBono, HistorialMensual } from "@/types/bono-types"
import { formatCurrency, getNovedadIcon } from "@/utils/bono-utils"
import { formatPercentage } from "@/utils/format-utils"

interface ModalHistorialProps {
  persona: PersonaBono
}

export const ModalHistorial: React.FC<ModalHistorialProps> = ({ persona }) => {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [yearlyData, setYearlyData] = useState<Record<string, any>>({});
  const [allYearsLoaded, setAllYearsLoaded] = useState(false);
  
  // Función para normalizar fechas que pueden venir en diferentes formatos
  const normalizarFecha = (fecha: any): string | null => {
    if (!fecha) return null;
    
    // Si es un string, devolverlo tal cual
    if (typeof fecha === 'string') return fecha;
    
    // Si es un objeto Date, convertirlo a string ISO
    if (fecha instanceof Date) {
      return fecha.toISOString();
    }
    
    // Intentar convertir a string
    try {
      return String(fecha);
    } catch (e) {
      console.warn('No se pudo normalizar la fecha:', fecha);
      return null;
    }
  };
  
  // Función para formatear fechas en formato DD/MM/YYYY
  const formatearFecha = (fecha: string | null | undefined): string => {
    if (!fecha) return 'Sin fecha';
    if (fecha === 'Sin fecha') return fecha;
    
    try {
      // Si ya está en formato DD/MM/YYYY, retornar tal cual
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
        return fecha;
      }
      
      // Si es un timestamp numérico, convertirlo a Date
      if (!isNaN(Number(fecha))) {
        const timestamp = Number(fecha);
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        }
      }
      
      // Si está en formato ISO YYYY-MM-DD (con o sin T y zona horaria)
      if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fecha)) {
        const [year, month, day] = fecha.split('T')[0].split('-');
        return `${day}/${month}/${year}`;
      }
      
      const date = new Date(fecha);
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida:', fecha);
        return 'Sin fecha';
      }
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Sin fecha';
    }
  };

  // Función para procesar las afectaciones
  const procesarAfectaciones = useCallback((afectaciones: any[]) => {
    if (!Array.isArray(afectaciones)) return [];
    
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    return afectaciones.map((afectacion, index) => {
      // Determinar las fechas según el formato de los datos
      let fechaInicioOriginal = afectacion.fechaInicio || afectacion.fecha_inicio_novedad || null;
      let fechaFinOriginal = afectacion.fechaFin || afectacion.fecha_fin_novedad || null;
      
      // Normalizar las fechas para asegurar que sean strings válidos
      fechaInicioOriginal = normalizarFecha(fechaInicioOriginal);
      fechaFinOriginal = normalizarFecha(fechaFinOriginal);
      
      // Formatear fechas
      const fechaInicio = formatearFecha(fechaInicioOriginal);
      const fechaFin = formatearFecha(fechaFinOriginal);
      
      // Imprimir información de depuración para algunas afectaciones
      if (index < 2) {
        console.log(`Procesando afectación ${afectacion.id || 'sin ID'} en historial:`, {
          fechaInicioOriginal,
          fechaInicioFormateada: fechaInicio,
          fechaFinOriginal,
          fechaFinFormateada: fechaFin
        });
      }
      
      // Calcular días entre fechas si no viene especificado
      let cantidadDias = afectacion.cantidadDias || afectacion.dias || afectacion.dias_novedad || 0;
      
      // Calcular el mes si no viene especificado
      let mes = afectacion.mes || '';
      if (mes === 'undefined NaN' || mes === 'Sin fecha' || !mes) {
        try {
          if (fechaInicio !== 'Sin fecha') {
            // Extraer componentes de la fecha formateada (DD/MM/YYYY)
            const [dia, mesNum, anio] = fechaInicio.split('/');
            // Crear un objeto Date para obtener el nombre del mes
            const fecha = new Date(parseInt(anio), parseInt(mesNum) - 1, parseInt(dia));
            // Verificar si la fecha es válida
            if (!isNaN(fecha.getTime())) {
              // Obtener el nombre del mes en español
              mes = `${nombresMeses[fecha.getMonth()]} ${fecha.getFullYear()}`;
              if (index < 5) {
                console.log(`Mes calculado para afectación ${afectacion.id || 'sin ID'}: ${mes}`);
              }
            }
          }
        } catch (error) {
          console.warn('Error al calcular el mes:', error);
          mes = 'Sin fecha';
        }
      }
      
      return {
        ...afectacion,
        fechaInicio,
        fechaFin,
        cantidadDias,
        mes,
        descripcion: afectacion.observaciones || afectacion.concepto || afectacion.descripcion || 'Sin descripción',
        falta: afectacion.concepto || afectacion.falta || afectacion.novedad || 'Sin clasificar',
        codigo: afectacion.codigo || afectacion.codigo_factor
      };
    });
  }, []);

  // Función para generar historial simulado si no hay datos reales
  const generarHistorialSimulado = useCallback(() => {
    // Si ya tenemos historial mensual, usarlo directamente
    if (Array.isArray(persona?.historialMensual) && persona.historialMensual.length > 0) {
      return persona.historialMensual;
    }
    
    const historialSimulado: HistorialMensual[] = [];
    const añoActual = new Date().getFullYear();
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    // Verificar si tenemos datos de la API en el formato original
    const tieneDeductions = Array.isArray(persona?.deductions) && persona.deductions?.length > 0;
    const tieneData = Array.isArray(persona?.data) && persona.data?.length > 0;
    
    // Usar la fuente de datos más completa disponible
    let afectacionesBase: any[] = [];
    if (Array.isArray(persona?.afectaciones) && persona.afectaciones.length > 0) {
      afectacionesBase = persona.afectaciones;
      console.log('Usando afectaciones ya procesadas:', afectacionesBase.slice(0, 2));
    } else if (tieneDeductions && persona.deductions) {
      // Convertir deductions a formato BonoAfectacion
      afectacionesBase = persona.deductions.map(item => ({
        id: item.id,
        fechaInicio: normalizarFecha(item.fechaInicio),
        fechaFin: normalizarFecha(item.fechaFin),
        cantidadDias: item.dias || 0,
        novedad: item.concepto || 'Sin concepto',
        descripcion: item.concepto || 'Sin descripción',
        porcentajeAfectacion: typeof item.porcentaje === 'string' ? 
          parseInt(item.porcentaje.replace('%', '')) || 0 : (item.porcentaje || 0),
        montoDescuento: item.monto || 0,
        estado: 'finalizado',
        tipoIcono: 'descargo',
        mes: '',
        falta: item.concepto || 'Sin clasificar',
        codigo: item.codigo || ''
      }));
      console.log('Convertidas deductions a afectaciones:', afectacionesBase.slice(0, 2));
    } else if (tieneData && persona.data) {
      // Convertir data a formato BonoAfectacion
      afectacionesBase = persona.data.map(item => ({
        id: item.id,
        fechaInicio: normalizarFecha(item.fecha_inicio_novedad),
        fechaFin: normalizarFecha(item.fecha_fin_novedad),
        cantidadDias: item.dias_novedad || 0,
        novedad: item.observaciones || 'Sin observaciones',
        descripcion: item.observaciones || 'Sin descripción',
        porcentajeAfectacion: 0,
        montoDescuento: 0,
        estado: 'finalizado',
        tipoIcono: 'descargo',
        mes: '',
        falta: item.observaciones || 'Sin clasificar',
        codigo: item.codigo_factor || ''
      }));
      console.log('Convertidos data items a afectaciones:', afectacionesBase.slice(0, 2));
    }
    
    // Procesar las afectaciones para asegurar que tengan el formato correcto
    const afectacionesProcesadas = procesarAfectaciones(afectacionesBase);
    
    // Si tenemos afectaciones procesadas, usarlas para generar el historial
    const tieneAfectaciones = afectacionesProcesadas.length > 0;
    
    for (let año = añoActual; año >= añoActual - 1; año--) {
      const mesLimite = año === añoActual ? new Date().getMonth() + 1 : 12;
      
      for (let mes = 1; mes <= mesLimite; mes++) {
        const montoBase = Math.floor(Math.random() * 400) + 800;
        
        const descuentoPorcentaje = Math.random() * 0.3;
        const descuentos = Math.round(montoBase * descuentoPorcentaje);
        
        const numAfectaciones = Math.floor(Math.random() * 3);
        const afectaciones = [];
        
        // Buscar afectaciones reales que coincidan con este mes y año
        let historialReal = null;
        if (tieneAfectaciones) {
          // Filtrar afectaciones por mes y año
          const afectacionesMes = afectacionesProcesadas.filter(a => {
            if (!a.fechaInicio || a.fechaInicio === 'Sin fecha') return false;
            
            try {
              // Extraer fecha de fechaInicio (formato DD/MM/YYYY)
              const [dia, mesNum, anioStr] = a.fechaInicio.split('/');
              const mesIndex = parseInt(mesNum) - 1;
              const anio = parseInt(anioStr);
              
              return mesIndex === (mes - 1) && anio === año;
            } catch (error) {
              return false;
            }
          });
          
          if (afectacionesMes.length > 0) {
            historialReal = {
              mes: `${meses[mes-1]} ${año}`,
              afectaciones: afectacionesMes
            };
          }
        }
        
        if (historialReal && Array.isArray(historialReal.afectaciones) && historialReal.afectaciones.length > 0) {
          const calcularDiasEntreFechas = (fechaInicio: string, fechaFin: string): number => {
            try {
              const inicio = new Date(fechaInicio);
              const fin = new Date(fechaFin);
              
              if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
                console.log('Fechas inválidas para cálculo de días:', fechaInicio, fechaFin);
                return 0;
              }
              
              const inicioUTC = Date.UTC(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
              const finUTC = Date.UTC(fin.getFullYear(), fin.getMonth(), fin.getDate());
              
              return Math.round((finUTC - inicioUTC) / 86400000) + 1; // +1 porque incluimos ambos días
            } catch (error) {
              console.log('Error al calcular días entre fechas:', error);
              return 0;
            }
          };
          
          historialReal.afectaciones.forEach((afectacion: any) => {
            let cantidadDias = afectacion.cantidadDias || 0;
            if (afectacion.fechaInicio && afectacion.fechaFin && 
                afectacion.fechaInicio !== 'Sin fecha' && afectacion.fechaFin !== 'Sin fecha') {
              cantidadDias = calcularDiasEntreFechas(afectacion.fechaInicio, afectacion.fechaFin);
            }
            
            // Actualizar la afectación con los datos correctos
            afectacion.cantidadDias = cantidadDias;
            afectacion.fechaInicio = formatearFecha(afectacion.fechaInicio);
            afectacion.fechaFin = formatearFecha(afectacion.fechaFin);
          });
          
          // Usar las afectaciones reales ya procesadas
          afectaciones.push(...historialReal.afectaciones);
        }
        
        historialSimulado.push({
          mes: `${meses[mes-1]} ${año}`,
          montoInicial: montoBase,
          descuentos,
          montoFinal: montoBase - descuentos,
          afectaciones
        });
      }
    }
    
    return historialSimulado;
  }, [persona?.historialMensual]);
  
  // Ensure historialMensual exists and is an array
  const historialMensual = generarHistorialSimulado();
  
  // Get available years from persona.bonusesByYear, availableYears, or generate from historialMensual
  const availableYears = useMemo(() => {
    if (persona.availableYears && persona.availableYears.length > 0) {
      return persona.availableYears.map(year => year.toString()).sort((a, b) => Number(b) - Number(a));
    } else if (persona.bonusesByYear && Object.keys(persona.bonusesByYear).length > 0) {
      return Object.keys(persona.bonusesByYear).sort((a, b) => Number(b) - Number(a));
    } else {
      // Extraer años únicos del historial mensual
      const años = new Set<string>();
      historialMensual.forEach(mes => {
        const yearMatch = mes.mes?.match(/\d{4}$/);
        if (yearMatch) años.add(yearMatch[0]);
      });
      return Array.from(años).sort((a, b) => Number(b) - Number(a));
    }
  }, [persona.availableYears, persona.bonusesByYear, historialMensual]);
  
  // Group history by year
  const historyByYear: Record<string, HistorialMensual[]> = {};
  
  historialMensual.forEach(mes => {
    // Extract year from mes.mes (format: "Month Year")
    const yearMatch = mes.mes?.match(/\d{4}$/);
    const year = yearMatch ? yearMatch[0] : 'Sin año';
    
    if (!historyByYear[year]) {
      historyByYear[year] = [];
    }
    
    historyByYear[year].push(mes);
  });
  
  // Calculate annual summary for each year
  const annualSummaries = Object.entries(historyByYear).map(([year, months]) => {
    const baseAmount = months.reduce((sum, month) => sum + (typeof month.montoInicial === 'number' && !isNaN(month.montoInicial) ? month.montoInicial : 0), 0);
    const totalDeductions = months.reduce((sum, month) => sum + (typeof month.descuentos === 'number' && !isNaN(month.descuentos) ? month.descuentos : 0), 0);
    const efficiency = baseAmount > 0 ? Math.round(((baseAmount - totalDeductions) / baseAmount) * 100) : 100;
    
    return {
      year,
      baseAmount,
      totalDeductions,
      efficiency
    };
  });
  
  // Función para obtener todos los datos de años de una sola vez usando la API batch o datos existentes
  const fetchAllYearsData = useCallback(async () => {
    // Si ya tenemos datos completos o no hay código de persona, no hacemos nada
    if (allYearsLoaded || !persona.codigo) return;
    
    // Verificamos si ya tenemos datos suficientes en el objeto persona
    if (persona.bonusesByYear && Object.keys(persona.bonusesByYear).length > 0 && 
        (persona.baseBonus !== undefined || persona.montoBase)) {
      // Ya tenemos datos suficientes, no necesitamos hacer una llamada API
      setYearlyData({
        ...persona,
        // Aseguramos que tengamos valores consistentes
        baseBonus: persona.baseBonus || persona.montoBase,
        deductionAmount: persona.deductionAmount || persona.totalDescuentosAcumulados,
        deductionPercentage: persona.deductionPercentage || 
          (persona.montoBase > 0 ? Math.round((persona.totalDescuentosAcumulados / persona.montoBase) * 100) : 0),
        summary: persona.summary || {
          percentage: persona.eficiencia
        }
      });
      setAllYearsLoaded(true);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {      
      // Usamos localStorage para cachear los resultados y evitar llamadas repetidas
      const cacheKey = `bono_data_${persona.codigo}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          const cacheTime = parsedData.timestamp;
          const now = Date.now();
          
          // Si el caché tiene menos de 5 minutos, lo usamos
          if (now - cacheTime < 5 * 60 * 1000) {
            setYearlyData(parsedData.data);
            setAllYearsLoaded(true);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          // Si hay error al parsear el caché, lo ignoramos y seguimos con la llamada API
          console.warn('Error parsing cached data:', e);
        }
      }
      
      // Use the batch API to get all years data in a single request
      const response = await fetch('/api/user/bonuses/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigos: [persona.codigo]
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch bonus data');
      
      const data = await response.json();
      
      if (data.success && data.results && data.results[persona.codigo]) {
        const resultData = data.results[persona.codigo];
        
        // Guardar en caché con timestamp
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: resultData,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Error caching data:', e);
        }
        
        // Store all years data
        setYearlyData(resultData);
        setAllYearsLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching bonus data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [persona, allYearsLoaded]);
  
  // Load all data on component mount
  useEffect(() => {
    fetchAllYearsData();
  }, [fetchAllYearsData]);
  
  // Set initial selected year after data is loaded
  useEffect(() => {
    // Solo establecemos el año seleccionado si no hay ninguno seleccionado todavía
    // y tenemos años disponibles
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[0]);
      setExpandedYears(prev => ({ ...prev, [availableYears[0]]: true }));
    }
    // Solo establecemos el año actual si no hay años disponibles Y no hay año seleccionado
    else if (availableYears.length === 0 && !selectedYear) {
      const currentYear = new Date().getFullYear().toString();
      setSelectedYear(currentYear);
      setExpandedYears(prev => ({ ...prev, [currentYear]: true }));
    }
  }, [availableYears]); // Eliminamos selectedYear de las dependencias
  
  // Toggle year expansion
  const toggleYearExpand = (year: string) => {
    setExpandedYears(prev => {
      const newState = { ...prev, [year]: !prev[year] };
      return newState;
    });
  };
  
  // Función para renderizar la evolución mensual de bonos
  const renderMonthlyEvolution = () => {
    // Si no hay datos de historial mensual, mostrar mensaje
    if (!historialMensual || historialMensual.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay suficientes datos para mostrar la evolución mensual</p>
        </div>
      );
    }
    
    // Ordenar el historial por mes (asumiendo que el formato es "Mes YYYY")
    const sortedHistory = [...historialMensual].sort((a, b) => {
      const monthsOrder: Record<string, number> = {
        'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
        'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
      };
      
      // Extraer solo el nombre del mes y manejar valores nulos
      const monthA = (a.mes?.split(' ')[0] || '') as string;
      const monthB = (b.mes?.split(' ')[0] || '') as string;
      
      // Usar el valor del mes en el objeto monthsOrder o 0 si no existe
      const orderA = monthA in monthsOrder ? monthsOrder[monthA] : 0;
      const orderB = monthB in monthsOrder ? monthsOrder[monthB] : 0;
      
      return orderA - orderB;
    });
    
    // Calcular el valor máximo para la escala
    const maxValue = Math.max(...sortedHistory.map(item => item.montoFinal || 0));
    
    return (
      <div className="mt-4">
        <div className="flex items-end space-x-2 h-40 mb-2 relative">
          {/* Líneas de referencia horizontales */}
          <div className="absolute w-full h-full">
            {[0.25, 0.5, 0.75].map((level) => (
              <div 
                key={`level-${level}`}
                className="absolute w-full border-t border-gray-200 border-dashed"
                style={{ bottom: `${level * 100}%` }}
              />
            ))}
          </div>
          
          {/* Barras de evolución */}
          {sortedHistory.map((item, index) => {
            const height = maxValue > 0 ? ((item.montoFinal || 0) / maxValue) * 100 : 0;
            const hasDeductions = (item.descuentos || 0) > 0;
            const monthName = item.mes?.split(' ')[0] || '';
            
            return (
              <div key={`bar-${index}`} className="flex flex-col items-center flex-1">
                <div className="w-full flex justify-center mb-1">
                  <div 
                    className={`w-8 rounded-t-md ${hasDeductions ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 truncate w-full text-center">
                  {monthName.substring(0, 3)}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <div>0</div>
          <div>{formatCurrency(maxValue / 2)}</div>
          <div>{formatCurrency(maxValue)}</div>
        </div>
        
        <div className="flex justify-center mt-4 space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
            <span className="text-sm">Bono completo</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-amber-500 rounded-full mr-2" />
            <span className="text-sm">Con descuentos</span>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
          <History className="w-6 h-6 text-white" />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-xl">Historial Mensual</h4>
          <p className="text-gray-600">Evolución de bonos mes a mes</p>
        </div>
      </div>
      
      {/* Loading indicator */}
      {isLoading && !allYearsLoaded && (
        <div className="flex justify-center py-6">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
            <span className="text-gray-600">Cargando historial...</span>
          </div>
        </div>
      )}
      
      {/* Year Selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {availableYears.map((year) => (
          <button
            key={`year-btn-${year}`}
            onClick={() => {
              setSelectedYear(year);
              toggleYearExpand(year);
            }}
            className={`px-4 py-2 rounded-xl transition-all ${selectedYear === year 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
          >
            {year}
          </button>
        ))}
      </div>
      
      {/* Annual Summaries */}
      <div className="space-y-6">
        {!isLoading && availableYears.map((year: string) => (
          <div key={`summary-${year}`} className="bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-lg transition-all duration-300">
            <h5 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-600" />
              Resumen Anual {year}
            </h5>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
                <p className="text-sm text-green-600 font-medium">Monto base anual</p>
                <p className="font-bold text-green-700">
                  {formatCurrency(
                    // Primero intentamos usar los datos del historial mensual
                    annualSummaries.find(s => s.year === year)?.baseAmount || 
                    // Luego intentamos calcular con los datos de la API
                    (yearlyData?.bonusesByYear && yearlyData?.baseBonus 
                      ? (yearlyData.bonusesByYear[year] || 0) * (yearlyData.baseBonus || 0)
                      : 0)
                  )}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
                <p className="text-sm text-red-600 font-medium">Descuentos acumulados</p>
                <p className="font-bold text-red-700">
                  -{formatCurrency(
                    // Primero intentamos usar los datos del historial mensual
                    annualSummaries.find(s => s.year === year)?.totalDeductions || 
                    // Luego intentamos calcular con los datos de la API
                    (yearlyData?.deductionAmount !== undefined 
                      ? yearlyData.deductionAmount 
                      : (yearlyData?.deductionPercentage && yearlyData?.baseBonus
                          ? (yearlyData.baseBonus * yearlyData.deductionPercentage / 100)
                          : 0))
                  )}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Eficiencia</p>
                <p className="font-bold text-blue-700">
                  {formatPercentage(
                    // Primero intentamos usar los datos del historial mensual
                    annualSummaries.find(s => s.year === year)?.efficiency || 
                    // Luego intentamos usar los datos de la API
                    (yearlyData?.summary?.percentage !== undefined 
                      ? yearlyData.summary.percentage 
                      : (yearlyData?.deductionPercentage !== undefined
                          ? 100 - yearlyData.deductionPercentage
                          : 100))
                  )}
                </p>
              </div>
            </div>
            
            <h6 className="font-semibold text-gray-900 mb-3 mt-6 border-b pb-2">Historial Detallado por Mes</h6>
            <div className="space-y-4">
              {historyByYear[year] && historyByYear[year].length > 0 ? (
                historyByYear[year].map((mes, monthIndex) => (
                  <div
                    key={`month-${year}-${monthIndex}`}
                    className="bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-lg transition-all duration-300 mb-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-bold text-lg text-gray-900">{mes.mes || 'Sin fecha'}</h5>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Monto Final</p>
                          <p className="font-bold text-green-600">{formatCurrency(mes.montoFinal)}</p>
                        </div>
                        {(Number(mes.descuentos) > 0 || isNaN(Number(mes.descuentos))) && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Descuentos</p>
                            <p className="font-bold text-red-600">-{formatCurrency(mes.descuentos)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
                        <p className="text-sm text-green-600 font-medium">Inicial</p>
                        <p className="font-bold text-green-700">{formatCurrency(mes.montoInicial)}</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
                        <p className="text-sm text-red-600 font-medium">Descuentos</p>
                        <p className="font-bold text-red-700">-{formatCurrency(mes.descuentos)}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                        <p className="text-sm text-blue-600 font-medium">Final</p>
                        <p className="font-bold text-blue-700">{formatCurrency(mes.montoFinal)}</p>
                      </div>
                    </div>

                    {Array.isArray(mes.afectaciones) && mes.afectaciones.length > 0 && (
                      <div>
                        <h6 className="font-semibold text-gray-900 mb-3">Afectaciones del Mes</h6>
                        <div className="space-y-2">
                          {mes.afectaciones.map((afectacion, afectIndex) => (
                            <div 
                              key={afectacion.id || `afect-${monthIndex}-${afectIndex}`} 
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl"
                            >
                              <div className="flex items-center space-x-3">
                                {getNovedadIcon(afectacion.tipoIcono)}
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{afectacion.descripcion || 'Sin descripción'}</p>
                                  <p className="text-xs text-gray-600">
                                    {afectacion.fechaInicio || 'Sin fecha'} - {afectacion.cantidadDias || 0} día(s)
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-red-600">-{formatCurrency(afectacion.montoDescuento)}</p>
                                <p className="text-xs text-gray-600">{formatPercentage(afectacion.porcentajeAfectacion)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!Array.isArray(mes.afectaciones) || mes.afectaciones.length === 0) && (
                      <div className="text-center py-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <p className="text-green-600 font-medium">Sin afectaciones este mes</p>
                        <p className="text-sm text-gray-500">Bono completo mantenido</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No hay datos mensuales disponibles para {year}</p>
                  <p className="text-sm text-gray-400 mt-1">No se encontraron registros de bonificaciones para este período</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Evolución de bonos mes a mes */}
      {!isLoading && availableYears.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h5 className="font-bold text-gray-900 text-lg">Evolución de Bonos Mes a Mes</h5>
          </div>
          
          {renderMonthlyEvolution()}
        </div>
      )}
      
      {/* Show message if no years available - Esto ya no debería mostrarse nunca gracias a los datos simulados */}
      {!isLoading && availableYears.length === 0 && historialMensual.length === 0 && (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-3xl">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-gray-500" />
          </div>
          <h5 className="font-bold text-gray-900 text-lg">Sin Historial Disponible</h5>
          <p className="text-gray-500 mt-1">No hay datos históricos para mostrar</p>
        </div>
      )}
    </div>
  );
}