import type React from "react"
import { Wallet, DollarSign, TrendingDown, PieChart, User, Star } from "lucide-react"
import type { PersonaBono } from "@/types/bono-types"
import { formatCurrency, getEficienciaColor } from "@/utils/bono-utils"

interface ModalResumenProps {
  persona: PersonaBono
}

export const ModalResumen: React.FC<ModalResumenProps> = ({ persona }) => {
  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-3xl border border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-green-800">Bono Base</h4>
              <p className="text-sm text-green-600">Monto inicial mensual</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-700">{formatCurrency(persona.montoBase)}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-3xl border border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-blue-800">Bono Actual</h4>
              <p className="text-sm text-blue-600">Después de descuentos</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-700">{formatCurrency(persona.montoActual)}</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-3xl border border-red-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-red-800">Total Descuentos</h4>
              <p className="text-sm text-red-600">Acumulado del año</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-red-700">{formatCurrency(persona.totalDescuentosAcumulados)}</p>
        </div>
      </div>

      {/* Gráfico de Progreso */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <PieChart className="w-5 h-5 text-green-500" />
          <span>Distribución del Bono</span>
        </h4>
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-8">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all duration-1000"
              style={{ width: `${(persona.montoActual / persona.montoBase) * 100}%` }}
            >
              {((persona.montoActual / persona.montoBase) * 100).toFixed(1)}% Disponible
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>$0</span>
            <span>{formatCurrency(persona.montoBase)}</span>
          </div>
        </div>
      </div>

      {/* Información Personal */}
      <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-3xl border border-gray-200">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <User className="w-5 h-5 text-green-500" />
          <span>Información del Empleado</span>
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 font-medium">Departamento</p>
            <p className="font-bold text-gray-900">{persona.departamento}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Cargo</p>
            <p className="font-bold text-gray-900">{persona.cargo}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Eficiencia</p>
            <div
              className={`inline-flex items-center space-x-1 px-3 py-1 rounded-xl text-sm font-bold border ${getEficienciaColor(persona.eficiencia)}`}
            >
              <Star className="w-4 h-4" />
              <span>{persona.eficiencia}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Última Actualización</p>
            <p className="font-bold text-gray-900">{persona.ultimaActualizacion}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
