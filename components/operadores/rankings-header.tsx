
"use client"

import React, { useState, useEffect } from "react"

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
          
          <div className="flex items-center space-x-4">
            {/* Filtro de tiempo */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl border border-emerald-200/60 hover:bg-emerald-50/80 hover:border-emerald-300/60 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100/50 group"
              >
                <div className="p-2 bg-emerald-100/80 rounded-xl group-hover:bg-emerald-200/80 transition-colors duration-300">
                  <CalendarIcon />
                </div>
                <span className="text-sm font-semibold text-emerald-700 group-hover:text-emerald-800">
                  {getFilterDisplayText()}
                </span>
                <ChevronDownIcon className={showDropdown ? 'rotate-180' : ''} />
              </button>
              
              {/* Dropdown del filtro */}
              {showDropdown && (
                <div className="absolute top-full mt-3 right-0 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-emerald-900/10 border border-emerald-100/60 z-50 p-6 animate-in slide-in-from-top-2 duration-300">
                  {/* Decorative top line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-t-2xl"></div>
                  
                  <div className="space-y-4">
                    {/* Opción Global */}
                    <button 
                      onClick={() => {
                        setFilterType('global');
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                        filterType === 'global' 
                          ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200/60 shadow-md' 
                          : 'hover:bg-emerald-50/60 hover:text-emerald-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span>Datos Globales</span>
                      </div>
                    </button>
                    
                    {/* Opción Año */}
                    <div className="space-y-2">
                      <button 
                        onClick={() => setFilterType('year')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                          filterType === 'year' 
                            ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200/60 shadow-md' 
                            : 'hover:bg-emerald-50/60 hover:text-emerald-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Filtrar por Año</span>
                        </div>
                      </button>
                      
                      {filterType === 'year' && (
                        <div className="ml-6 grid grid-cols-3 gap-2 mt-3">
                          {years.map(year => (
                            <button
                              key={year}
                              onClick={() => {
                                setSelectedYear(year);
                                setShowDropdown(false);
                              }}
                              className={`px-3 py-2 text-xs font-medium rounded-lg transition-all duration-300 ${
                                selectedYear === year 
                                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30' 
                                  : 'bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100/80 hover:shadow-md'
                              }`}
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Opción Mes */}
                    <div className="space-y-2">
                      <button 
                        onClick={() => setFilterType('month')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                          filterType === 'month' 
                            ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200/60 shadow-md' 
                            : 'hover:bg-emerald-50/60 hover:text-emerald-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          <span>Filtrar por Mes</span>
                        </div>
                      </button>
                      
                      {filterType === 'month' && (
                        <div className="space-y-3 ml-6 mt-3">
                          <div className="grid grid-cols-3 gap-2">
                            {years.slice(0, 3).map(year => (
                              <button
                                key={year}
                                onClick={() => setSelectedYear(year)}
                                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all duration-300 ${
                                  selectedYear === year 
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30' 
                                    : 'bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100/80 hover:shadow-md'
                                }`}
                              >
                                {year}
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {months.map((month, idx) => (
                              <button
                                key={month}
                                onClick={() => {
                                  setSelectedMonth(idx);
                                  setShowDropdown(false);
                                }}
                                className={`px-2 py-2 text-xs font-medium rounded-lg transition-all duration-300 ${
                                  selectedMonth === idx 
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30' 
                                    : 'bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100/80 hover:shadow-md'
                                }`}
                              >
                                {month.substring(0, 3)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Real-time indicator */}
            <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl border border-emerald-200/60 shadow-lg shadow-emerald-100/50">
              <div className="relative">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-sm font-semibold text-emerald-700">Tiempo Real</span>
            </div>
            
            {/* Refresh button */}
            <button className="p-4 text-emerald-600 hover:text-white hover:bg-gradient-to-r hover:from-emerald-500 hover:to-green-600 bg-white/80 backdrop-blur-sm border border-emerald-200/60 rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-emerald-500/30 group">
              <RefreshIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
