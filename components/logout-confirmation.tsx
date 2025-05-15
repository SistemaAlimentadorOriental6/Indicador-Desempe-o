"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut, AlertTriangle, X } from "lucide-react"

interface LogoutConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
}

export default function LogoutConfirmation({ isOpen, onClose, onConfirm }: LogoutConfirmationProps) {
  const [isClosing, setIsClosing] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  // Focus trap and accessibility
  useEffect(() => {
    if (isOpen) {
      // Set focus to the dialog when opened
      setTimeout(() => {
        cancelButtonRef.current?.focus()
      }, 100)

      // Prevent scroll on body
      document.body.style.overflow = "hidden"

      // Announce to screen readers
      const announcement = document.createElement("div")
      announcement.setAttribute("role", "status")
      announcement.setAttribute("aria-live", "polite")
      announcement.className = "sr-only"
      announcement.textContent = "Diálogo de confirmación de cierre de sesión abierto"
      document.body.appendChild(announcement)

      return () => {
        document.body.style.overflow = ""
        if (announcement.parentNode) {
          document.body.removeChild(announcement)
        }
      }
    }
  }, [isOpen])

  // Handle Escape key
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey)
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [isOpen])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node) && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 300)
  }

  // Enhanced logout function
  const handleConfirm = () => {
    setIsClosing(true)

    // Show visual feedback that logout is in progress
    const feedbackElement = document.createElement("div")
    feedbackElement.className = "fixed inset-0 bg-white/80 dark:bg-black/80 z-[100] flex items-center justify-center"
    feedbackElement.innerHTML = `
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl flex flex-col items-center">
        <div class="animate-spin h-8 w-8 border-4 border-green-500 dark:border-green-400 border-t-transparent rounded-full mb-4"></div>
        <p class="text-gray-700 dark:text-gray-200 font-medium">Cerrando sesión...</p>
      </div>
    `
    document.body.appendChild(feedbackElement)

    setTimeout(() => {
      setIsClosing(false)

      // Clear all cookies and storage
      clearAllCookies()

      // Execute onConfirm if it exists
      if (typeof onConfirm === "function") {
        try {
          onConfirm()
        } catch (error) {
          console.error("Error executing onConfirm:", error)

          // If onConfirm fails, redirect manually
          window.location.replace("/")
        }
      } else {
        // If no onConfirm function, redirect manually
        window.location.replace("/")
      }

      // Close the modal
      onClose()

      // Remove the feedback element after a delay
      setTimeout(() => {
        if (feedbackElement.parentNode) {
          document.body.removeChild(feedbackElement)
        }
      }, 500)
    }, 800) // Longer delay for better visual feedback
  }

  // Enhanced cookie clearing function
  const clearAllCookies = () => {
    try {
      // List of cookies to clear
      const cookiesToClear = [
        "rememberedCedula",
        "sidebarCollapsed",
        "user",
        "__next_hmr_refresh_hash__",
        "_backendCSRF",
        "PHPSESSID",
        "sao6_auth",
        "next-auth.session-token",
        "next-auth.callback-url",
        "next-auth.csrf-token",
        "__Secure-next-auth.session-token",
        "__Host-next-auth.csrf-token",
      ]

      // Get all domains to clear cookies from
      const hostname = window.location.hostname
      const domains = [
        "", // Default
        hostname,
        `.${hostname}`,
        hostname.split(".").slice(1).join("."),
        `.${hostname.split(".").slice(1).join(".")}`,
        "localhost",
        "admon.sao6.com.co",
        ".sao6.com.co",
      ]

      // Get all paths to clear cookies from
      const paths = ["/", "/api", "/auth", ""]

      // Clear all cookies for all domains and paths
      if (typeof document !== "undefined") {
        // Get all cookies
        const cookies = document.cookie.split(";")

        // Clear each cookie individually
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i]
          const eqPos = cookie.indexOf("=")
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()

          // Clear for all paths and domains
          domains.forEach((domain) => {
            paths.forEach((path) => {
              const domainPart = domain ? `domain=${domain}; ` : ""
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${domainPart}path=${path}; secure; samesite=strict;`
            })
          })
        }

        // Also clear specific cookies we know about
        cookiesToClear.forEach((cookieName) => {
          domains.forEach((domain) => {
            paths.forEach((path) => {
              const domainPart = domain ? `domain=${domain}; ` : ""
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${domainPart}path=${path}; secure; samesite=strict;`
            })
          })
        })
      }

      // Clear localStorage and sessionStorage
      if (typeof window !== "undefined") {
        // Clear specific items first
        const itemsToClear = [
          "user",
          "rememberedCedula",
          "sidebarCollapsed",
          "user_session",
          "token",
          "refresh_token",
          "auth",
          "theme",
        ]

        itemsToClear.forEach((item) => {
          try {
            localStorage.removeItem(item)
            sessionStorage.removeItem(item)
          } catch (e) {
            console.warn(`Failed to remove ${item}:`, e)
          }
        })

        // Then clear everything
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch (e) {
          console.warn("Failed to clear storage:", e)
        }

        // Clear IndexedDB
        try {
          if (window.indexedDB) {
            const databases = ["localforage", "keyval-store", "firebaseLocalStorageDb"]
            databases.forEach((db) => {
              indexedDB.deleteDatabase(db)
            })
          }
        } catch (e) {
          console.warn("Failed to clear IndexedDB:", e)
        }
      }
    } catch (error) {
      console.error("Error clearing user data:", error)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
        >
          {/* Overlay with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isClosing ? 0 : 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Dialog container */}
          <motion.div
            ref={dialogRef}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{
              scale: isClosing ? 0.9 : 1,
              opacity: isClosing ? 0 : 1,
              y: isClosing ? 20 : 0,
            }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3,
            }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl max-w-md w-full relative z-10 border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Cerrar diálogo"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 dark:bg-red-900/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-70"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl opacity-70"></div>

            <div className="relative z-10">
              {/* Icon and title */}
              <div className="text-center mb-6">
                <div className="relative mx-auto mb-5">
                  <motion.div
                    className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full blur-md transform scale-110"
                    animate={{
                      scale: [1.1, 1.15, 1.1],
                      opacity: [0.7, 0.9, 0.7],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  />
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

                  {/* Alert indicator */}
                  <motion.div
                    className="absolute -right-1 -top-1 bg-yellow-500 rounded-full p-1 border-2 border-white dark:border-gray-800"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </motion.div>
                </div>

                <h2 id="logout-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  ¿Cerrar sesión?
                </h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
                  Tu sesión actual se cerrará y serás redirigido a la pantalla de inicio de sesión.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <motion.button
                  ref={cancelButtonRef}
                  whileHover={{ scale: 1.02, backgroundColor: "rgb(243 244 246)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 dark:focus:ring-gray-600 dark:focus:ring-offset-gray-800"
                >
                  Cancelar
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 flex items-center justify-center gap-2 relative overflow-hidden"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>

                  {/* Shine effect */}
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
      )}
    </AnimatePresence>
  )
}
