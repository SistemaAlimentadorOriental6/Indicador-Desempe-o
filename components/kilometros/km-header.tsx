
"use client"

import type React from "react"
import type { ViewMode } from "@/types/km-types"

interface KmHeaderProps {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

export const KmHeader: React.FC<KmHeaderProps> = ({ viewMode, setViewMode }) => {
  return (
    <div className="bg-white/98 backdrop-blur-xl rounded-3xl p-8 border border-emerald-100/60 shadow-2xl shadow-emerald-900/5 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white to-green-50/30"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-100/30 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-green-100/20 to-transparent rounded-full translate-y-32 -translate-x-32"></div>
      
      {/* Top Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {/* Enhanced Icon Container */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 transform hover:scale-105 transition-transform duration-300">
                {/* Map Pin Icon */}
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              {/* Glow Effect */}
              <div className="absolute -inset-2 bg-gradient-to-br from-emerald-400 to-green-500 rounded-3xl blur-sm opacity-30"></div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-emerald-700 to-green-600 bg-clip-text text-transparent mb-2">
                Seguimiento de Kilómetros
              </h2>
              <p className="text-base text-emerald-600/80 font-medium leading-relaxed">
                Análisis detallado de programado vs ejecutado con métricas de confiabilidad y rendimiento
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Refresh Button */}
            <button className="group p-4 text-emerald-600/70 hover:text-emerald-700 hover:bg-emerald-50 rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-lg border border-emerald-100/50">
              <svg className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            {/* Export Button */}
            <button className="group flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white rounded-2xl hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 transition-all duration-300 shadow-2xl shadow-emerald-500/30 font-semibold text-sm hover:scale-[1.02] hover:shadow-3xl hover:shadow-emerald-500/40">
              {/* Download Icon */}
              <svg className="w-5 h-5 group-hover:translate-y-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Exportar Datos</span>
              
              {/* Button Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>

        {/* Enhanced View Toggle */}
        <div className="flex space-x-3 p-2 bg-gradient-to-r from-emerald-50/80 via-white/90 to-green-50/80 rounded-2xl border border-emerald-100/60 backdrop-blur-sm">
          <button
            onClick={() => setViewMode("global")}
            className={`
              flex-1 py-4 px-6 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 relative overflow-hidden group
              ${viewMode === "global" 
                ? "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white shadow-2xl shadow-emerald-500/30 transform scale-[1.02]" 
                : "text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50/80 hover:shadow-lg hover:shadow-emerald-100/50"
              }
            `}
          >
            {/* Background Pattern for Active State */}
            {viewMode === "global" && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl"></div>
            )}
            
            {/* Bar Chart Icon */}
            <div className={`
              relative z-10 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300
              ${viewMode === "global" 
                ? "bg-white/20 backdrop-blur-sm shadow-lg" 
                : "bg-white group-hover:bg-emerald-100 group-hover:shadow-md border border-emerald-100/50"
              }
            `}>
              <svg className={`w-4 h-4 transition-colors duration-300 ${viewMode === "global" ? "text-white" : "text-emerald-600 group-hover:text-emerald-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            
            <span className="relative z-10">Vista Global</span>
            
            {/* Active Indicator */}
            {viewMode === "global" && (
              <div className="ml-auto relative z-10">
                <div className="w-2 h-2 bg-white rounded-full shadow-lg animate-pulse"></div>
              </div>
            )}
            
            {/* Hover Effect Background */}
            {viewMode !== "global" && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
          </button>
          
          <button
            onClick={() => setViewMode("individual")}
            className={`
              flex-1 py-4 px-6 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 relative overflow-hidden group
              ${viewMode === "individual" 
                ? "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white shadow-2xl shadow-emerald-500/30 transform scale-[1.02]" 
                : "text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50/80 hover:shadow-lg hover:shadow-emerald-100/50"
              }
            `}
          >
            {/* Background Pattern for Active State */}
            {viewMode === "individual" && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl"></div>
            )}
            
            {/* Users Icon */}
            <div className={`
              relative z-10 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300
              ${viewMode === "individual" 
                ? "bg-white/20 backdrop-blur-sm shadow-lg" 
                : "bg-white group-hover:bg-emerald-100 group-hover:shadow-md border border-emerald-100/50"
              }
            `}>
              <svg className={`w-4 h-4 transition-colors duration-300 ${viewMode === "individual" ? "text-white" : "text-emerald-600 group-hover:text-emerald-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            
            <span className="relative z-10">Vista Individual</span>
            
            {/* Active Indicator */}
            {viewMode === "individual" && (
              <div className="ml-auto relative z-10">
                <div className="w-2 h-2 bg-white rounded-full shadow-lg animate-pulse"></div>
              </div>
            )}
            
            {/* Hover Effect Background */}
            {viewMode !== "individual" && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}