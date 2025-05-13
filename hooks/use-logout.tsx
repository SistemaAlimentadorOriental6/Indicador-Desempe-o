"use client"

import { useState } from "react"

/**
 * Hook personalizado para manejar el cierre de sesión de manera consistente
 * en todos los dispositivos, especialmente en escritorio
 */
export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const clearAllCookies = () => {
    if (typeof document === "undefined") return

    // Eliminar todas las cookies existentes
    const cookies = document.cookie.split(";")

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i]
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()

      if (name) {
        // Eliminar para todos los paths y dominios posibles
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`

        // Intentar con el hostname actual
        if (typeof window !== "undefined") {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname};`
        }

        // Intentar con dominios específicos
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=localhost;`
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=admon.sao6.com.co;`
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.sao6.com.co;`
      }
    }
  }

  const clearStorage = () => {
    if (typeof window === "undefined") return

    try {
      // Limpiar elementos específicos primero
      const itemsToRemove = ["user", "rememberedCedula", "sidebarCollapsed", "user_session", "sao6_auth"]

      itemsToRemove.forEach((item) => {
        localStorage.removeItem(item)
        sessionStorage.removeItem(item)
      })

      // Luego limpiar todo para asegurar que no quede nada
      localStorage.clear()
      sessionStorage.clear()
    } catch (e) {
      console.error("Error al limpiar el almacenamiento:", e)
    }
  }

  const logout = (callback?: () => void) => {
    setIsLoggingOut(true)

    try {
      // Limpiar cookies y almacenamiento
      clearAllCookies()
      clearStorage()

      // Ejecutar callback si existe
      if (typeof callback === "function") {
        callback()
      }

      // Redirigir a la página de inicio
      if (typeof window !== "undefined") {
        // Usar una combinación de técnicas para asegurar la redirección
        window.location.replace("/")

        // Como respaldo, usar también href después de un breve retraso
        setTimeout(() => {
          window.location.href = "/"
        }, 100)
      }
    } catch (error) {
      console.error("Error durante el cierre de sesión:", error)

      // Intento final de redirección si todo lo demás falla
      if (typeof window !== "undefined") {
        window.location.href = "/"
      }
    } finally {
      setIsLoggingOut(false)
    }
  }

  return {
    logout,
    isLoggingOut,
    clearAllCookies,
    clearStorage,
  }
}
