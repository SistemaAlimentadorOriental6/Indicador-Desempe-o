"use client"

import type React from "react"
import { X, Info, History, Table, BarChart3 } from "lucide-react"
import type { PersonaBono } from "@/types/bono-types"
import { ModalResumen } from "./modal/modal-resumen"
import { ModalHistorial } from "./modal/modal-historial"
import { ModalDetalle } from "./modal/modal-detalle"
import { ModalEstadisticas } from "./modal/modal-estadisticas"

interface BonoModalProps {
  persona: PersonaBono
  activeTab: string
  setActiveTab: (tab: string) => void
  onClose: () => void
}

export const BonoModal: React.FC<BonoModalProps> = ({ persona, activeTab, setActiveTab, onClose }) => {
  const tabs = [
    { id: "resumen", label: "Resumen General", icon: Info },
    { id: "historial", label: "Historial Mensual", icon: History },
    { id: "detalle", label: "Detalle de Afectaciones", icon: Table },
    { id: "estadisticas", label: "Estadísticas", icon: BarChart3 },
  ]

  const renderModalContent = () => {
    switch (activeTab) {
      case "resumen":
        return <ModalResumen persona={persona} />
      case "historial":
        return <ModalHistorial persona={persona} />
      case "detalle":
        return <ModalDetalle persona={persona} />
      case "estadisticas":
        return <ModalEstadisticas persona={persona} />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center text-white font-bold text-xl">
                {persona.foto}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{persona.nombre}</h3>
                <p className="text-green-100">
                  {persona.codigo} • {persona.departamento}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-2xl transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-8 px-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-2 border-b-2 font-semibold transition-colors whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? "border-green-500 text-green-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">{renderModalContent()}</div>
      </div>
    </div>
  )
}
