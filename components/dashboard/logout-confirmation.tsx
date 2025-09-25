"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import { useLogout } from "@/hooks/use-logout"

interface LogoutConfirmationProps {
  isOpen: boolean
  onClose: () => void
  userCode?: string // Código del usuario para limpiar su cache
}

export default function LogoutConfirmation({ isOpen, onClose, userCode }: LogoutConfirmationProps) {
  const [mounted, setMounted] = useState(false)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)
  const { logout, isLoggingOut } = useLogout()

  useEffect(() => {
    setMounted(true)
    
    // Create or get portal container
    let container = document.getElementById('logout-modal-portal')
    if (!container) {
      container = document.createElement('div')
      container.id = 'logout-modal-portal'
      container.style.position = 'fixed'
      container.style.top = '0'
      container.style.left = '0'
      container.style.zIndex = '99999'
      container.style.pointerEvents = 'none'
      document.body.appendChild(container)
    }
    setPortalContainer(container)

    return () => {
      // Clean up: remove container if no modals are using it
      if (container && container.children.length === 0) {
        document.body.removeChild(container)
      }
    }
  }, [])

  // Función para manejar el logout completo
  const handleLogout = async () => {
    try {
      // Limpiar cache del usuario si se proporciona userCode
      if (userCode) {
        try {
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userCode })
          })
          
          if (response.ok) {
            console.log('Cache del usuario limpiado:', userCode)
          }
        } catch (cacheError) {
          console.warn('No se pudo limpiar el cache, continuando con logout:', cacheError)
        }
      }

      // Ejecutar logout completo (cookies, storage, redirect)
      logout(() => {
        console.log('Sesión cerrada exitosamente')
      })
    } catch (error) {
      console.error('Error durante el logout:', error)
      // Si falla la limpieza de cache, aún así ejecutar logout básico
      logout()
    }
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!mounted || !portalContainer) {
    return null
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-green-200 dark:border-slate-700 p-6 w-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                    <AlertTriangle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Cerrar Sesión</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Confirma tu decisión</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="mb-8">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  ¿Estás seguro de que deseas cerrar sesión? Tendrás que volver a iniciar sesión para acceder a tu
                  dashboard.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  disabled={isLoggingOut}
                  className="flex-1 py-3 px-6 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 disabled:opacity-50"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleLogout} 
                  disabled={isLoggingOut}
                  className="flex-1 py-3 px-6 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cerrando...
                    </>
                  ) : (
                    "Cerrar Sesión"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, portalContainer)
}
