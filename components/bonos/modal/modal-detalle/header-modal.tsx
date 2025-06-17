import type React from "react"
import { Table, Download } from "lucide-react"

export const HeaderModal: React.FC = () => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
          <Table className="w-6 h-6 text-white" />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-xl">Detalle de Afectaciones</h4>
          <p className="text-gray-600">Registro completo de todas las novedades</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <button className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-2xl font-semibold hover:bg-green-600 transition-colors">
          <Download className="w-4 h-4" />
          <span>Exportar</span>
        </button>
      </div>
    </div>
  )
}
