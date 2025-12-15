"use client"

import { memo, useCallback, useEffect } from "react"
import { createPortal } from "react-dom"
import { LogOut, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLogout } from "@/hooks/use-logout"

interface LogoutConfirmationProps {
  isOpen: boolean
  onClose: () => void
  userCode?: string
}

// Componente principal memorizado para evitar re-renders innecesarios
function LogoutConfirmationBase({ isOpen, onClose, userCode }: LogoutConfirmationProps) {
  const { logout, isLoggingOut } = useLogout()

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = "" }
    }
  }, [isOpen])

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoggingOut) onClose()
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [isOpen, isLoggingOut, onClose])

  // Manejar el cierre de sesión
  const handleLogout = useCallback(async () => {
    // Intentar limpiar cache del usuario (no bloquea el logout si falla)
    if (userCode) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userCode })
      }).catch(() => { }) // Ignorar errores silenciosamente
    }
    logout()
  }, [userCode, logout])

  // No renderizar si no está abierto
  if (!isOpen) return null

  // Contenido del modal
  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Fondo oscuro */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isLoggingOut ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        className="relative bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2.5 rounded-lg">
              <LogOut className="h-5 w-5 text-green-600" />
            </div>
            <h2 id="logout-title" className="text-lg font-semibold text-gray-900">
              Cerrar Sesión
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isLoggingOut}
            className="h-8 w-8 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mensaje */}
        <p className="text-gray-600 text-sm mb-6">
          ¿Estás seguro de que deseas cerrar sesión? Tendrás que volver a iniciar sesión para continuar.
        </p>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoggingOut}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cerrando...
              </>
            ) : (
              "Confirmar"
            )}
          </Button>
        </div>
      </div>
    </div>
  )

  // Usar portal para renderizar fuera del DOM principal
  return createPortal(modalContent, document.body)
}

export default memo(LogoutConfirmationBase)
