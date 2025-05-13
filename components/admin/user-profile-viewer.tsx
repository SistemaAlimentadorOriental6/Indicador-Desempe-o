"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  Route,
  Calendar,
  Activity,
  ChevronDown,
  ChevronUp,
  Mail,
  MapPin,
  Shield,
  Briefcase,
  Users,
  Phone,
  Award,
  Gift,
  Clock,
} from "lucide-react"
import MedicalApp from "@/medical-app"

interface UserProfileViewerProps {
  user: any
}

export default function UserProfileViewer({ user }: UserProfileViewerProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [showUserView, setShowUserView] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [bonusInfo, setBonusInfo] = useState<{
    expectedAmount: number
    actualAmount: number
    deductions: number
    deductionDetails: Array<{
      factor: string
      concept: string
      amount: number
      dates?: { start: string; end: string }
    }>
  } | null>(null)

  useEffect(() => {
    if (user) {
      const calculatedBonus = calculateBonus(user)
      setBonusInfo(calculatedBonus)
    } else {
      setBonusInfo(null)
    }
  }, [user])

  if (!user) return null

  function calculateBonus(user: any) {
    // Base bonus amount in Colombian pesos
    const baseBonusAmount = 130000

    // If no deductions data is available, return the base amount
    if (!user.deductions || !Array.isArray(user.deductions)) {
      return {
        expectedAmount: baseBonusAmount,
        actualAmount: baseBonusAmount,
        deductions: 0,
        deductionDetails: [],
      }
    }

    // Deduction rates based on factor codes
    const deductionRates: Record<string, { percentage: number | null; daily: boolean; amount: number }> = {
      "1": { percentage: 25, daily: false, amount: 32500 },
      "2": { percentage: 100, daily: false, amount: 130000 },
      "3": { percentage: null, daily: true, amount: 4333 },
      "4": { percentage: null, daily: true, amount: 4333 },
      "5": { percentage: 25, daily: false, amount: 32500 },
      "6": { percentage: null, daily: true, amount: 4333 },
      "7": { percentage: null, daily: true, amount: 4333 },
      "8": { percentage: null, daily: true, amount: 4333 },
      "9": { percentage: null, daily: true, amount: 4333 },
      "10": { percentage: 100, daily: false, amount: 130000 },
      "11": { percentage: null, daily: true, amount: 4333 },
      "12": { percentage: 50, daily: false, amount: 65000 },
      "13": { percentage: 0, daily: false, amount: 0 },
      DL: { percentage: 25, daily: false, amount: 32500 },
      DG: { percentage: 50, daily: false, amount: 65000 },
      DGV: { percentage: 100, daily: false, amount: 130000 },
      DEL: { percentage: 25, daily: false, amount: 32500 },
      DEG: { percentage: 50, daily: false, amount: 65000 },
      DEGV: { percentage: 100, daily: false, amount: 130000 },
      INT: { percentage: 25, daily: false, amount: 32500 },
      OM: { percentage: 25, daily: false, amount: 32500 },
      OMD: { percentage: 50, daily: false, amount: 65000 },
      OG: { percentage: 100, daily: false, amount: 130000 },
      NPD: { percentage: 100, daily: false, amount: 130000 },
    }

    let totalDeduction = 0
    const deductionDetails: Array<{
      factor: string
      concept: string
      amount: number
      dates?: { start: string; end: string }
    }> = []

    // Calculate deductions based on user's deduction records
    user.deductions.forEach((deduction: any) => {
      const factorCode = deduction.codigo_factor
      const deductionInfo = deductionRates[factorCode]

      if (!deductionInfo) return

      let deductionAmount = 0

      if (deductionInfo.daily) {
        // Calculate days between start and end dates
        const startDate = new Date(deduction.fecha_inicio_novedad)
        const endDate = new Date(deduction.fecha_fin_novedad)
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end days

        deductionAmount = deductionInfo.amount * diffDays
      } else {
        deductionAmount = deductionInfo.amount
      }

      totalDeduction += deductionAmount

      // Add to deduction details
      deductionDetails.push({
        factor: factorCode,
        concept: deduction.observaciones || getConceptName(factorCode),
        amount: deductionAmount,
        dates: {
          start: deduction.fecha_inicio_novedad,
          end: deduction.fecha_fin_novedad,
        },
      })
    })

    // Ensure deduction doesn't exceed base amount
    totalDeduction = Math.min(totalDeduction, baseBonusAmount)

    return {
      expectedAmount: baseBonusAmount,
      actualAmount: baseBonusAmount - totalDeduction,
      deductions: totalDeduction,
      deductionDetails,
    }
  }

  // Helper function to get concept name from factor code
  function getConceptName(factorCode: string): string {
    const concepts: Record<string, string> = {
      "1": "Incapacidad",
      "2": "Ausentismo",
      "3": "Incapacidad > 7 días",
      "4": "Calamidad",
      "5": "Retardo",
      "6": "Renuncia",
      "7": "Vacaciones",
      "8": "Suspensión",
      "9": "No Ingreso",
      "10": "Restricción",
      "11": "Día No Remunerado",
      "12": "Retardo por Horas",
      "13": "Día No Remunerado por Horas",
      DL: "Daño Leve",
      DG: "Daño Grave",
      DGV: "Daño Gravísimo",
      DEL: "Desincentivo Leve",
      DEG: "Desincentivo Grave",
      DEGV: "Desincentivo Gravísimo",
      INT: "Incumplimiento Interno",
      OM: "Falta Menor",
      OMD: "Falta Media",
      OG: "Falta Grave",
      NPD: "No presentar descargo",
    }

    return concepts[factorCode] || "Desconocido"
  }

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  // If showing the user view, render the MedicalApp component
  if (showUserView) {
    return (
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-md flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setShowUserView(false)}
              className="mr-4 p-2 bg-white rounded-xl shadow-sm hover:bg-gray-50"
            >
              <svg
                className="h-5 w-5 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-gray-800">Vista de usuario: {user.nombre}</h3>
          </div>
          <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">Vista previa</div>
        </div>
        <div className="pt-20">
          <MedicalApp />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header card with user info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-green-100"
      >
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-md"></div>
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full animate-pulse"></div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
            <div className="flex items-center">
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-emerald-300 blur-md opacity-70 scale-110"
                  animate={{
                    scale: [1.1, 1.2, 1.1],
                    opacity: [0.7, 0.8, 0.7],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                ></motion.div>
                <div className="h-20 w-20 rounded-full border-4 border-white overflow-hidden shadow-lg relative z-10">
                  <div className="h-full w-full bg-green-100 flex items-center justify-center">
                    <User className="h-10 w-10 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-white">{user.nombre}</h2>
                <p className="text-green-50/90 mt-1">{user.rol}</p>
                <div className="flex items-center mt-2">
                  <div className="bg-white/20 py-1 px-3 rounded-full backdrop-blur-sm inline-flex items-center">
                    <Shield className="w-3.5 h-3.5 mr-1 text-white" />
                    <span className="text-xs text-white font-medium">ID: {user.cedula}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{user.kilometros || 0}</div>
                <div className="text-xs text-green-50/90">Kilómetros</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{user.bonos || 0}</div>
                <div className="text-xs text-green-50/90">Bonos</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{user.nivel || "Bronce"}</div>
                <div className="text-xs text-green-50/90">Nivel</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUserView(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Ver como usuario
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Enviar mensaje
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
              Editar perfil
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Tabs navigation */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl p-1 shadow-md border border-green-100 flex">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === "overview"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-600 hover:text-green-700 hover:bg-white/50"
          }`}
        >
          <User className={`h-4 w-4 ${activeTab === "overview" ? "text-green-600" : "text-gray-500"}`} />
          Resumen
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === "activity"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-600 hover:text-green-700 hover:bg-white/50"
          }`}
        >
          <Activity className={`h-4 w-4 ${activeTab === "activity" ? "text-green-600" : "text-gray-500"}`} />
          Actividad
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === "stats"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-600 hover:text-green-700 hover:bg-white/50"
          }`}
        >
          <Route className={`h-4 w-4 ${activeTab === "stats" ? "text-green-600" : "text-gray-500"}`} />
          Estadísticas
        </button>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Personal Information */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-green-100">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-800">Información Personal</h3>
                  </div>
                  <button onClick={() => toggleSection("personal")} className="text-green-600 hover:text-green-700">
                    {expandedSection === "personal" ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {(expandedSection === "personal" || expandedSection === null) && (
                    <motion.div
                      initial={expandedSection === "personal" ? { height: 0, opacity: 0 } : false}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-400/10 p-2.5 rounded-xl">
                              <Shield className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Documento de identidad</p>
                              <p className="text-gray-800 font-medium">Cédula de Ciudadanía</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-400/10 p-2.5 rounded-xl">
                              <Shield className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Número de cédula</p>
                              <p className="text-gray-800 font-medium">{user.cedula}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-400/10 p-2.5 rounded-xl">
                              <Calendar className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Año de nacimiento</p>
                              <p className="text-gray-800 font-medium">1988</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-400/10 p-2.5 rounded-xl">
                              <MapPin className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Zona de residencia</p>
                              <p className="text-gray-800 font-medium">Zona Norte, Ciudad Verde</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-400/10 p-2.5 rounded-xl">
                              <Briefcase className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Cargo</p>
                              <p className="text-gray-800 font-medium">{user.rol}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-400/10 p-2.5 rounded-xl">
                              <Users className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Departamento</p>
                              <p className="text-gray-800 font-medium">Operaciones</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-400/10 p-2.5 rounded-xl">
                              <Phone className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Teléfono</p>
                              <p className="text-gray-800 font-medium">{user.telefono || "No registrado"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-400/10 p-2.5 rounded-xl">
                              <Mail className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Correo electrónico</p>
                              <p className="text-gray-800 font-medium">{user.email || `${user.cedula}@sao6.com`}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Bonus Information Section */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-green-100">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <Gift className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-800">Información de Bonos</h3>
                  </div>
                  <button onClick={() => toggleSection("bonusInfo")} className="text-green-600 hover:text-green-700">
                    {expandedSection === "bonusInfo" ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {(expandedSection === "bonusInfo" || expandedSection === null) && (
                    <motion.div
                      initial={expandedSection === "bonusInfo" ? { height: 0, opacity: 0 } : false}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {bonusInfo ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-5 rounded-2xl border border-green-100/40 shadow-sm">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="bg-green-400/10 p-2.5 rounded-xl">
                                  <Gift className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Bono Esperado</p>
                                  <p className="text-gray-800 font-bold text-xl">
                                    ${bonusInfo.expectedAmount.toLocaleString("es-CO")}
                                  </p>
                                </div>
                              </div>
                              <div className="h-2 w-full bg-green-100 rounded-full mt-2">
                                <div className="h-2 bg-green-500 rounded-full" style={{ width: "100%" }}></div>
                              </div>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-5 rounded-2xl border border-green-100/40 shadow-sm">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="bg-green-400/10 p-2.5 rounded-xl">
                                  <Award className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Bono Real</p>
                                  <p className="text-gray-800 font-bold text-xl">
                                    ${bonusInfo.actualAmount.toLocaleString("es-CO")}
                                  </p>
                                </div>
                              </div>
                              <div className="h-2 w-full bg-green-100 rounded-full mt-2">
                                <div
                                  className="h-2 bg-green-500 rounded-full"
                                  style={{
                                    width: `${(bonusInfo.actualAmount / bonusInfo.expectedAmount) * 100}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          {bonusInfo.deductions > 0 && (
                            <div className="bg-gradient-to-br from-red-50 to-red-100/40 p-5 rounded-2xl border border-red-100/40 shadow-sm">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <svg
                                    className="h-5 w-5 text-red-500"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M5 12h14"></path>
                                  </svg>
                                  <p className="text-gray-700 font-medium">Descuentos Aplicados</p>
                                </div>
                                <p className="text-red-600 font-bold">
                                  -${bonusInfo.deductions.toLocaleString("es-CO")}
                                </p>
                              </div>
                              <div className="h-2 w-full bg-red-100 rounded-full mt-2">
                                <div
                                  className="h-2 bg-red-500 rounded-full"
                                  style={{
                                    width: `${(bonusInfo.deductions / bonusInfo.expectedAmount) * 100}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {bonusInfo.deductionDetails.length > 0 && (
                            <div className="mt-4">
                              <button
                                onClick={() => toggleSection("bonusDetails")}
                                className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 bg-white/60 p-3 rounded-lg hover:bg-white/80 transition-colors"
                              >
                                <span>Ver Detalles de Descuentos</span>
                                <ChevronDown
                                  className={`h-4 w-4 text-gray-500 transition-transform ${
                                    expandedSection === "bonusDetails" ? "rotate-180" : ""
                                  }`}
                                />
                              </button>

                              <AnimatePresence>
                                {expandedSection === "bonusDetails" && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mt-3 bg-white/40 rounded-lg p-3 text-sm overflow-hidden"
                                  >
                                    <div className="space-y-2">
                                      {bonusInfo.deductionDetails.map((detail, index) => (
                                        <div
                                          key={index}
                                          className="border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                                        >
                                          <div className="flex justify-between">
                                            <span className="text-gray-700">{detail.concept}</span>
                                            <span className="text-red-500 font-medium">
                                              -${detail.amount.toLocaleString("es-CO")}
                                            </span>
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            <span>Código: {detail.factor}</span>
                                            {detail.dates && (
                                              <span className="ml-2">
                                                {new Date(detail.dates.start).toLocaleDateString("es-CO")} al{" "}
                                                {new Date(detail.dates.end).toLocaleDateString("es-CO")}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No hay información de bonos disponible</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-green-100">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <Award className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-800">Resumen de Rendimiento</h3>
                  </div>
                  <button onClick={() => toggleSection("performance")} className="text-green-600 hover:text-green-700">
                    {expandedSection === "performance" ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {(expandedSection === "performance" || expandedSection === null) && (
                    <motion.div
                      initial={expandedSection === "performance" ? { height: 0, opacity: 0 } : false}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-6">
                        {/* Level Progress */}
                        <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100/50 relative group overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-50/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-2000"></div>

                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-600">Nivel {user.nivel || "Bronce"}</span>
                            <span className="text-sm font-medium text-green-600">
                              Nivel {user.siguiente_nivel || "Plata"}
                            </span>
                          </div>
                          <div className="relative h-3 bg-gray-200/60 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${user.porcentaje_nivel || 65}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="absolute h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                            ></motion.div>
                            <motion.div
                              className="absolute -top-1 left-[65%] h-5 w-5 rounded-full border-2 border-white bg-emerald-400 shadow-md transform -translate-x-1/2"
                              animate={{
                                scale: [1, 1.1, 1],
                                boxShadow: [
                                  "0 1px 2px rgba(0,0,0,0.1)",
                                  "0 0 8px rgba(16, 185, 129, 0.6)",
                                  "0 1px 2px rgba(0,0,0,0.1)",
                                ],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Number.POSITIVE_INFINITY,
                                repeatType: "reverse",
                              }}
                            ></motion.div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                            <svg
                              className="h-3 w-3 text-green-500"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M12 16V12L10 10"></path>
                            </svg>
                            <span>
                              {user.kilometros_para_siguiente_nivel || 2500} km más para alcanzar el siguiente nivel
                            </span>
                          </div>
                        </div>

                        {/* Monthly Performance */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="bg-green-400/10 p-2.5 rounded-xl">
                                <Route className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">Kilómetros este mes</p>
                                <p className="text-gray-800 font-bold text-xl">{user.kilometros_mes || 120}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="bg-green-400/10 p-2.5 rounded-xl">
                                <Gift className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">Bonos disponibles</p>
                                <p className="text-gray-800 font-bold text-xl">{user.bonos_disponibles || 5}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="bg-green-400/10 p-2.5 rounded-xl">
                                <Calendar className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">Actividades completadas</p>
                                <p className="text-gray-800 font-bold text-xl">{user.actividades_completadas || 8}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Performance Chart */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                          <h4 className="text-sm font-medium text-gray-700 mb-4">Rendimiento en los últimos 6 meses</h4>
                          <div className="h-64 w-full">
                            {/* Placeholder for chart - would be implemented with a real chart library */}
                            <div className="h-full w-full bg-gray-50 rounded-xl flex items-center justify-center">
                              <p className="text-gray-500">Gráfico de rendimiento mensual</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Notes and Comments */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-green-100">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-green-600 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-800">Notas y Comentarios</h3>
                  </div>
                  <button onClick={() => toggleSection("notes")} className="text-green-600 hover:text-green-700">
                    {expandedSection === "notes" ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {(expandedSection === "notes" || expandedSection === null) && (
                    <motion.div
                      initial={expandedSection === "notes" ? { height: 0, opacity: 0 } : false}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-4">
                        <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100/50">
                          <div className="flex items-start gap-3">
                            <div className="bg-green-100 p-2 rounded-full">
                              <User className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-800">Administrador</p>
                                <span className="text-xs text-gray-500">hace 2 días</span>
                              </div>
                              <p className="text-gray-600 mt-1">
                                {user.nombre} ha mostrado un excelente rendimiento este mes, superando su meta de
                                kilómetros en un 15%. Se recomienda considerar para el programa de incentivos del
                                próximo trimestre.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100/50">
                          <div className="flex items-start gap-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                              <Briefcase className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-800">Supervisor</p>
                                <span className="text-xs text-gray-500">hace 1 semana</span>
                              </div>
                              <p className="text-gray-600 mt-1">
                                Participó activamente en la última jornada de capacitación y mostró gran interés en las
                                nuevas rutas programadas. Excelente actitud y disposición para el trabajo en equipo.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Agregar nuevo comentario
                          </label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            rows={3}
                            placeholder="Escribe un comentario sobre este usuario..."
                          ></textarea>
                          <div className="flex justify-end mt-2">
                            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                              Guardar comentario
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "activity" && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-green-100">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-800">Historial de Actividad</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      <option>Todos los tipos</option>
                      <option>Kilómetros</option>
                      <option>Bonos</option>
                      <option>Nivel</option>
                    </select>
                    <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      <option>Último mes</option>
                      <option>Últimos 3 meses</option>
                      <option>Último año</option>
                      <option>Todo el historial</option>
                    </select>
                  </div>
                </div>

                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200"></div>

                  {/* Timeline items */}
                  <div className="space-y-6">
                    {[
                      {
                        id: 1,
                        type: "kilometros",
                        description: "completó 15 kilómetros en la ruta Sierra Nevada",
                        date: "15 Jun 2023",
                        time: "10:30 AM",
                      },
                      {
                        id: 2,
                        type: "bonos",
                        description: "recibió 2 bonos por superar la meta mensual",
                        date: "10 Jun 2023",
                        time: "2:45 PM",
                      },
                      {
                        id: 3,
                        type: "nivel",
                        description: "subió al nivel Plata",
                        date: "1 Jun 2023",
                        time: "9:15 AM",
                      },
                      {
                        id: 4,
                        type: "kilometros",
                        description: "completó 10 kilómetros en la ruta Centro Ciudad",
                        date: "28 May 2023",
                        time: "11:20 AM",
                      },
                      {
                        id: 5,
                        type: "bonos",
                        description: "canjeó 3 bonos por un día libre",
                        date: "15 May 2023",
                        time: "4:10 PM",
                      },
                    ].map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex"
                      >
                        <div className="relative">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center z-10 relative ${
                              activity.type === "kilometros"
                                ? "bg-green-500"
                                : activity.type === "bonos"
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                            }`}
                          >
                            {activity.type === "kilometros" ? (
                              <Route className="h-4 w-4 text-white" />
                            ) : activity.type === "bonos" ? (
                              <Gift className="h-4 w-4 text-white" />
                            ) : (
                              <Award className="h-4 w-4 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm text-gray-800">
                            <span className="font-medium">{user.nombre}</span> {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.time} • {activity.date}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <button className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1">
                    Cargar más actividades
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
