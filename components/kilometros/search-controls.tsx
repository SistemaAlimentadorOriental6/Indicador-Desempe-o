"use client"

import type React from "react"
import { Search } from "lucide-react"
import type { FilterBy, SortBy, SearchType } from "@/types/km-types"

interface SearchControlsProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchType: SearchType
  setSearchType: (type: SearchType) => void
  filterBy: FilterBy
  setFilterBy: (filter: FilterBy) => void
  sortBy: SortBy
  setSortBy: (sort: SortBy) => void
  filteredData: any[]
}

export const SearchControls: React.FC<SearchControlsProps> = ({
  searchQuery,
  setSearchQuery,
  searchType,
  setSearchType,
  filterBy,
  setFilterBy,
  sortBy,
  setSortBy,
  filteredData,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0 gap-4">
        {/* Search Section */}
        <div className="flex-1 max-w-2xl">
          <div className="flex space-x-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={`Buscar por ${
                  searchType === "name" ? "nombre" : searchType === "code" ? "código" : "cédula"
                }...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-gray-25 focus:bg-white font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as SearchType)}
              className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium bg-white"
            >
              <option value="name">Nombre</option>
              <option value="code">Código</option>
              <option value="cedula">Cédula</option>
            </select>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-3">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterBy)}
            className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium bg-white"
          >
            <option value="all">Todos los Estados</option>
            <option value="excellent">Excelente (&gt;95%)</option>
            <option value="good">Bueno (85-95%)</option>
            <option value="warning">Atención (75-85%)</option>
            <option value="poor">Crítico (&lt;75%)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium bg-white"
          >
            <option value="reliability">Confiabilidad</option>
            <option value="executed">KM Ejecutados</option>
            <option value="performance">Score Rendimiento</option>
            <option value="name">Nombre A-Z</option>
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-100">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">{filteredData.length}</p>
          <p className="text-xs text-gray-500 font-medium">Resultados</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-green-600">
            {filteredData.filter((p) => p.status === "excellent").length}
          </p>
          <p className="text-xs text-gray-500 font-medium">Excelente</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-blue-600">{filteredData.filter((p) => p.status === "good").length}</p>
          <p className="text-xs text-gray-500 font-medium">Bueno</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-yellow-600">
            {filteredData.filter((p) => p.status === "warning").length}
          </p>
          <p className="text-xs text-gray-500 font-medium">Atención</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-red-600">{filteredData.filter((p) => p.status === "poor").length}</p>
          <p className="text-xs text-gray-500 font-medium">Crítico</p>
        </div>
      </div>
    </div>
  )
}
