"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, FileText, ChevronRight, Activity, Award, Clock, Calendar, Route } from "lucide-react"
import PersonalInfo from "./personal-info"
import { useAuth } from "@/hooks/use-auth"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [activeSection, setActiveSection] = useState<string>("personal")
  const { user } = useAuth()
  const [profileImageError, setProfileImageError] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState("/focused-runner.png") // Imagen por defecto

  useEffect(() => {
    // Configurar la URL de la imagen basada en la cédula del usuario
    if (user?.cedula) {
      setProfileImageUrl(`https://admon.sao6.com.co/web/uploads/empleados/${user.cedula}.jpg`)
      // Resetear el estado de error cuando cambia el usuario
      setProfileImageError(false)
    }
  }, [user])

  // Manejador para errores de carga de imagen
  const handleImageError = () => {
    console.log("Error al cargar la imagen de perfil, usando imagen por defecto")
    setProfileImageError(true)
    setProfileImageUrl("/focused-runner.png") // Imagen por defecto en caso de error
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  const modalVariants = {
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  }

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.2 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95%] max-w-6xl h-[90vh] max-h-[800px] flex flex-col md:flex-row overflow-hidden rounded-2xl shadow-2xl"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
          >
            {/* Left sidebar - Green section */}
            <div className="w-full md:w-[320px] bg-gradient-to-b from-green-600 to-green-500 p-6 flex flex-col items-center relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-md"></div>
              <div className="absolute bottom-20 left-0 w-40 h-40 bg-green-700/20 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              <div className="absolute top-40 left-10 w-20 h-20 bg-white/5 rounded-full animate-pulse"></div>

              {/* Close button for mobile */}
              <motion.button
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 md:hidden"
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-5 w-5 text-white" />
              </motion.button>

              {/* Profile image with animation */}
              <div className="mt-6 md:mt-10 relative">
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
                <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-white overflow-hidden shadow-lg relative z-10">
                  <img
                    src={profileImageUrl || "/placeholder.svg"}
                    alt="Perfil del usuario"
                    className="h-full w-full object-cover"
                    onError={handleImageError}
                  />
                </div>
              </div>

              {/* User info */}
              <h2 className="text-xl md:text-2xl font-bold text-white mt-4">{user?.nombre || "Usuario"}</h2>
              <p className="text-green-50/90 mt-1">{user?.rol || "Operador"}</p>
              <div className="bg-white/20 rounded-full px-3 py-1 mt-2 backdrop-blur-sm">
                <span className="text-xs font-medium text-white">ID: {user?.codigo || "No disponible"}</span>
              </div>

              {/* Navigation tabs with improved hover effects */}
              <div className="w-full mt-8 space-y-2">
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSectionChange("personal")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    activeSection === "personal" ? "bg-white text-green-700 shadow-md" : "text-white hover:bg-white/20"
                  }`}
                >
                  <div className="flex items-center">
                    <User
                      className={`h-5 w-5 mr-3 ${activeSection === "personal" ? "text-green-600" : "text-white"}`}
                    />
                    <span className="font-medium">Datos Personales</span>
                  </div>
                  {activeSection === "personal" && <ChevronRight className="h-5 w-5 text-green-600" />}
                </motion.button>

                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSectionChange("documents")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    activeSection === "documents" ? "bg-white text-green-700 shadow-md" : "text-white hover:bg-white/20"
                  }`}
                >
                  <div className="flex items-center">
                    <FileText
                      className={`h-5 w-5 mr-3 ${activeSection === "documents" ? "text-green-600" : "text-white"}`}
                    />
                    <span className="font-medium">Documentos</span>
                  </div>
                  {activeSection === "documents" && <ChevronRight className="h-5 w-5 text-green-600" />}
                </motion.button>

                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSectionChange("stats")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    activeSection === "stats" ? "bg-white text-green-700 shadow-md" : "text-white hover:bg-white/20"
                  }`}
                >
                  <div className="flex items-center">
                    <Activity
                      className={`h-5 w-5 mr-3 ${activeSection === "stats" ? "text-green-600" : "text-white"}`}
                    />
                    <span className="font-medium">Estadísticas</span>
                  </div>
                  {activeSection === "stats" && <ChevronRight className="h-5 w-5 text-green-600" />}
                </motion.button>
              </div>

              {/* Stats with improved design */}
              <div className="w-full mt-auto pt-6 border-t border-white/20">
                <h3 className="text-sm font-medium text-white/80 mb-3">Resumen</h3>
                <div className="space-y-3">
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm hover:bg-white/15 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Activity className="h-4 w-4 text-green-100 mr-2" />
                        <span className="text-xs text-white/80">Actividad</span>
                      </div>
                      <span className="text-sm font-bold text-white">Alta</span>
                    </div>
                  </div>

                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm hover:bg-white/15 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-green-100 mr-2" />
                        <span className="text-xs text-white/80">Tiempo Activo</span>
                      </div>
                      <span className="text-sm font-bold text-white">32h/sem</span>
                    </div>
                  </div>

                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm hover:bg-white/15 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-green-100 mr-2" />
                        <span className="text-xs text-white/80">Nivel</span>
                      </div>
                      <span className="text-sm font-bold text-white">Plata</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right content area - White section */}
            <div className="flex-1 bg-gray-50 relative">
              {/* Close button for desktop */}
              <motion.button
                className="absolute top-4 right-4 p-2.5 rounded-full bg-white hover:bg-gray-100 shadow-md hover:shadow-lg transition-all z-10 hidden md:flex"
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-5 w-5 text-gray-600" />
              </motion.button>

              {/* Content header with improved design */}
              <div className="p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center">
                  <div className="h-1 w-5 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full mr-2"></div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {activeSection === "personal"
                      ? "Información Personal"
                      : activeSection === "documents"
                        ? "Documentos"
                        : "Estadísticas"}
                  </h3>
                </div>
              </div>

              {/* Content area with scrolling */}
              <div className="p-6 overflow-y-auto" style={{ height: "calc(100% - 73px)" }}>
                <AnimatePresence mode="wait">
                  {activeSection === "personal" && (
                    <motion.div
                      key="personal"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <PersonalInfo />
                    </motion.div>
                  )}

                  {activeSection === "documents" && (
                    <motion.div
                      key="documents"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        {["Cédula de Identidad", "Certificado Médico", "Licencia Deportiva", "Seguro Médico"].map(
                          (doc, index) => (
                            <motion.div
                              key={doc}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1, duration: 0.3 }}
                              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                            >
                              {/* Decorative background */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-green-50/50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-50/50 rounded-full"></div>
                              </div>

                              <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                  <div className="bg-green-50 p-2.5 rounded-lg">
                                    <FileText className="h-5 w-5 text-green-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-800">{doc}</h4>
                                    <div className="flex items-center">
                                      <p className="text-xs text-gray-500">Actualizado: 12/03/2023</p>
                                      <div className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                        Válido
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="bg-green-50 text-green-600 p-2.5 rounded-lg hover:bg-green-100 transition-colors"
                                >
                                  <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                  </svg>
                                </motion.button>
                              </div>

                              {/* Document preview with improved design */}
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center justify-between relative z-10">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-6 w-6 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                      {doc.toLowerCase().replace(/\s+/g, "_")}.pdf
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="p-1.5 rounded-md bg-white border border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-200 transition-colors"
                                    >
                                      <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                      </svg>
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="p-1.5 rounded-md bg-white border border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-200 transition-colors"
                                    >
                                      <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                      </svg>
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ),
                        )}
                      </div>

                      <div className="flex justify-end mt-6">
                        <motion.button
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          <span>Subir Nuevo Documento</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {activeSection === "stats" && (
                    <motion.div
                      key="stats"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Estadísticas de Kilómetros */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                          className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                        >
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-green-50/50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-50/50 rounded-full"></div>
                          </div>

                          <div className="flex items-center justify-between mb-4 relative z-10">
                            <h4 className="font-medium text-gray-800 flex items-center">
                              <Activity className="h-5 w-5 mr-2 text-green-600" />
                              Kilómetros Recorridos
                            </h4>
                            <span className="text-lg font-bold text-green-600">5,280 km</span>
                          </div>

                          <div className="relative z-10">
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "88%" }}
                                transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                              ></motion.div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                              <span>Meta: 6,000 km</span>
                              <span>88% completado</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100 relative z-10">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-green-600" />
                                <span className="text-sm text-gray-600">Último registro</span>
                              </div>
                              <span className="text-sm font-medium text-gray-800">15 de Mayo, 2023</span>
                            </div>
                          </div>
                        </motion.div>

                        {/* Estadísticas de Bonos */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                          className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                        >
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-green-50/50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-50/50 rounded-full"></div>
                          </div>

                          <div className="flex items-center justify-between mb-4 relative z-10">
                            <h4 className="font-medium text-gray-800 flex items-center">
                              <Award className="h-5 w-5 mr-2 text-green-600" />
                              Bonos Acumulados
                            </h4>
                            <span className="text-lg font-bold text-green-600">$45,000</span>
                          </div>

                          <div className="relative z-10">
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "75%" }}
                                transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                              ></motion.div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                              <span>Meta: $60,000</span>
                              <span>75% completado</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100 relative z-10">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-green-600" />
                                <span className="text-sm text-gray-600">Último bono</span>
                              </div>
                              <span className="text-sm font-medium text-gray-800">Mayo, 2023</span>
                            </div>
                          </div>
                        </motion.div>

                        {/* Nivel y Progreso */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.3 }}
                          className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                        >
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-green-50/50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-50/50 rounded-full"></div>
                          </div>

                          <div className="flex items-center justify-between mb-4 relative z-10">
                            <h4 className="font-medium text-gray-800 flex items-center">
                              <Award className="h-5 w-5 mr-2 text-green-600" />
                              Nivel Actual
                            </h4>
                            <span className="text-lg font-bold text-green-600">Plata</span>
                          </div>

                          <div className="relative z-10">
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "65%" }}
                                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                              ></motion.div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                              <span>Próximo nivel: Oro</span>
                              <span>65% completado</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100 relative z-10">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-green-600" />
                                <span className="text-sm text-gray-600">Tiempo en nivel</span>
                              </div>
                              <span className="text-sm font-medium text-gray-800">8 meses</span>
                            </div>
                          </div>
                        </motion.div>

                        {/* Actividad Reciente */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4, duration: 0.3 }}
                          className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                        >
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-green-50/50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-50/50 rounded-full"></div>
                          </div>

                          <div className="flex items-center justify-between mb-4 relative z-10">
                            <h4 className="font-medium text-gray-800 flex items-center">
                              <Activity className="h-5 w-5 mr-2 text-green-600" />
                              Actividad Reciente
                            </h4>
                          </div>

                          <div className="space-y-3 relative z-10">
                            <div className="flex items-center p-2 bg-green-50/50 rounded-lg">
                              <div className="bg-green-100 p-2 rounded-full">
                                <Route className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-800">Ruta Montaña</p>
                                <p className="text-xs text-gray-500">15 km - 12 de Mayo, 2023</p>
                              </div>
                            </div>

                            <div className="flex items-center p-2 bg-green-50/50 rounded-lg">
                              <div className="bg-green-100 p-2 rounded-full">
                                <Route className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-800">Carrera Urbana</p>
                                <p className="text-xs text-gray-500">10 km - 5 de Mayo, 2023</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      <div className="flex justify-end mt-6">
                        <motion.button
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <Activity className="h-5 w-5" />
                          <span>Ver Historial Completo</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
