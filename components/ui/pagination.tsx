import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage: number
  totalItems: number
  startIndex: number
  endIndex: number
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  startIndex,
  endIndex
}) => {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5]
    }

    if (currentPage >= totalPages - 2) {
      return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)
    }

    return Array.from({ length: 5 }, (_, i) => currentPage - 2 + i)
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
      {/* Información de elementos */}
      <div className="text-sm text-gray-600">
        Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
        <span className="font-medium">{Math.min(endIndex, totalItems)}</span> de{' '}
        <span className="font-medium">{totalItems}</span> elementos
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center space-x-2">
        {/* Botón Anterior */}
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400'
          }`}
  >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </button>

        {/* Números de página */}
        <div className="flex space-x-1">
          {visiblePages.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                currentPage === pageNum
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400'
              }`}
  >
              {pageNum}
            </button>
          ))}
        </div>

        {/* Botón Siguiente */}
        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400'
          }`}
  >
          Siguiente
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Información de página (solo en móvil) */}
      <div className="sm:hidden text-sm text-gray-500">
        Página {currentPage} de {totalPages}
      </div>
    </div>
  )
}
