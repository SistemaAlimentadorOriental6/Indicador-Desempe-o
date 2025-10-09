
"use client"

import React, { useState, useEffect } from "react"
import { formatNumber, formatPercentage } from "@/utils/format-utils"

type FilterOption = 'global' | 'year' | 'month';
type FilterProps = {
  onFilterChange?: (filter: { type: FilterOption, value?: string | number }) => void;
};

export const RankingsHeader: React.FC<FilterProps> = ({ onFilterChange }) => {
  const [filterType, setFilterType] = useState<FilterOption>('global');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  // Cerrar el dropdown cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Generar años para el filtro (año actual y 5 años anteriores)
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  
  // Nombres de los meses en español
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  // ... keep existing code (useEffect for onFilterChange and getFilterDisplayText function)
  useEffect(() => {
    if (onFilterChange) {
      if (filterType === 'global') {
        onFilterChange({ type: 'global' });
      } else if (filterType === 'year') {
        onFilterChange({ type: 'year', value: selectedYear });
      } else if (filterType === 'month') {
        onFilterChange({ 
          type: 'month', 
          value: `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}` 
        });
      }
    }
  }, [filterType, selectedYear, selectedMonth, onFilterChange]);
  
  const getFilterDisplayText = () => {
    switch (filterType) {
      case 'global':
        return 'Datos Globales';
      case 'year':
        return `Año ${selectedYear}`;
      case 'month':
        return `${months[selectedMonth]} ${selectedYear}`;
      default:
        return 'Seleccionar Filtro';
    }
  };

  // Custom SVG Icons
  const CalendarIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const ChevronDownIcon = ({ className }: { className?: string }) => (
    <svg className={`w-4 h-4 transition-transform duration-300 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  const RefreshIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );

  return (
    <div className="bg-white/98 backdrop-blur-xl rounded-3xl p-8 border border-emerald-100/60 shadow-2xl shadow-emerald-900/5 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-green-50/20 to-emerald-100/30"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-400/10 via-green-500/5 to-emerald-600/10 rounded-full -translate-y-48 translate-x-48 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-green-300/5 to-emerald-400/10 rounded-full translate-y-32 -translate-x-32 blur-2xl"></div>
      
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              {/* Trophy Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30 relative">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                {/* Glow Effect */}
                <div className="absolute -inset-2 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl blur opacity-20"></div>
              </div>
              
              <div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-emerald-700 to-green-600 bg-clip-text text-transparent mb-2">
                  Rankings de Operadores
                </h2>
                <p className="text-lg text-emerald-600/80 font-medium">
                  Sistema de clasificación integral basado en rendimiento y eficiencia
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
