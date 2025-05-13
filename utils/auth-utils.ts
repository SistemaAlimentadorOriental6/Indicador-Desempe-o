/**
 * Utilidades para manejo de autenticación
 */

/**
 * Elimina todas las cookies relacionadas con la autenticación
 * Versión mejorada para funcionar correctamente en escritorio
 */
export function clearAuthCookies() {
  if (typeof document === "undefined") return

  // Método más efectivo: eliminar todas las cookies existentes
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

  // También eliminar específicamente las cookies que conocemos
  const cookiesToClear = [
    "rememberedCedula",
    "sidebarCollapsed",
    "user",
    "__next_hmr_refresh_hash__",
    "_backendCSRF",
    "PHPSESSID",
    "sao6_auth",
  ]

  cookiesToClear.forEach((cookieName) => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=localhost;`
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=admon.sao6.com.co;`
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.sao6.com.co;`
  })

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
    } catch (e) {
      console.error("Error al limpiar el almacenamiento:", e)
    }
  }
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated() {
  if (typeof window === "undefined") return false

  // Verificar si existe la cookie de autenticación
  const hasAuthCookie = document.cookie.split(";").some((item) => item.trim().startsWith("sao6_auth="))

  // Verificar si existe el usuario en localStorage
  const hasUserInStorage = !!localStorage.getItem("user")

  return hasAuthCookie || hasUserInStorage
}

/**
 * Redirige al usuario a la página de inicio de sesión
 */
export function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.href = "/"
  }
}

/**
 * Cierra la sesión del usuario y redirige a la página de inicio
 * Versión mejorada para funcionar correctamente en escritorio
 */
export function logout() {
  clearAuthCookies()

  if (typeof window !== "undefined") {
    // Usar replace en lugar de href para evitar problemas con el historial
    window.location.replace("/")

    // Como respaldo, intentar también con href después de un breve retraso
    setTimeout(() => {
      window.location.href = "/"
    }, 100)
  }
}
