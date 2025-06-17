import type React from "react"
import { AlertTriangle, FileText, TrendingDown } from "lucide-react"

interface ResumenEstadisticasProps {
  estadisticas: {
    totalDescargos: number
    totalIncapacidades: number
    totalSuspensiones: number
    totalDias: number
  }
}

export const ResumenEstadisticas: React.FC<ResumenEstadisticasProps> = ({ estadisticas }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-3xl border border-orange-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h5 className="font-bold text-orange-800">Descargos</h5>
            <p className="text-sm text-orange-600">Total de descargos</p>
          </div>
        </div>
        <p className="text-3xl font-bold text-orange-700">{estadisticas.totalDescargos}</p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-3xl border border-blue-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h5 className="font-bold text-blue-800">Incapacidades</h5>
            <p className="text-sm text-blue-600">Total de incapacidades</p>
          </div>
        </div>
        <p className="text-3xl font-bold text-blue-700">{estadisticas.totalIncapacidades}</p>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-3xl border border-red-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h5 className="font-bold text-red-800">Suspensiones</h5>
            <p className="text-sm text-red-600">Total de suspensiones</p>
          </div>
        </div>
        <p className="text-3xl font-bold text-red-700">{estadisticas.totalSuspensiones}</p>
      </div>
    </div>
  )
}
