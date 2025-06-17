"use client"

import type React from "react"
import { Search } from "lucide-react"

export const NoResults: React.FC = () => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Search className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">No se encontraron resultados</h3>
      <p className="text-gray-500 font-medium">Intenta ajustar los filtros o términos de búsqueda</p>
    </div>
  )
}
