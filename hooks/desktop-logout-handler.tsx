"use client"

import { useEffect } from "react"
import { useLogout } from "./use-logout"

interface DesktopLogoutHandlerProps {
  onLogout: () => void
}

/**
 * Componente específico para manejar el cierre de sesión en escritorio
 * Se puede incluir en el layout principal para asegurar que el cierre de sesión
 * funcione correctamente en todos los dispositivos
 */
export default function DesktopLogoutHandler({ onLogout }: DesktopLogoutHandlerProps) {
  const { logout } = useLogout()

  // Interceptar el evento de cierre de sesión
  useEffect(() => {
    const handleLogoutEvent = () => {
      logout(onLogout)
    }

    // Escuchar el evento personalizado de cierre de sesión
    window.addEventListener("app:logout", handleLogoutEvent)

    return () => {
      window.removeEventListener("app:logout", handleLogoutEvent)
    }
  }, [logout, onLogout])

  // Este componente no renderiza nada visible
  return null
}
