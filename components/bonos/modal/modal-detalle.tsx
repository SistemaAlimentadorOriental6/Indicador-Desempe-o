import type React from "react"
import type { PersonaBono } from "@/types/bono-types"
import { useAfectacionesProcessor } from "@/hooks/use-afectaciones-processor"
import { HeaderModal } from "./modal-detalle/header-modal"
import { TablaAfectaciones } from "./modal-detalle/tabla-afectaciones"
import { ResumenEstadisticas } from "./modal-detalle/resumen-estadisticas"

interface ModalDetalleProps {
  persona: PersonaBono
}

export const ModalDetalle: React.FC<ModalDetalleProps> = ({ persona }) => {
  const { afectacionesProcesadas, estadisticas } = useAfectacionesProcessor(persona)

  return (
    <div className="space-y-6">
      <HeaderModal />

      <TablaAfectaciones afectaciones={afectacionesProcesadas} persona={persona} />

      {afectacionesProcesadas.length > 0 && <ResumenEstadisticas estadisticas={estadisticas} />}
    </div>
  )
}
