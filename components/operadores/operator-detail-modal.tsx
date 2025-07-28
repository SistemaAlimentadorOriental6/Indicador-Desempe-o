"use client"

import type React from "react"
import { useState, useMemo, useCallback, useEffect } from "react"
import {
  X,
  DollarSign,
  MapPin,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Minus,
  CheckCircle,
  AlertTriangle,
  Route,
  Crown,
  Shield,
  KeyRound,
  Activity,
  Calendar,
  CalendarCheck,
  CalendarX,
  Cake,
  Fingerprint,
  Briefcase,
} from "lucide-react"
import type { Operator } from "@/types/operator-types"
import KmDetailsTab from "./km-details-tab"
import BonusDetailsTab from "./bonus-details-tab"
import Image from "next/image"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "up":
      return <TrendingUp className="w-4 h-4 text-emerald-600" />
    case "down":
      return <TrendingDown className="w-4 h-4 text-red-500" />
    default:
      return <Minus className="w-4 h-4 text-slate-500" />
  }
}

const getPerformanceLevel = (percentage: number) => {
  if (percentage >= 95)
    return {
      level: "Excelente",
      icon: CheckCircle,
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-200",
      gradientFrom: "from-emerald-500",
      gradientTo: "to-emerald-600",
    }
  if (percentage >= 85)
    return {
      level: "Bueno",
      icon: CheckCircle,
      bgColor: "bg-teal-50",
      textColor: "text-teal-700",
      borderColor: "border-teal-200",
      gradientFrom: "from-teal-500",
      gradientTo: "to-teal-600",
    }
  if (percentage >= 70)
    return {
      level: "Regular",
      icon: AlertTriangle,
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-200",
      gradientFrom: "from-yellow-500",
      gradientTo: "to-yellow-600",
    }
  return {
    level: "Necesita Mejora",
    icon: AlertTriangle,
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    gradientFrom: "from-red-500",
    gradientTo: "to-red-600",
  }
}

const calculateAge = (birthDate: string | null | undefined): string => {
  if (!birthDate) return "No disponible"
  try {
    const today = new Date();
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return "Fecha inválida";

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
      months -= 1;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
    if (days > 0) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);

    return parts.join(', ') || 'Recién nacido';
  } catch (e) {
    return "Error calculando";
  }
}

const calculateTenure = (joinDate: string | null | undefined): string => {
  if (!joinDate) return "No disponible"
  try {
    const today = new Date();
    const start = new Date(joinDate);
    if (isNaN(start.getTime())) return "Fecha inválida";

    if (start > today) return "Fecha futura";

    let years = today.getFullYear() - start.getFullYear();
    let months = today.getMonth() - start.getMonth();
    let days = today.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
    if (days > 0) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);

    return parts.join(', ') || 'Hoy';
  } catch (e) {
    return "Error calculando";
  }
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "No disponible"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Fecha inválida"
    return new Intl.DateTimeFormat("es-CO", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date)
  } catch (error) {
    return "Fecha inválida"
  }
}

interface OperatorDetailModalProps {
  operator: Operator
  onClose: () => void
}

export const EnhancedOperatorDetailModal: React.FC<OperatorDetailModalProps> = ({ operator, onClose }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "kilometers" | "bonuses">("overview")
  const [imageError, setImageError] = useState(false)

  const [currentOperator, setCurrentOperator] = useState<Operator>(operator)
  const [isLoading, setIsLoading] = useState(false)

  const [globalEfficiency, setGlobalEfficiency] = useState<number | null>(null);
  const [isGlobalEfficiencyLoading, setIsGlobalEfficiencyLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState<number>()
  const [selectedMonth, setSelectedMonth] = useState<number>()
  const [availableDates, setAvailableDates] = useState<{ years: number[]; months: { [year: number]: number[] } }>({ years: [], months: {} });
  const [areDatesLoading, setAreDatesLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (!operator.codigo) return;
      setAreDatesLoading(true);
      try {
        const response = await fetch(`/api/user/available-dates?userCode=${operator.codigo}`);
        const result = await response.json();

        if (result.success && result.data) {
          const { years, months } = result.data;
          setAvailableDates({ years, months });

          if (years.length > 0) {
            const latestYear = years[0]; // Already sorted descending
            setSelectedYear(latestYear);
            if (months[latestYear] && months[latestYear].length > 0) {
              const latestMonth = months[latestYear][0]; // Already sorted descending
              setSelectedMonth(latestMonth);
            }
          }
        }
      } catch (error) {
        console.error("Falló al obtener fechas disponibles:", error);
        const fallbackYear = new Date().getFullYear();
        const fallbackMonth = new Date().getMonth() + 1;
        setSelectedYear(fallbackYear);
        setSelectedMonth(fallbackMonth);
        setAvailableDates({ years: [fallbackYear], months: { [fallbackYear]: [fallbackMonth] } });
      } finally {
        setAreDatesLoading(false);
      }
    };

    fetchAvailableDates();
  }, [operator.codigo]);

  useEffect(() => {
    const fetchGlobalEfficiency = async () => {
      if (!operator.codigo || !selectedYear) return;
      setIsGlobalEfficiencyLoading(true);
      try {
        const response = await fetch(`/api/user/global-efficiency?userCode=${operator.codigo}&year=${selectedYear}`);
        const result = await response.json();
        if (result.success) {
          setGlobalEfficiency(result.data.efficiency);
        } else {
          console.error("Error fetching global efficiency from API:", result.message);
          setGlobalEfficiency(0);
        }
      } catch (error) {
        console.error("Falló al obtener eficiencia global:", error);
        setGlobalEfficiency(0);
      } finally {
        setIsGlobalEfficiencyLoading(false);
      }
    };

    fetchGlobalEfficiency();
  }, [operator.codigo, selectedYear]);

  useEffect(() => {
    const fetchData = async () => {
      if (!operator.codigo || !selectedYear || !selectedMonth) return

      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/user/rankings?filterType=month&filterValue=${selectedYear}-${String(
            selectedMonth,
          ).padStart(2, "0")}&userCode=${operator.codigo}`,
        )
        if (!response.ok) throw new Error("La respuesta de la red no fue correcta")

        const result = await response.json()

        if (result.success && result.data && result.data.length > 0) {
          setCurrentOperator(result.data[0])
        } else {
          console.warn(`No se encontraron datos para ${selectedYear}-${selectedMonth}`)
          setCurrentOperator({
            ...operator,
            bonus: {
              percentage: 0,
              total: 0,
              category: "Taller Conciencia",
              trend: "stable",
              date: null,
            },
            km: {
              percentage: 0,
              total_ejecutado: 0,
              total_programado: 0,
              category: "Taller Conciencia",
              trend: "stable",
              date: null,
            },
            efficiency: 0,
            weeklyPerformance: [],
            consistency: 0,
          })
        }
      } catch (error) {
        console.error("Falló al obtener los datos actualizados del operador:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (activeTab === "overview") {
      fetchData()
    }
  }, [selectedYear, selectedMonth, operator.codigo, activeTab])

  useEffect(() => {
    // Si el año seleccionado es el año actual, asegurarse de que el mes seleccionado no sea futuro
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1;
    if (selectedYear === currentYear && selectedMonth && selectedMonth > currentMonth) {
      if (availableDates.months[currentYear] && availableDates.months[currentYear].includes(currentMonth)) {
        setSelectedMonth(currentMonth);
      } else if (availableDates.months[currentYear]?.length > 0) {
        setSelectedMonth(availableDates.months[currentYear][0]); // Latest available in current year
      }
    }
  }, [selectedYear, selectedMonth, availableDates]);

  useEffect(() => {
    console.log("Información del operador:", {
      nombre: operator.name, // Usar `operator` para datos estáticos
      cedula: operator.cedula,
      id: operator.id,
      avatar: operator.avatar,
      operadorCompleto: currentOperator, // Usar `currentOperator` para datos dinámicos
    })
  }, [operator, currentOperator])

  const performanceLevel = useMemo(
    () => getPerformanceLevel(currentOperator.efficiency),
    [currentOperator.efficiency],
  )

  const globalPerformanceLevel = useMemo(() => {
    if (globalEfficiency === null) {
      return getPerformanceLevel(0); // Default for loading or error
    }
    return getPerformanceLevel(globalEfficiency);
  }, [globalEfficiency]);

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount)

  const initials = useMemo(() => {
    if (operator.avatar && operator.avatar.trim() !== "") {
      return operator.avatar
    }
    if (operator.name) {
      const nameParts = operator.name.split(" ")
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase()
      }
      return operator.name.substring(0, 2).toUpperCase()
    }
    return "OP"
  }, [operator.avatar, operator.name])

  const bonusTotal = currentOperator.bonus?.total ?? 0
  const bonusPercentage = currentOperator.bonus?.percentage ?? 0
  const bonusPercentClamped = Math.min(bonusPercentage, 100)
  const bonusTotalText = formatCurrency(bonusTotal)
  const bonusObjectiveText = `${bonusPercentage.toFixed(1)}% del objetivo`

  const bonusDeductions: Array<{ reason: string; observation?: string; start?: string; end?: string }> =
    (currentOperator as any).bonus?.deductions || []

  const executedKm = currentOperator.km?.total_ejecutado ?? currentOperator.km?.total ?? 0
  const programmedKm = currentOperator.km?.total_programado ?? currentOperator.km?.total ?? 0
  const kmDiff = executedKm - programmedKm
  const kmDiffText = `${kmDiff >= 0 ? "+" : ""}${kmDiff.toLocaleString("es-CO")}`
  const kmEfficiency = programmedKm > 0 ? (executedKm / programmedKm) * 100 : 0
  const kmEfficiencyClamped = Math.min(kmEfficiency, 100)

  const consistency =
    currentOperator.consistency ??
    (currentOperator.weeklyPerformance && currentOperator.weeklyPerformance.length > 0
      ? 100 - (Math.max(...currentOperator.weeklyPerformance) - Math.min(...currentOperator.weeklyPerformance))
      : 0)
  const consistencyText = `${consistency.toFixed(0)}%`
  const consistencyRangeText =
    currentOperator.weeklyPerformance && currentOperator.weeklyPerformance.length > 0
      ? `Rango: ${Math.min(...currentOperator.weeklyPerformance)}% - ${Math.max(...currentOperator.weeklyPerformance)}%`
      : ""

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    },
    [onClose],
  )

  const employeeImageUrl = useMemo(() => {
    const documentId = operator.cedula || operator.document || String(operator.id)
    if (!documentId) {
      console.log("No se encontró número de documento para:", operator.name)
      return null
    }
    const url = `https://admon.sao6.com.co/web/uploads/empleados/${documentId}.jpg`
    console.log("URL de la imagen:", url)
    return url
  }, [operator])

  const handleImageError = () => {
    console.log("Error al cargar la imagen del operador:", operator.name)
    setImageError(true)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-2xl max-w-7xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
        {/* Header Section - Redesigned */}
        <header className="relative bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 border-b border-emerald-100 flex-shrink-0">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5" aria-hidden="true">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-300 to-teal-300 rounded-full translate-y-32 -translate-x-32"></div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-lg transition-all duration-200 z-20 shadow-md border border-slate-200"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>

          <div className="relative z-10 p-4">
            <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4">
              {/* Profile Info */}
              <div className="flex items-center gap-4 flex-1">
                <div className="relative">
                  {employeeImageUrl && !imageError ? (
                    <div className="w-20 h-20 relative rounded-2xl overflow-hidden shadow-lg border-3 border-white">
                      <Image
                        src={employeeImageUrl || "/placeholder.svg"}
                        alt={operator.name || "Foto del operador"}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                        onError={handleImageError}
                        priority
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg border-3 border-white">
                      <span className="text-emerald-700">{initials}</span>
                    </div>
                  )}
                  {operator.category === "Oro" && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-slate-800 mb-1 truncate">{operator.name}</h1>
                  {operator.position && (
                    <p className="text-base text-emerald-600 font-medium mb-2">{operator.position}</p>
                  )}

                  {/* Compact Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-slate-500">Código:</span>
                        <span className="font-semibold text-slate-800 ml-1">{operator.codigo}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Fingerprint className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-slate-500">Cédula:</span>
                        <span className="font-semibold text-slate-800 ml-1">
                          {operator.cedula || operator.document || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Cake className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-slate-500">Edad:</span>
                        <span className="font-semibold text-slate-800 ml-1">
                          {calculateAge(operator.birthDate)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-slate-500">Ingreso:</span>
                        <span className="font-semibold text-slate-800 ml-1">
                          {formatDate(operator.joinDate)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-slate-500">Antigüedad:</span>
                        <span className="font-semibold text-slate-800 ml-1">
                          {calculateTenure(operator.joinDate)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {operator.retirementDate ? (
                        <CalendarX className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      ) : (
                        <CalendarCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      )}
                      <div>
                        <span className="text-slate-500">Estado:</span>
                        {operator.retirementDate ? (
                          <span className="font-semibold text-red-600 ml-1">
                            Retirado ({formatDate(operator.retirementDate)})
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-600 ml-1">Vigente</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-slate-500">Zona:</span>
                        <span
                          className="font-semibold text-slate-800 ml-1 truncate"
                          title={operator.zona || "Sin zona"}
                        >
                          {operator.zona || "Sin zona"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-slate-500">Padrino:</span>
                        <span
                          className="font-semibold text-slate-800 ml-1 truncate"
                          title={operator.padrino || "Sin padrino"}
                        >
                          {operator.padrino || "Sin padrino"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Card - Redesigned */}
              <div className="w-full xl:w-auto">
                <div
                  className={`bg-gradient-to-br ${performanceLevel.gradientFrom} ${performanceLevel.gradientTo} rounded-2xl p-4 text-white shadow-xl min-w-[240px]`}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">{currentOperator.efficiency.toFixed(1)}%</div>
                    <div className="text-white/90 text-sm font-medium mb-2">Eficiencia Mensual</div>
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                      <performanceLevel.icon className="w-3 h-3" />
                      <span>{performanceLevel.level}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Global Performance Card */}
              <div className="w-full xl:w-auto">
                <div
                  className={`bg-gradient-to-br ${globalPerformanceLevel.gradientFrom} ${globalPerformanceLevel.gradientTo} rounded-2xl p-4 text-white shadow-xl min-w-[240px]`}
                >
                  {isGlobalEfficiencyLoading ? (
                    <div className="flex items-center justify-center h-[88px]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-1">
                        {globalEfficiency !== null ? globalEfficiency.toFixed(1) : '0.0'}%
                      </div>
                      <div className="text-white/90 text-sm font-medium mb-2">Eficiencia Global {selectedYear}</div>
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                        <globalPerformanceLevel.icon className="w-3 h-3" />
                        <span>{globalPerformanceLevel.level}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs - Improved */}
        <nav className="bg-white border-b border-slate-200 px-6 flex gap-1 overflow-x-auto flex-shrink-0" role="tablist">
          {[
            { id: "overview", label: "Vista General", icon: BarChart3 },
            { id: "kilometers", label: "Kilómetros", icon: Route },
            { id: "bonuses", label: "Bonos", icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 font-medium text-sm transition-all whitespace-nowrap rounded-t-lg ${isActive
                    ? "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500"
                    : "text-slate-600 hover:text-emerald-700 hover:bg-slate-50"
                  }`}
                role="tab"
                aria-selected={isActive}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Content Area - Scrollable */}
        <main className="flex-1 overflow-hidden bg-gradient-to-b from-slate-50/30 to-white min-h-0">
          <div className="h-full overflow-y-auto">
            {activeTab === "overview" && (
              <div className="p-6 relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-b-2xl">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                  </div>
                )}
                <div className={`space-y-6 ${isLoading ? "opacity-50" : ""}`}>
                  {/* Key Performance Indicators */}
                  <section>
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        Indicadores Clave de Rendimiento
                      </h2>
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedYear ? String(selectedYear) : ''}
                          onValueChange={(value) => {
                            const newYear = Number(value);
                            setSelectedYear(newYear);
                            if (availableDates.months[newYear] && availableDates.months[newYear].length > 0) {
                              setSelectedMonth(availableDates.months[newYear][0]);
                            } else {
                              setSelectedMonth(undefined);
                            }
                          }}
                          disabled={isLoading || areDatesLoading}
                        >
                          <SelectTrigger className="w-[120px] bg-white">
                            <SelectValue placeholder="Año" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDates.years.map((year) => (
                              <SelectItem key={year} value={String(year)}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={selectedMonth ? String(selectedMonth) : ''}
                          onValueChange={(value) => setSelectedMonth(Number(value))}
                          disabled={isLoading || areDatesLoading || !selectedYear}
                        >
                          <SelectTrigger className="w-[140px] bg-white">
                            <SelectValue placeholder="Mes" />
                          </SelectTrigger>
                          <SelectContent>
                            {(availableDates.months[selectedYear!] || []).map((month) => (
                              <SelectItem key={month} value={String(month)}>
                                {new Date(0, month - 1).toLocaleString("es-CO", {
                                  month: "long",
                                })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Bonos Card */}
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-slate-800">{bonusTotalText}</div>
                            <div className="text-sm text-emerald-600 font-medium">{bonusObjectiveText}</div>
                          </div>
                        </div>
                        <div className="w-full bg-emerald-100 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${bonusPercentClamped}%` }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-slate-500">Bonos Totales</div>
                      </div>

                      {/* Kilómetros Card */}
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-500 rounded-xl flex items-center justify-center">
                            <Route className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-slate-800">{executedKm.toLocaleString("es-CO")}</div>
                            <div className="text-sm text-teal-600 font-medium">{kmDiffText} vs objetivo</div>
                          </div>
                        </div>
                        <div className="w-full bg-teal-100 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-teal-400 to-teal-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${kmEfficiencyClamped}%` }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-slate-500">Kilómetros Ejecutados</div>
                      </div>

                      {/* Consistencia Card */}
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center">
                            <Target className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-slate-800">{consistencyText}</div>
                            <div className="text-sm text-blue-600 font-medium">Estabilidad</div>
                          </div>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${consistency}%` }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-slate-500">Consistencia Semanal</div>
                      </div>
                    </div>
                  </section>

                  {/* Detailed Analysis */}
                  <section>
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-600" />
                      Análisis Detallado
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Análisis de Bonos */}
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800">Rendimiento Económico</h3>
                            <p className="text-sm text-slate-500">Análisis de bonificaciones</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Total Acumulado</span>
                            <span className="font-bold text-emerald-600">{bonusTotalText}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Progreso del Objetivo</span>
                            <span className="font-bold text-slate-800">
                              {bonusPercentage.toFixed(1)}%
                            </span>
                          </div>

                          {bonusDeductions && bonusDeductions.length > 0 && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                              <h4 className="text-sm font-semibold text-red-700 mb-2">
                                Deducciones del Periodo
                              </h4>
                              <div className="space-y-2">
                                {bonusDeductions.slice(0, 3).map((ded, idx) => (
                                  <div key={idx} className="text-xs text-red-600">
                                    <div className="font-medium">{ded.reason}</div>
                                    {ded.observation && (
                                      <div className="text-red-500 mt-1">{ded.observation}</div>
                                    )}
                                  </div>
                                ))}
                                {bonusDeductions.length > 3 && (
                                  <div className="text-xs text-red-500 font-medium">
                                    +{bonusDeductions.length - 3} más...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Análisis de Kilómetros */}
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-500 rounded-lg flex items-center justify-center">
                            <Route className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800">Rendimiento Operativo</h3>
                            <p className="text-sm text-slate-500">Análisis de kilómetros</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-teal-50 rounded-lg">
                              <div className="text-lg font-bold text-teal-700">
                                {executedKm.toLocaleString("es-CO")}
                              </div>
                              <div className="text-xs text-teal-600">Ejecutados</div>
                            </div>
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                              <div className="text-lg font-bold text-slate-700">
                                {programmedKm.toLocaleString("es-CO")}
                              </div>
                              <div className="text-xs text-slate-600">Programados</div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Eficiencia</span>
                            <span className="font-bold text-teal-600">
                              {kmEfficiencyClamped.toFixed(1)}%
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Diferencia</span>
                            <span
                              className={`font-bold ${kmDiff >= 0 ? "text-emerald-600" : "text-red-600"
                                }`}
                            >
                              {kmDiffText} km
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === "kilometers" && (
              <div className="p-6">
                <KmDetailsTab userCode={operator.cedula ?? String(operator.id)} />
              </div>
            )}

            {activeTab === "bonuses" && (
              <div className="p-6">
                <BonusDetailsTab userCode={operator.cedula ?? String(operator.id)} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export const OperatorDetailModal = EnhancedOperatorDetailModal
export default EnhancedOperatorDetailModal
