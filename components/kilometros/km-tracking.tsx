"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import type { ViewMode, SortBy, FilterBy, SearchType, PersonKmData } from "@/types/km-types"
import { calculateGlobalStats, filterAndSortData } from "@/utils/km-utils"
import { KmHeader } from "./km-header"
import { GlobalStatsCards } from "./global-stats-cards"
import { PerformanceHighlights } from "./performance-highlights"
import { GlobalChart } from "./global-chart"
import { SearchControls } from "./search-controls"
import { PersonCard } from "./person-card"
import { PersonDetailModal } from "./person-detail-modal"
import { NoResults } from "./no-results"
import { getAllKilometersData } from "@/services/km-service"
import { kmData as staticKmData } from "@/data/km-data"
import { Loader2, AlertTriangle } from "lucide-react"

export const KmTracking: React.FC = () => {
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("global")
  const [sortBy, setSortBy] = useState<SortBy>("reliability")
  const [filterBy, setFilterBy] = useState<FilterBy>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<SearchType>("name")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<{ message: string, details?: string } | null>(null)
  const [kmData, setKmData] = useState<PersonKmData[]>([])

  // Cargar datos de la API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getAllKilometersData()
        if (data && data.length > 0) {
          setKmData(data)
          console.log("Datos reales de kilómetros cargados correctamente:", data.length, "registros")
        } else {
          console.warn("No se encontraron datos reales de kilómetros, usando datos estáticos como respaldo")
          setKmData(staticKmData)
          setError({
            message: "Usando datos de demostración",
            details: "No se encontraron datos reales en la base de datos. Se están mostrando datos de ejemplo."
          })
        }
      } catch (err: any) {
        console.error("Error al cargar datos de kilómetros:", err)
        console.warn("Usando datos estáticos como respaldo debido al error")
        setKmData(staticKmData)
        setError({
          message: "Usando datos de demostración",
          details: `Error al conectar con la base de datos: ${err.message || "Desconocido"}. Se están mostrando datos de ejemplo.`
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate global stats
  const globalStats = useMemo(() => {
    return kmData.length > 0 ? calculateGlobalStats(kmData) : null
  }, [kmData])

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    return kmData.length > 0 ? filterAndSortData(kmData, filterBy, searchQuery, searchType, sortBy) : []
  }, [kmData, filterBy, searchQuery, searchType, sortBy])

  const selectedPersonData = selectedPerson ? kmData.find((p) => p.id === selectedPerson) : null

  // Banner de alerta para datos de demostración
  const DemoBanner = () => (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-center gap-3">
      <AlertTriangle className="text-amber-500" size={20} />
      <div>
        <p className="text-amber-700 font-medium">Usando datos de demostración</p>
        <p className="text-amber-600 text-sm">No se pudo conectar con la base de datos. Se están mostrando datos de ejemplo.</p>
      </div>
    </div>
  )

  const renderGlobalView = () => {
    if (loading) return <LoadingState />
    if (error && kmData.length === 0) return <ErrorState message={error.message} details={error.details} />
    if (!globalStats) return <NoResults />
    
    return (
      <div className="space-y-6">
        {error && kmData.length > 0 && <DemoBanner />}
        <GlobalStatsCards stats={globalStats} />
        <PerformanceHighlights stats={globalStats} />
        <GlobalChart data={kmData} />
      </div>
    )
  }

  const renderIndividualView = () => {
    if (loading) return <LoadingState />
    if (error && kmData.length === 0) return <ErrorState message={error.message} details={error.details} />

    return (
      <div className="space-y-6">
        {error && kmData.length > 0 && <DemoBanner />}
        <SearchControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchType={searchType}
          setSearchType={setSearchType}
          filterBy={filterBy}
          setFilterBy={setFilterBy}
          sortBy={sortBy}
          setSortBy={setSortBy}
          filteredData={filteredAndSortedData}
        />

        {filteredAndSortedData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAndSortedData.map((person) => (
              <PersonCard key={person.id} person={person} onViewDetails={setSelectedPerson} />
            ))}
          </div>
        ) : (
          <NoResults />
        )}
      </div>
    )
  }

  // Componente para mostrar estado de carga
  const LoadingState = () => (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
        <p className="text-gray-600">Cargando datos de kilómetros...</p>
        <p className="text-gray-500 text-sm mt-2">Conectando con la base de datos...</p>
      </div>
    </div>
  )
  
  return (
    <div className="min-h-screen overflow-y-auto space-y-8">
      <KmHeader viewMode={viewMode} setViewMode={setViewMode} />

      {viewMode === "global" ? renderGlobalView() : renderIndividualView()}

      {selectedPersonData && <PersonDetailModal person={selectedPersonData} onClose={() => setSelectedPerson(null)} />}
    </div>
  )
}
