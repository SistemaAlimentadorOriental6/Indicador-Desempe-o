"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Users, X, ChevronRight, User } from "lucide-react"
import { getCategoryIcon, getCategoryColor } from "@/utils/operator-utils"
import type { FilterType, CategoryStats, Operator } from "@/types/operator-types"

interface FilterChipsProps {
  filter: FilterType
  setFilter: (filter: FilterType) => void
  categoryStats: CategoryStats
  totalOperators: number
  operators: Operator[] // Lista completa de operadores para filtrar por categoría
}

export const FilterChips: React.FC<FilterChipsProps> = ({ filter, setFilter, categoryStats, totalOperators, operators }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const chipsRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // Función para obtener operadores por categoría
  const getOperatorsByCategory = (category: string) => {
    if (category === "all") return operators;
    return operators.filter(op => op.category === category);
  };

  // Manipular clic en categoría para mostrar/ocultar popover
  const handleCategoryClick = (e: React.MouseEvent, category: string) => {
    e.preventDefault(); // Prevenir navegación
    e.stopPropagation(); // Evitar propagación
    
    // Si ya está activo, cerrar
    if (activeCategory === category) {
      setActiveCategory(null);
      return;
    }
    
    // Actualizar categoría activa
    setActiveCategory(category);
    
    // Calcular posición del popover
    const buttonRect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    setPopoverPosition({
      top: buttonRect.bottom + scrollTop,
      left: buttonRect.left + (buttonRect.width / 2)
    });
  };

  // Cerrar popover al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && 
          chipsRef.current && !chipsRef.current.contains(event.target as Node)) {
        setActiveCategory(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 mt-6 relative" ref={chipsRef}>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setFilter("all")}
          onContextMenu={(e) => handleCategoryClick(e, "all")}
          className={`
            flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105
            ${
              filter === "all"
                ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-green"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
            }
          `}
        >
          <Users className="w-5 h-5" />
          <span>Todos</span>
          <span
            className={`
            text-sm px-3 py-1 rounded-full font-bold
            ${filter === "all" ? "bg-white/20 text-white" : "bg-white text-gray-600"}
          `}
          >
            {totalOperators}
          </span>
        </button>

        {Object.entries(categoryStats).map(([category, count]) => {
          const colors = getCategoryColor(category)
          return (
            <button
              key={category}
              onClick={() => setFilter(category as FilterType)}
              onContextMenu={(e) => handleCategoryClick(e, category)}
              className={`
                relative flex items-center space-x-2 px-4 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105
                ${
                  filter === category
                    ? `bg-gradient-to-r ${colors.bg} text-white ${colors.shadow} shadow-lg`
                    : `${colors.bgLight} ${colors.text} hover:bg-opacity-80 border ${colors.border}`
                }
              `}
            >
              <div className="flex items-center space-x-2">
                {getCategoryIcon(category)}
                <span>{category}</span>
                <span
                  className={`
                  text-sm px-2 py-1 rounded-full font-bold
                  ${filter === category ? "bg-white/20 text-white" : "bg-white text-gray-600"}
                `}
                >
                  {count}
                </span>
              </div>
              <div 
                className={`absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded ${activeCategory === category ? 'opacity-100' : 'opacity-0'} pointer-events-none transition-opacity`}
              >
                Click derecho para ver operadores
              </div>
            </button>
          )
        })}
      </div>
      
      {/* Popover con lista de operadores */}
      {activeCategory && (
        <div 
          ref={popoverRef}
          className="absolute bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 w-80 max-h-96 overflow-y-auto"
          style={{ 
            top: `${popoverPosition.top + 10}px`, 
            left: `${popoverPosition.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {activeCategory !== "all" && getCategoryIcon(activeCategory)}
              {activeCategory === "all" ? (
                <h3 className="font-bold text-gray-900">Todos los operadores</h3>
              ) : (
                <h3 className="font-bold text-gray-900">Operadores: {activeCategory}</h3>
              )}
            </div>
            <button 
              onClick={() => setActiveCategory(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="divide-y divide-gray-100">
            {getOperatorsByCategory(activeCategory).length > 0 ? (
              getOperatorsByCategory(activeCategory).map((operator) => (
                <div key={operator.id} className="py-3 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    {operator.document ? (
                      <>
                        <img 
                          src={`https://admon.sao6.com.co/web/uploads/empleados/${operator.document}.jpg`} 
                          alt={operator.name}
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const nextSibling = e.currentTarget.nextElementSibling;
                            if (nextSibling instanceof HTMLElement) {
                              nextSibling.classList.remove('hidden');
                            }
                          }}
                        />
                        <div className="hidden">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                      </>
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{operator.name}</p>
                    <p className="text-xs text-gray-500">{operator.position}</p>
                  </div>
                  <button 
                    onClick={() => setFilter(operator.category as FilterType)}
                    className="text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">No hay operadores en esta categoría</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
