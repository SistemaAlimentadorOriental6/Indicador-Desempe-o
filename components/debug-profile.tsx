"use client"

import { useProfileData } from "@/hooks/use-profile-data"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Search } from "lucide-react"

export default function DebugProfile({ initialCedula }: { initialCedula?: string }) {
  const [cedula, setCedula] = useState(initialCedula || "")
  const [activeCedula, setActiveCedula] = useState(initialCedula || "")
  const { profileData, isLoading, error } = useProfileData(activeCedula)

  const handleSearch = () => {
    setActiveCedula(cedula)
  }

  const handleRefresh = () => {
    // Forzar una nueva búsqueda con la misma cédula
    setActiveCedula("")
    setTimeout(() => setActiveCedula(cedula), 100)
  }

  return (
    <Card className="w-full max-w-md mx-auto my-4 shadow-lg border border-green-100">
      <CardHeader className="bg-green-50 border-b border-green-100">
        <CardTitle className="text-green-700 text-lg">Depurador de Perfil</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ingrese cédula"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSearch} className="bg-green-600 hover:bg-green-700">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
          <Button onClick={handleRefresh} variant="outline" className="border-green-200">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {activeCedula && (
          <div className="space-y-3">
            <div className="text-sm font-medium">
              Cédula activa: <span className="text-green-600">{activeCedula}</span>
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Cargando datos...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">{error}</div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Datos del perfil:</h3>
                  <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                    {JSON.stringify(profileData, null, 2)}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Zona</div>
                    <div className="font-medium">{profileData?.zona || "No disponible"}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">Cargo</div>
                    <div className="font-medium">{profileData?.cargo || "No disponible"}</div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  Última actualización: {new Date().toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
