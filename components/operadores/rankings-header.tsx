"use client"

import React, { memo } from "react"
import { Trophy } from "lucide-react"

interface RankingsHeaderProps {
  titulo?: string
  subtitulo?: string
}

function RankingsHeaderBase({
  titulo = "Rankings de Operadores",
  subtitulo = "Sistema de clasificación basado en rendimiento y eficiencia"
}: RankingsHeaderProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <div className="flex items-center gap-4">
        {/* Ícono */}
        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
          <Trophy className="w-6 h-6 text-white" />
        </div>

        {/* Texto */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {titulo}
          </h2>
          <p className="text-sm text-gray-500">
            {subtitulo}
          </p>
        </div>
      </div>
    </div>
  )
}

export const RankingsHeader = memo(RankingsHeaderBase)
export default RankingsHeader
