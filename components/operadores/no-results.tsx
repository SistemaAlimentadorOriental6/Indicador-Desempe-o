"use client"

import type React from "react"
import { Search, AlertCircle, Filter, Calendar, ArrowRight } from "lucide-react"

interface NoResultsProps {
  onClearFilters: () => void
  searchQuery?: string
  isFiltered?: boolean
  errorMessage?: string
  latestYear?: number | null
  latestMonth?: number | null
  onLoadLatestData?: () => void
}

export const NoResults: React.FC<NoResultsProps> = ({ 
  onClearFilters, 
  searchQuery = "", 
  isFiltered = false,
  errorMessage = "",
  latestYear = null,
  latestMonth = null,
  onLoadLatestData
}) => {
  // Verificar si el mensaje de error contiene información sobre un mes específico
  const hasMonthFilter = errorMessage?.includes("Mes");
  const hasYearFilter = errorMessage?.includes("Año");
  
  return (
    <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-soft text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        {searchQuery ? (
          <Search className="w-8 h-8 text-blue-400" />
        ) : isFiltered ? (
          <Filter className="w-8 h-8 text-amber-400" />
        ) : hasMonthFilter || hasYearFilter ? (
          <Calendar className="w-8 h-8 text-orange-400" />
        ) : (
          <AlertCircle className="w-8 h-8 text-gray-400" />
        )}
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {searchQuery 
          ? `No se encontraron resultados para "${searchQuery}"` 
          : errorMessage || "No se encontraron operadores"}
      </h3>
      
      <p className="text-gray-500 mb-6">
        {searchQuery 
          ? "Intenta con otros términos de búsqueda o revisa la ortografía" 
          : hasMonthFilter 
            ? `No hay datos disponibles para el mes seleccionado. ${latestYear && latestMonth ? `Los datos más recientes son de ${latestMonth}/${latestYear}.` : ''}` 
            : isFiltered 
              ? "Prueba con otros filtros o categorías" 
              : "No hay datos disponibles para los criterios seleccionados"}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onClearFilters}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
        >
          {searchQuery || isFiltered ? "Limpiar Filtros" : "Mostrar Todos"}  
        </button>
        
        {(hasMonthFilter || hasYearFilter) && latestYear && latestMonth && onLoadLatestData && (
          <button
            onClick={onLoadLatestData}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <span>Cargar datos de {latestMonth}/{latestYear}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
