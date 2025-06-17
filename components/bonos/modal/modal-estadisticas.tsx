import type React from "react"
import { BarChart3, LineChart, AlertTriangle, FileText, TrendingDown } from "lucide-react"
import type { PersonaBono } from "@/types/bono-types"

interface ModalEstadisticasProps {
  persona: PersonaBono
}

export const ModalEstadisticas: React.FC<ModalEstadisticasProps> = ({ persona }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-xl">Estadísticas y Análisis</h4>
          <p className="text-gray-600">Métricas de rendimiento y tendencias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <h5 className="font-bold text-gray-900 mb-4">Tendencia de Bonos</h5>
          <div className="h-48 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <LineChart className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-green-600 font-medium">Gráfico de Tendencias</p>
              <p className="text-sm text-gray-500">Evolución mensual de bonos</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <h5 className="font-bold text-gray-900 mb-4">Distribución de Afectaciones</h5>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-2xl">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <span className="font-medium text-orange-800">Descargos</span>
              </div>
              <span className="font-bold text-orange-600">
                {persona.afectaciones.filter((a) => a.tipoIcono === "descargo").length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-2xl">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-blue-800">Incapacidades</span>
              </div>
              <span className="font-bold text-blue-600">
                {persona.afectaciones.filter((a) => a.tipoIcono === "incapacidad").length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-2xl">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-800">Suspensiones</span>
              </div>
              <span className="font-bold text-red-600">
                {persona.afectaciones.filter((a) => a.tipoIcono === "suspension").length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-3xl border border-green-200">
        <h5 className="font-bold text-green-800 mb-4">Resumen de Rendimiento</h5>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-700">
              {((persona.montoActual / persona.montoBase) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-green-600 font-medium">Retención de Bono</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-700">{persona.eficiencia}%</p>
            <p className="text-sm text-green-600 font-medium">Eficiencia General</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-700">{persona.afectaciones.length}</p>
            <p className="text-sm text-green-600 font-medium">Total Afectaciones</p>
          </div>
        </div>
      </div>
    </div>
  )
}
