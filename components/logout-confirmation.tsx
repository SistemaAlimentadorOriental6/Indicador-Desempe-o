"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { LogOut, AlertTriangle } from "lucide-react"

interface LogoutConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
}

export default function LogoutConfirmation({ isOpen, onClose, onConfirm }: LogoutConfirmationProps) {
  const [isClosing, setIsClosing] = useState(false)

  // Manejar tecla Escape para cerrar el diálogo
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey)
      // Prevenir scroll en el body cuando el modal está abierto
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey)
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Función para manejar el cierre con animación
  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 300)
  }

  // Modificar la función handleConfirm para asegurar que funcione correctamente en escritorio
  const handleConfirm = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)

      // Limpiar todas las cookies y datos de sesión
      clearAllCookies()

      // Ejecutar la función onConfirm si existe
      if (typeof onConfirm === "function") {
        try {
          onConfirm()
        } catch (error) {
          console.error("Error al ejecutar onConfirm:", error)
        }
      }

      // Cerrar el modal
      onClose()

      // Redirigir a la página principal/login con un enfoque más directo para escritorio
      if (typeof window !== "undefined") {
        // Forzar la redirección sin usar setTimeout para evitar problemas en escritorio
        window.location.replace("/")
      }
    }, 300)
  }

  // Modificar la función clearAllCookies para ser más efectiva en escritorio
  const clearAllCookies = () => {
    // Lista de cookies a eliminar
    const cookiesToClear = [
      "rememberedCedula",
      "sidebarCollapsed",
      "user",
      "__next_hmr_refresh_hash__",
      "_backendCSRF",
      "PHPSESSID",
      "sao6_auth",
    ]

    // Método más agresivo para eliminar cookies en escritorio
    if (typeof document !== "undefined") {
      // Obtener todos los cookies
      const cookies = document.cookie.split(";")

      // Eliminar cada cookie individualmente
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i]
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()

        // Eliminar para todos los paths y dominios posibles
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname};`
      }

      // También eliminar las cookies específicas que conocemos
      cookiesToClear.forEach((cookieName) => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=localhost;`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=admon.sao6.com.co;`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.sao6.com.co;`
      })
    }

    // Limpiar localStorage y sessionStorage de manera más completa
    if (typeof window !== "undefined") {
      try {
        // Limpiar elementos específicos primero
        localStorage.removeItem("user")
        localStorage.removeItem("rememberedCedula")
        localStorage.removeItem("sidebarCollapsed")
        localStorage.removeItem("user_session")

        // Luego limpiar todo para asegurar que no quede nada
        localStorage.clear()
        sessionStorage.clear()

        // Intentar eliminar cualquier otro tipo de almacenamiento
        if (window.indexedDB) {
          indexedDB.deleteDatabase("localforage")
        }
      } catch (e) {
        console.error("Error al limpiar el almacenamiento:", e)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0">
      {/* Overlay con desenfoque */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isClosing ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Contenedor del diálogo */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{
          scale: isClosing ? 0.9 : 1,
          opacity: isClosing ? 0 : 1,
          y: isClosing ? 20 : 0,
        }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 300,
          duration: 0.3,
        }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl max-w-md w-full relative z-10 border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Elementos decorativos */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 dark:bg-red-900/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-70"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl opacity-70"></div>

        <div className="relative z-10">
          {/* Icono y título */}
          <div className="text-center mb-6">
            <div className="relative mx-auto mb-5">
              <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full blur-md transform scale-110 animate-pulse"></div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto relative">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, 15, 0, -15, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: 1,
                    repeatDelay: 0.5,
                  }}
                >
                  <LogOut className="h-8 w-8 text-white" />
                </motion.div>
              </div>

              {/* Indicador de alerta */}
              <motion.div
                className="absolute -right-1 -top-1 bg-yellow-500 rounded-full p-1 border-2 border-white dark:border-gray-800"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <AlertTriangle className="h-4 w-4 text-white" />
              </motion.div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¿Cerrar sesión?</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
              Tu sesión actual se cerrará y serás redirigido a la pantalla de inicio de sesión.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: "rgb(243 244 246)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClose}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 dark:focus:ring-gray-600"
            >
              Cancelar
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>

              {/* Efecto de brillo */}
              <motion.div
                className="absolute inset-0 bg-white/20 rounded-xl"
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: ["100%", "-100%"], opacity: [0, 0.3, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 3,
                }}
              />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
