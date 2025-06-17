import type React from "react"
import type { PersonaBono } from "@/types/bono-types"
import { useAfectacionesProcessor } from "@/hooks/use-afectaciones-processor"
import { HeaderModal } from "./header-modal"
import { TablaAfectaciones } from "./tabla-afectaciones"
import { ResumenEstadisticas } from "./resumen-estadisticas"

interface ModalDetalleProps {
  persona: PersonaBono
}

export const ModalDetalle: React.FC<ModalDetalleProps> = ({ persona }) => {
  // Imprimir datos originales para depuración
  console.log('ModalDetalle - Datos originales recibidos:', {
    id: persona.id,
    nombre: persona.nombre,
    tieneDeductions: Array.isArray(persona?.deductions) && persona.deductions?.length > 0,
    tieneData: Array.isArray(persona?.data) && persona.data?.length > 0,
    tieneAfectaciones: Array.isArray(persona?.afectaciones) && persona.afectaciones?.length > 0,
  })
  
  // Si hay deductions o data, imprimir una muestra
  if (Array.isArray(persona?.deductions) && persona.deductions?.length > 0) {
    console.log('ModalDetalle - Muestra de deductions:', JSON.stringify(persona.deductions.slice(0, 2), null, 2))
  }
  
  if (Array.isArray(persona?.data) && persona.data?.length > 0) {
    console.log('ModalDetalle - Muestra de data:', JSON.stringify(persona.data.slice(0, 2), null, 2))
  }
  
  if (Array.isArray(persona?.afectaciones) && persona.afectaciones?.length > 0) {
    console.log('ModalDetalle - Muestra de afectaciones:', JSON.stringify(persona.afectaciones.slice(0, 2), null, 2))
  }
  
  const { afectacionesProcesadas, estadisticas } = useAfectacionesProcessor(persona)

  return (
    <div className="space-y-6">
      <HeaderModal />

      <TablaAfectaciones afectaciones={afectacionesProcesadas} persona={persona} />

      {afectacionesProcesadas.length > 0 && <ResumenEstadisticas estadisticas={estadisticas} />}
    </div>
  )
}
