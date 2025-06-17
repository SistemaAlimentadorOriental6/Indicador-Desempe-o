"use client"

import type React from "react"
import { Search } from "lucide-react"

interface NoResultsProps {
  onClearFilters: () => void
}

export const NoResults: React.FC<NoResultsProps> = ({ onClearFilters }) => {
  return (
    <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-soft text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Search className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron usuarios</h3>
      <p className="text-gray-500 mb-6">Intenta ajustar los filtros o términos de búsqueda</p>
      <button
        onClick={onClearFilters}
        className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 font-semibold"
      >
        Limpiar Filtros
      </button>
    </div>
  )
}
