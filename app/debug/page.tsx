"use client"

import DebugProfile from "@/components/debug-profile"
import { useSearchParams } from "next/navigation"

export default function DebugPage() {
  const searchParams = useSearchParams()
  const cedula = searchParams.get("cedula") || ""

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-6 text-green-700">Herramienta de Depuración</h1>
      <DebugProfile initialCedula={cedula} />

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
        <h2 className="text-lg font-medium text-yellow-800 mb-2">Instrucciones</h2>
        <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
          <li>Ingresa una cédula y haz clic en "Buscar" para ver los datos del perfil.</li>
          <li>Usa el botón de actualizar para forzar una nueva consulta.</li>
          <li>
            Puedes pasar una cédula directamente en la URL:{" "}
            <code className="bg-white px-1 py-0.5 rounded">/debug?cedula=71709686</code>
          </li>
          <li>Revisa la consola del navegador para ver logs detallados.</li>
        </ul>
      </div>
    </div>
  )
}
