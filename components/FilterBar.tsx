import React, { useState } from 'react';
import { Calendar, Filter, Search, Download, RefreshCw, BarChart3 } from 'lucide-react';

const FilterBar: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [searchQuery, setSearchQuery] = useState('');

  const filters = [
    { id: 'all', label: 'Todos los Usuarios', count: 2847 },
    { id: 'active', label: 'Activos', count: 1234 },
    { id: 'premium', label: 'Premium', count: 567 },
    { id: 'new', label: 'Nuevos Usuarios', count: 89 },
  ];

  const dateRanges = [
    { id: '24h', label: '24 Horas' },
    { id: '7d', label: '7 Días' },
    { id: '30d', label: '30 Días' },
    { id: '90d', label: '90 Días' },
    { id: 'custom', label: 'Rango Personalizado' },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analíticas del Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Monitorea y analiza la actividad de usuarios en tiempo real</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all duration-300">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all duration-300">
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`
              flex items-center space-x-2 px-4 py-2.5 rounded-2xl font-semibold transition-all duration-300
              ${activeFilter === filter.id
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-green'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
              }
            `}
          >
            <span className="text-sm">{filter.label}</span>
            <span className={`
              text-xs px-2 py-1 rounded-full font-bold
              ${activeFilter === filter.id
                ? 'bg-white/20 text-white'
                : 'bg-white text-gray-600'
              }
            `}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0 gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar usuarios, rankings o actividades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-gray-25 focus:bg-white font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          {/* Date Range */}
          <div className="flex items-center space-x-2 bg-gray-25 rounded-2xl p-1 border border-gray-200">
            <Calendar className="w-5 h-5 text-gray-400 ml-3" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 bg-transparent border-none focus:outline-none text-sm font-semibold text-gray-700"
            >
              {dateRanges.map((range) => (
                <option key={range.id} value={range.id}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Advanced Filter */}
          <button className="flex items-center space-x-2 px-4 py-2.5 bg-gray-25 hover:bg-gray-50 text-gray-700 rounded-2xl transition-all duration-300 border border-gray-200 font-semibold">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filtros</span>
          </button>

          {/* Export Button */}
          <button className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-green hover:shadow-green-lg font-semibold">
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">2847</p>
          <p className="text-sm text-gray-500 font-medium">Total Usuarios</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary-600">1234</p>
          <p className="text-sm text-gray-500 font-medium">Activos Ahora</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary-600">45.2K</p>
          <p className="text-sm text-gray-500 font-medium">Distancia Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary-600">3429</p>
          <p className="text-sm text-gray-500 font-medium">Bonos Otorgados</p>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;