"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Users } from "lucide-react"
import type { PersonaBono } from "@/types/bono-types"
import { BonoHeader } from "@/components/bonos/bono-header"
import { SearchFilters } from "@/components/bonos/search-filters"
import { PersonaCard } from "@/components/bonos/persona-card"
import { BonoModal } from "@/components/bonos/bono-modal"
import { EstadisticasGenerales } from "@/components/bonos/estadisticas-generales"
import { formatCurrency } from "@/utils/bono-utils"

const Bonos: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState("nombre")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedPerson, setSelectedPerson] = useState<PersonaBono | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState("resumen")
  const [isLoading, setIsLoading] = useState(true)
  const [animateCards, setAnimateCards] = useState(false)
  const [personas, setPersonas] = useState<PersonaBono[]>([])
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // Fetch users data from the API with pagination
  const fetchUsers = async (page = 1, loadMore = false) => {
    if (!loadMore) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      // Use server-side pagination
      const response = await fetch(`/api/admin/users?page=${page}&pageSize=${pageSize}`)
      if (!response.ok) {
        throw new Error('Error fetching users')
      }
      const data = await response.json()

      // Use pagination metadata from the server
      setTotalPages(data.pagination.totalPages)
      
      // Get users directly from the response - la estructura ha cambiado a data.data
      const paginatedUsers = data.data || []
      console.log('Usuarios obtenidos:', paginatedUsers);
      
      // Batch fetch bonus data for all users on this page using the batch API
      const userCodes = paginatedUsers.map((user: any) => user.codigo)
      
      // Use the batch API endpoint to get all bonus data in a single request
      const batchResponse = await fetch('/api/user/bonuses/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigos: userCodes,
          year: selectedYear
        })
      })
      
      if (!batchResponse.ok) {
        throw new Error('Error fetching batch bonus data')
      }
      
      const batchData = await batchResponse.json()
      
      // Create a map for quick lookup
      const bonusDataMap = new Map()
      if (batchData.success && batchData.results) {
        Object.entries(batchData.results).forEach(([codigo, data]) => {
          bonusDataMap.set(codigo, data)
        })
      }
      
      // For compatibility with the rest of the code, create a bonusResults array
      const bonusResults = Array.from(bonusDataMap.entries()).map(([codigo, data]) => ({ codigo, data }))
      
      // Transform the API data to match the PersonaBono type
      const transformedData: PersonaBono[] = paginatedUsers.map((user: any) => {
        const bonusData = bonusDataMap.get(user.codigo) || {}
        
        // Ensure all monetary values are valid numbers
        const baseBonus = typeof bonusData.baseBonus === 'number' && !isNaN(bonusData.baseBonus) 
          ? bonusData.baseBonus 
          : 142000
        
        const finalBonus = typeof bonusData.finalBonus === 'number' && !isNaN(bonusData.finalBonus) 
          ? bonusData.finalBonus 
          : baseBonus
        
        const deductionAmount = typeof bonusData.deductionAmount === 'number' && !isNaN(bonusData.deductionAmount) 
          ? bonusData.deductionAmount 
          : 0
          
        // Extraer datos del último mes si están disponibles
        // Imprimir los datos para depurar
        console.log(`Datos de bonos para ${user.codigo}:`, bonusData);
        
        // Obtener los datos del último mes directamente de la respuesta de la API
        const lastMonthData = bonusData.lastMonthData || {};
        
        // Simular datos de descuentos para cada usuario
        // Esto es temporal hasta que el endpoint batch proporcione datos reales
        // Generar un valor aleatorio entre 0 y 30000 para los descuentos
        // Usar el código del usuario para generar un valor consistente
        const userCode = parseInt(user.codigo.replace(/\D/g, '') || '0', 10);
        const seed = userCode % 100000; // Usar los últimos 5 dígitos como semilla
        
        // Generar un valor de descuento basado en la semilla
        // Esto asegura que cada usuario tenga un valor consistente pero diferente
        const simulatedDeduction = seed % 3 === 0 ? 0 : Math.floor((seed % 30000) / 100) * 100;
        
        // Asegurarse de que haya datos de deducción para el último mes
        const lastMonthDeduction = typeof lastMonthData.deductionAmount === 'number' && !isNaN(lastMonthData.deductionAmount)
          ? lastMonthData.deductionAmount
          : simulatedDeduction; // Usar el valor simulado si no hay datos reales
        
        // Calcular el valor final del bono para el último mes
        const lastMonthFinalValue = typeof lastMonthData.finalValue === 'number' && !isNaN(lastMonthData.finalValue)
          ? lastMonthData.finalValue
          : baseBonus - lastMonthDeduction;
        
        return {
          id: user.codigo || '',
          codigo: user.codigo || '',
          nombre: user.nombre || 'Sin nombre',
          cedula: user.cedula || 'Sin cédula',
          montoBase: baseBonus,
          montoActual: finalBonus,
          totalDescuentosAcumulados: deductionAmount,
          ultimaActualizacion: new Date().toISOString().split('T')[0],
          departamento: user.rol || 'No especificado',
          cargo: user.rol || 'No especificado',
          eficiencia: (bonusData.summary?.percentage && !isNaN(bonusData.summary?.percentage)) ? bonusData.summary.percentage : 100,
          foto: user.nombre ? user.nombre.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'US',
          // Incluir los datos del último mes
          lastMonthData: {
            finalValue: lastMonthFinalValue,
            deductionAmount: lastMonthDeduction,
            bonusValue: baseBonus,
            year: lastMonthData.year || new Date().getFullYear(),
            month: lastMonthData.month || new Date().getMonth() + 1,
            monthName: lastMonthData.monthName || ''
          },
          historialMensual: Array.isArray(bonusData.availableMonths) ? bonusData.availableMonths.map((month: any) => {
            // Validate all monetary values
            const initialAmount = typeof month.initialAmount === 'number' && !isNaN(month.initialAmount) 
              ? month.initialAmount 
              : baseBonus;
              
            const deductionAmount = typeof month.deductionAmount === 'number' && !isNaN(month.deductionAmount) 
              ? month.deductionAmount 
              : 0;
              
            const finalAmount = typeof month.finalAmount === 'number' && !isNaN(month.finalAmount) 
              ? month.finalAmount 
              : initialAmount - deductionAmount;
            
            return {
              mes: month.monthName + ' ' + month.year,
              montoInicial: initialAmount,
              descuentos: deductionAmount,
              montoFinal: finalAmount,
              afectaciones: Array.isArray(month.deductions) ? month.deductions.map((deduction: any) => {
                // Validate percentage and amount
                const amount = typeof deduction.amount === 'number' && !isNaN(deduction.amount) 
                  ? deduction.amount 
                  : 0;
                  
                const percentage = typeof deduction.percentage === 'number' && !isNaN(deduction.percentage) 
                  ? deduction.percentage 
                  : 0;
                  
                return {
                  id: deduction.id || `deduction-${Math.random().toString(36).substr(2, 9)}`,
                  descripcion: deduction.description || 'Sin descripción',
                  fechaInicio: deduction.startDate || 'Sin fecha',
                  fechaFin: deduction.endDate || 'Sin fecha',
                  cantidadDias: typeof deduction.days === 'number' ? deduction.days : 0,
                  montoDescuento: amount,
                  porcentajeAfectacion: percentage,
                  tipoIcono: getTipoIcono(deduction.factorCode || '')
                };
              }) : []
            };
          }) : [],
          // Pasar los datos originales de deductions para que sean procesados por useAfectacionesProcessor
          deductions: Array.isArray(bonusData.deductions) ? bonusData.deductions : [],
          // Inicializar afectaciones como array vacío para que useAfectacionesProcessor use deductions
          afectaciones: []
        }
      })
      
      // Update state based on whether we're loading more or replacing
      if (loadMore) {
        setPersonas(prev => [...prev, ...transformedData])
      } else {
        setPersonas(transformedData)
      }
      
      // Update current page
      setCurrentPage(page)
      
      // Get available years from the bonus data
      if (bonusResults.length > 0) {
        // Use the first result that has availableYears
        const yearsData = bonusResults.find(r => r.data.availableYears)?.data.availableYears || []
        if (yearsData.length > 0) {
          setAvailableYears(yearsData.map(String))
        } else {
          setAvailableYears([new Date().getFullYear().toString()])
        }
      }
      
      setError(null)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Error al cargar los datos. Por favor intente nuevamente.')
      if (!loadMore) {
        setPersonas([])
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
      setAnimateCards(true)
    }
  }
  
  // Load more data when user scrolls or clicks load more
  const loadMoreData = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      fetchUsers(currentPage + 1, true)
    }
  }

  // Helper function to determine icon type based on factor code
  const getTipoIcono = (codigoFactor: string): string => {
    if (!codigoFactor) return "descargo";
    
    if (codigoFactor.includes("INCAP")) {
      return "incapacidad"
    } else if (codigoFactor.includes("SUSP")) {
      return "suspension"
    } else {
      return "descargo"
    }
  }

  const getMonthName = (monthIndex: number): string => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return months[monthIndex]
  }

  useEffect(() => {
    setCurrentPage(1)
    fetchUsers(1, false)
  }, [selectedYear])

  const filteredPersonas = personas.filter((persona) => {
    const query = searchQuery.toLowerCase()
    switch (searchType) {
      case "codigo":
        return persona.codigo.toLowerCase().includes(query)
      case "cedula":
        return persona.cedula.includes(query)
      case "nombre":
      default:
        return persona.nombre.toLowerCase().includes(query)
    }
  })

  const handlePersonClick = (persona: PersonaBono) => {
    setSelectedPerson(persona)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedPerson(null)
    setActiveTab("resumen")
  }

  const handleSearch = () => {
    // Reset pagination and fetch first page when searching
    setCurrentPage(1)
    fetchUsers(1, false)
  }
  
  // loadMoreData function is already defined above
  
  return (
    <div className="space-y-8 relative">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-100/20 to-green-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-100/20 to-green-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <BonoHeader isLoading={isLoading} onRefresh={handleSearch} />

      {/* Search and Filters */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-green-100 shadow-2xl">
        <SearchFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchType={searchType}
          setSearchType={setSearchType}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          years={availableYears.length > 0 ? availableYears : [new Date().getFullYear().toString()]}
        />
      </div>

      {/* Results Grid */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-green-100 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Personal Activo</h3>
              <p className="text-gray-600 font-medium">Gestión de bonos y compensaciones</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500 font-medium bg-green-100 px-3 py-2 rounded-xl">
              {filteredPersonas.length} resultado(s)
            </span>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        ) : filteredPersonas.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPersonas.map((persona, index) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  index={index}
                  animateCards={animateCards}
                  onClick={handlePersonClick}
                />
              ))}
            </div>
            
            {/* Pagination Controls */}
            <div className="mt-8 flex flex-col items-center justify-center space-y-6">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-sm text-gray-500">
                  Mostrando {personas.length} de {pageSize * totalPages} resultados
                </span>
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => fetchUsers(Math.max(1, currentPage - 1), false)}
                    disabled={currentPage === 1 || isLoading}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página anterior"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchUsers(pageNum, false)}
                        disabled={isLoading}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          currentPage === pageNum 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => fetchUsers(Math.min(totalPages, currentPage + 1), false)}
                    disabled={currentPage === totalPages || isLoading}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página siguiente"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
              
              {currentPage < totalPages && (
                <button 
                  onClick={loadMoreData}
                  disabled={isLoadingMore}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Cargando...
                    </>
                  ) : (
                    'Cargar más resultados'
                  )}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron resultados para su búsqueda.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedPerson && (
        <BonoModal persona={selectedPerson} activeTab={activeTab} setActiveTab={setActiveTab} onClose={closeModal} />
      )}

      {/* Estadísticas Generales */}
      <EstadisticasGenerales personas={personas} animateCards={animateCards} />
    </div>
  )
}

export default Bonos
