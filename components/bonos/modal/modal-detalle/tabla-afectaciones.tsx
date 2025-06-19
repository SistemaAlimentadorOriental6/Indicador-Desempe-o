import type React from "react"
import { CheckCircle } from "lucide-react"
import type { AfectacionProcesada } from "@/types/modal-detalle.types"
import type { PersonaBono } from "@/types/bono-types"
import { formatCurrency, getNovedadIcon } from "@/utils/bono-utils"
import { formatPercentage } from "@/utils/format-utils"
import { renderIcon } from "./icon-renderer"

interface TablaAfectacionesProps {
  afectaciones: AfectacionProcesada[]
  persona: PersonaBono
}

export const TablaAfectaciones: React.FC<TablaAfectacionesProps> = ({ afectaciones, persona }) => {
  if (afectaciones.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                <th className="text-left p-4 font-bold text-sm border-r border-green-500">F. Inicio novedad</th>
                <th className="text-left p-4 font-bold text-sm border-r border-green-500">F. Fin novedad</th>
                <th className="text-center p-4 font-bold text-sm border-r border-green-500">Cantidad días</th>
                <th className="text-left p-4 font-bold text-sm border-r border-green-500">Falta</th>
                <th className="text-left p-4 font-bold text-sm border-r border-green-500">Descripción falta</th>
                <th className="text-center p-4 font-bold text-sm">% Afectación</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900 text-lg">Sin Afectaciones Registradas</h5>
                      <p className="text-gray-500 mt-1">Este empleado no tiene afectaciones en su historial</p>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <th className="text-left p-4 font-bold text-sm border-r border-green-500">F. Inicio novedad</th>
              <th className="text-left p-4 font-bold text-sm border-r border-green-500">F. Fin novedad</th>
              <th className="text-center p-4 font-bold text-sm border-r border-green-500">Cantidad días</th>
              <th className="text-left p-4 font-bold text-sm border-r border-green-500">Falta</th>
              <th className="text-left p-4 font-bold text-sm border-r border-green-500">Descripción falta</th>
              <th className="text-center p-4 font-bold text-sm">% Afectación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {afectaciones.map((afectacion, index) => (
              <tr
                key={afectacion.id}
                className={`
                  hover:bg-green-25 transition-all duration-300
                  ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                `}
              >
                <td className="p-4 border-r border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-gray-900 text-sm bg-green-50 px-2 py-1 rounded-md">
                      {afectacion.fechaInicio}
                    </span>
                  </div>
                </td>
                <td className="p-4 border-r border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-gray-900 text-sm bg-green-50 px-2 py-1 rounded-md">
                      {afectacion.fechaFin}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-center border-r border-gray-100">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 text-green-800 rounded-xl font-bold text-sm">
                    {afectacion.cantidadDias}
                  </span>
                </td>
                <td className="p-4 border-r border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                      {renderIcon(getNovedadIcon(afectacion.tipoIcono || ""))}
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900 text-sm leading-tight block">
                        {afectacion.falta}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="p-4 border-r border-gray-100">
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-sm text-gray-700 font-medium">
                      {/* Mostramos la novedad que ya contiene el concepto */}
                      {afectacion.novedad || afectacion.falta || "Sin descripción"}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  {(() => {
                    const porcentaje = afectacion.porcentajeAfectacion
                    const isDescuento = porcentaje > 0

                    return (
                      <span
                        className={`
                        inline-flex items-center px-3 py-2 rounded-xl text-sm font-bold
                        ${
                          isDescuento
                            ? "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300"
                            : "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300"
                        }
                      `}
                      >
                        {isDescuento ? "📉" : "✅"} {formatPercentage(porcentaje)}
                      </span>
                    )
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <td className="p-4 font-bold text-sm border-r border-green-500">Total</td>
              <td className="p-4 font-bold text-sm border-r border-green-500"></td>
              <td className="p-4 text-center font-bold text-sm border-r border-green-500">
                {afectaciones.reduce((sum, a) => sum + (a.cantidadDias || 0), 0)}
              </td>
              <td className="p-4 font-bold text-sm border-r border-green-500">
                {formatCurrency(persona.totalDescuentosAcumulados)}
              </td>
              <td className="p-4 font-bold text-sm border-r border-green-500">Impacto Total en Bonos</td>
              <td className="p-4 text-center font-bold text-sm">
                {formatPercentage(
                  persona.montoBase ? (persona.totalDescuentosAcumulados / persona.montoBase) * 100 : 0,
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
