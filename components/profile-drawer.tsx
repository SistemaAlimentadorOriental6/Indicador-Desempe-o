"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Award,
  Shield,
  Briefcase,
  FileText,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface ProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
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

  // Prevent body scroll when drawer is open
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

  const drawerVariants = {
    closed: {
      x: "100%",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
      },
    },
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
      },
    },
  }

  const backdropVariants = {
    closed: {
      opacity: 0,
      transition: {
        delay: 0.2,
      },
    },
    open: {
      opacity: 1,
    },
  }

  const contentVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2,
        duration: 0.4,
      },
    },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={backdropVariants}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={drawerVariants}
            className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-md"></div>
              <div className="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full animate-pulse"></div>

              <div className="flex justify-between items-start relative z-10">
                <h2 className="text-white font-bold text-xl">Perfil Personal</h2>
                <button
                  onClick={onClose}
                  className="bg-white/20 p-2 rounded-lg backdrop-blur-md border border-white/10 text-white hover:bg-white/30 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center mt-6 relative z-10">
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
                    <img
                      src={profileImageUrl || "/placeholder.svg"}
                      alt="Perfil del usuario"
                      className="h-full w-full object-cover"
                      onError={handleImageError}
                    />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-white font-bold text-lg">{user?.nombre || "Usuario"}</h3>
                  <p className="text-green-50/90 text-sm">{user?.rol || "Operador"}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <motion.div variants={contentVariants} initial="hidden" animate="visible" className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-gray-800 font-semibold mb-4 flex items-center">
                  <User className="h-4 w-4 mr-2 text-green-600" />
                  Información Personal
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500">Nombre Completo</p>
                        <p className="text-sm font-medium text-gray-800">{user?.nombre || "Usuario"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <FileText className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500">Cédula</p>
                        <p className="text-sm font-medium text-gray-800">{user?.cedula || "No disponible"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Briefcase className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500">Código</p>
                        <p className="text-sm font-medium text-gray-800">{user?.codigo || "No disponible"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Shield className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500">Rol</p>
                        <p className="text-sm font-medium text-gray-800">{user?.rol || "Operador"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-gray-800 font-semibold mb-4 flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-green-600" />
                  Información de Contacto
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Phone className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500">Teléfono</p>
                        <p className="text-sm font-medium text-gray-800">{user?.telefono || "No disponible"}</p>
                      </div>
                    </div>
                    <button className="text-green-600 hover:text-green-700">
                      <Phone className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Mail className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500">Correo Electrónico</p>
                        <p className="text-sm font-medium text-gray-800">usuario@sao6.com.co</p>
                      </div>
                    </div>
                    <button className="text-green-600 hover:text-green-700">
                      <Mail className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <MapPin className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500">Dirección</p>
                        <p className="text-sm font-medium text-gray-800">Calle Principal #123, Ciudad</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h4 className="text-gray-800 font-semibold mb-4 flex items-center">
                  <Award className="h-4 w-4 mr-2 text-green-600" />
                  Información Adicional
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Calendar className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500">Fecha de Ingreso</p>
                        <p className="text-sm font-medium text-gray-800">15 de Enero, 2020</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Clock className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500">Antigüedad</p>
                        <p className="text-sm font-medium text-gray-800">3 años, 5 meses</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Award className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-gray-500">Nivel</p>
                        <p className="text-sm font-medium text-gray-800">Plata</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4">
                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-medium shadow-md flex items-center justify-center gap-2">
                  <span>Ver Historial Completo</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
