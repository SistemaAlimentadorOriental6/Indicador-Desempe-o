"use client"

import React, { useState, useEffect, useRef } from "react"
import { Search, Grid, List, Download, Calendar, ChevronDown, SortAsc, SortDesc } from "lucide-react"

// Local types
type SortType = 'rank' | 'bonus' | 'km' | 'efficiency';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';
type TimeFilterType = 'global' | 'year' | 'month';
type TimeFilter = {
  type: TimeFilterType;
  value?: string;
};

interface SearchAndControlsProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortBy: SortType
  setSortBy: (sort: SortType) => void
  sortOrder: SortOrder
  setSortOrder: (order: SortOrder) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  timeFilter?: TimeFilterType
  timeFilterValue?: string | null
  availableYears?: number[]
  latestYear?: number | null
  latestMonth?: number | null
  onTimeFilterChange?: (filter: TimeFilter) => void
}

export default function SearchAndControls({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  timeFilter = 'global',
  timeFilterValue = null,
  availableYears = [],
  latestYear = null,
  latestMonth = null,
  onTimeFilterChange,
}: SearchAndControlsProps) {
  const [filterType, setFilterType] = useState<TimeFilterType>(timeFilter);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Initialize values with props or fallbacks
  const currentYear = latestYear || new Date().getFullYear();
  const currentMonth = latestMonth !== null ? latestMonth - 1 : new Date().getMonth();
  
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Generate available years - fixed to handle empty array properly
  const years = Array.isArray(availableYears) && availableYears.length > 0 
    ? [...availableYears].sort((a, b) => b - a) // Create copy before sorting
    : Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  
  // Month names in Spanish
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Sort options with descriptive labels
  const sortOptions = [
    { value: 'rank' as SortType, label: '🏆 Ranking' },
    { value: 'bonus' as SortType, label: '💰 Bonos' },
    { value: 'km' as SortType, label: '🚗 Kilómetros' },
    { value: 'efficiency' as SortType, label: '⚡ Eficiencia' }
  ];
  
  // Close dropdown when clicking outside
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

  // Sync local state with props
  useEffect(() => {
    setFilterType(timeFilter);
  }, [timeFilter]);

  // Parse timeFilterValue to initialize states
  useEffect(() => {
    if (timeFilterValue) {
      if (timeFilter === 'year') {
        const year = parseInt(timeFilterValue);
        if (!isNaN(year)) setSelectedYear(year);
      } else if (timeFilter === 'month') {
        const [year, month] = timeFilterValue.split('-');
        if (year && month) {
          const parsedYear = parseInt(year);
          const parsedMonth = parseInt(month) - 1;
          if (!isNaN(parsedYear) && !isNaN(parsedMonth)) {
            setSelectedYear(parsedYear);
            setSelectedMonth(parsedMonth);
          }
        }
      }
    }
  }, [timeFilterValue, timeFilter]);
  
  // Handle filter changes
  const handleFilterChange = (newFilterType: TimeFilterType, newYear?: number, newMonth?: number) => {
    setFilterType(newFilterType);
    
    if (newYear !== undefined) setSelectedYear(newYear);
    if (newMonth !== undefined) setSelectedMonth(newMonth);
    
    if (onTimeFilterChange) {
      const finalYear = newYear !== undefined ? newYear : selectedYear;
      const finalMonth = newMonth !== undefined ? newMonth : selectedMonth;
      
      if (newFilterType === 'global') {
        onTimeFilterChange({ type: 'global', value: undefined });
      } else if (newFilterType === 'year') {
        onTimeFilterChange({ type: 'year', value: String(finalYear) });
      } else if (newFilterType === 'month') {
        const monthStr = (finalMonth + 1).toString().padStart(2, '0');
        onTimeFilterChange({ 
          type: 'month', 
          value: `${finalYear}-${monthStr}` 
        });
      }
    }
  };
  
  // Get active filter display text
  const getFilterDisplayText = () => {
    switch (filterType) {
      case 'global':
        return 'Todos los datos';
      case 'year':
        return `${selectedYear}`;
      case 'month':
        return `${months[selectedMonth]?.substring(0, 3) || 'Ene'} ${selectedYear}`;
      default:
        return 'Filtrar';
    }
  };

  // Check if a month is available
  const isMonthAvailable = (year: number, monthIndex: number) => {
    if (Array.isArray(availableYears) && availableYears.length > 0 && !availableYears.includes(year)) return false;
    
    const maxYear = latestYear || new Date().getFullYear();
    const maxMonth = latestMonth !== null ? latestMonth - 1 : new Date().getMonth();
    
    if (year > maxYear) return false;
    if (year === maxYear && monthIndex > maxMonth) return false;
    
    return true;
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Exporting data...');
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        
        {/* Search and filters section */}
        <div className="flex flex-col lg:flex-row gap-4 flex-1">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, ID o ubicación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50 focus:bg-white font-medium text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Filter and sort controls */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Time filter */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 px-4 py-3.5 rounded-2xl border border-blue-200 transition-all duration-200 shadow-sm group min-w-[140px]"
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700 flex-1 text-left">
                  {getFilterDisplayText()}
                </span>
                <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Enhanced dropdown modal */}
              {showDropdown && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl border border-gray-100 w-[90%] max-w-md max-h-[80vh] overflow-y-auto z-50">
                    {/* Modal header */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-3xl">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-bold text-lg">Filtros de tiempo</span>
                      </div>
                      <button 
                        onClick={() => setShowDropdown(false)}
                        className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-all duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                    
                    {/* Global option */}
                    <button 
                      onClick={() => {
                        handleFilterChange('global');
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        filterType === 'global' 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      🌍 Todos los datos
                    </button>
                    
                    {/* Year option */}
                    <div className="space-y-2">
                      <button 
                        onClick={() => handleFilterChange('year', selectedYear)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          filterType === 'year' 
                            ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        📅 Por año
                      </button>
                      
                      {(filterType === 'year' || showDropdown) && (
                        <div className="ml-4 grid grid-cols-3 gap-2">
                          {/* Mostrar todos los años disponibles de forma estática para depuración */}
                          {[2023, 2024, 2025].map(year => (
                            <button
                              key={year}
                              onClick={() => {
                                handleFilterChange('year', year);
                                setShowDropdown(false);
                              }}
                              className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                selectedYear === year && filterType === 'year'
                                  ? 'bg-blue-500 text-white font-bold shadow-md' 
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                            >
                              {year}
                            </button>
                          ))}
                          {/* Mostrar también los años generados dinámicamente */}
                          {years && years.length > 0 && years.filter(y => ![2023, 2024, 2025].includes(y)).map(year => (
                            <button
                              key={`dynamic-${year}`}
                              onClick={() => {
                                handleFilterChange('year', year);
                                setShowDropdown(false);
                              }}
                              className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                selectedYear === year && filterType === 'year'
                                  ? 'bg-blue-500 text-white font-bold shadow-md' 
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                            >
                              {year}
                            </button>
                          ))}
                          
                        </div>
                      )}
                    </div>
                    
                    {/* Month option */}
                    <div className="space-y-2">
                      <button 
                        onClick={() => handleFilterChange('month', selectedYear, selectedMonth)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          filterType === 'month' 
                            ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        🗓️ Por mes
                      </button>
                      
                      {(filterType === 'month' || showDropdown) && (
                        <div className="space-y-3 ml-4">
                          {/* Year selector for month */}
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Año:</p>
                            <div className="grid grid-cols-3 gap-2">
                              {[2020, 2021, 2022, 2023, 2024, 2025].map(year => (
                                <button
                                  key={`month-${year}`}
                                  onClick={() => handleFilterChange('month', year, selectedMonth)}
                                  className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                    selectedYear === year && filterType === 'month'
                                      ? 'bg-blue-500 text-white font-bold shadow-md' 
                                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                  }`}
                                >
                                  {year}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Month selector */}
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Mes:</p>
                            <div className="grid grid-cols-4 gap-2">
                              {months.map((month, idx) => {
                                const available = isMonthAvailable(selectedYear, idx);
                                
                                if (!available) return null;
                                
                                return (
                                  <button
                                    key={month}
                                    onClick={() => {
                                      handleFilterChange('month', selectedYear, idx);
                                      setShowDropdown(false);
                                    }}
                                    className={`px-2 py-2 text-xs rounded-lg transition-all duration-200 ${
                                      selectedMonth === idx && filterType === 'month'
                                        ? 'bg-blue-500 text-white font-bold' 
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                                  >
                                    {month.substring(0, 3)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </>
              )}
            </div>

            {/* Sort selector */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium text-gray-900 min-w-[140px]"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="p-3.5 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all duration-200 group"
                title={sortOrder === "asc" ? "Ordenar descendente" : "Ordenar ascendente"}
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
                ) : (
                  <SortDesc className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* View controls and actions */}
        <div className="flex items-center gap-4">
          
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                viewMode === "grid" 
                  ? "bg-white shadow-sm text-blue-600 font-semibold" 
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Grid className="w-4 h-4" />
              <span className="text-sm">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                viewMode === "list" 
                  ? "bg-white shadow-sm text-blue-600 font-semibold" 
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-sm">Lista</span>
            </button>
          </div>

          {/* Export button */}
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Download className={`w-5 h-5 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Exportando...' : 'Exportar'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}