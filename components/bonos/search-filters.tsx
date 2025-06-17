"use client"

import type React from "react"
import { Search, Filter, Calendar, XCircle } from "lucide-react"

interface SearchFiltersProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchType: string
  setSearchType: (type: string) => void
  selectedYear: string
  setSelectedYear: (year: string) => void
  years: string[]
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  searchType,
  setSearchType,
  selectedYear,
  setSelectedYear,
  years,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="group">
        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center space-x-2">
          <Filter className="w-4 h-4 text-green-500" />
          <span>Buscar por:</span>
        </label>
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="w-full px-4 py-4 border border-green-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 bg-white/80 backdrop-blur-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-green-300"
        >
          <option value="nombre">👤 Nombre Completo</option>
          <option value="codigo">🏷️ Código Empleado</option>
          <option value="cedula">🆔 Número de Cédula</option>
        </select>
      </div>

      <div className="lg:col-span-2 group">
        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center space-x-2">
          <Search className="w-4 h-4 text-green-500" />
          <span>Término de búsqueda:</span>
        </label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
          <input
            type="text"
            placeholder={`Buscar por ${searchType}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-4 py-4 border border-green-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 bg-white/80 backdrop-blur-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-green-300"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="group">
        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-green-500" />
          <span>Año:</span>
        </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="w-full px-4 py-4 border border-green-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 bg-white/80 backdrop-blur-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-green-300"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              📅 {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
