"use client"

import type React from "react"

interface BonoHeaderProps {
  isLoading: boolean
  onRefresh: () => void
}

export const BonoHeader: React.FC<BonoHeaderProps> = ({ isLoading, onRefresh }) => {
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
                {/* Dollar Sign Icon */}
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              {/* Sparkle Badge */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.153 5.408C10.42 3.136 11.053 2 12 2c.947 0 1.58 1.136 2.847 3.408l.328.588c.36.646.54.969.82 1.182.28.213.63.292 1.33.45l.636.144c2.46.557 3.689.835 3.982 1.778.292.943-.546 1.791-2.223 3.487l-.434.439c-.476.482-.714.723-.822 1.017-.108.294-.085.618-.04 1.265l.04.581c.16 2.599.24 3.898-.549 4.417-.789.52-1.892-.065-4.098-1.254l-.538-.29c-.607-.328-.91-.492-1.243-.492-.333 0-.636.164-1.243.491l-.538.29c-2.206 1.19-3.309 1.775-4.098 1.255-.79-.52-.709-1.818-.549-4.417l.04-.581c.045-.647.068-.971-.04-1.265-.108-.294-.346-.535-.822-1.017l-.434-.439C4.869 9.564 4.021 8.716 4.314 7.773c.293-.943 1.522-1.22 3.982-1.778l.636-.144c.7-.158 1.05-.237 1.33-.45.28-.213.46-.536.82-1.182L9.153 5.408z"/>
                </svg>
              </div>
              {/* Glow Effect */}
              <div className="absolute -inset-2 bg-gradient-to-br from-emerald-400 to-green-500 rounded-3xl blur-sm opacity-30"></div>
            </div>
            
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-emerald-700 to-green-600 bg-clip-text text-transparent mb-2">
                Sistema de Bonos Inteligente
              </h1>
              <p className="text-base text-emerald-600/80 font-medium leading-relaxed">
                Gestión avanzada de compensaciones y seguimiento histórico
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-2xl shadow-emerald-500/30 hover:shadow-3xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-3">
                {/* Refresh Icon */}
                <svg className={`w-5 h-5 transition-transform duration-500 ${isLoading ? "animate-spin" : "group-hover:rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Actualizar</span>
              </div>
              
              {/* Button Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            
            {/* Export Button */}
            <button className="group relative overflow-hidden bg-white/90 backdrop-blur-sm text-emerald-700 px-6 py-3 rounded-2xl font-semibold border border-emerald-200/80 hover:border-emerald-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-300 hover:scale-[1.02] hover:bg-emerald-50/50">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/80 to-green-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-3">
                {/* Download Icon */}
                <svg className="w-5 h-5 group-hover:translate-y-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Exportar</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
