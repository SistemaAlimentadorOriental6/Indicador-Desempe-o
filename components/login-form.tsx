"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Eye, EyeOff, User, Lock, CheckCircle, ArrowRight, AlertCircle, Sparkles } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.5,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4 },
  },
}

const formVariants = {
  hidden: { x: 50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
  exit: {
    x: -50,
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

// Loading overlay component with improved animation
const LoadingOverlay = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
  >
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 10,
        },
      }}
      className="bg-white/90 backdrop-blur-md rounded-xl p-12 shadow-2xl border border-green-200"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <motion.div
            animate={{
              rotate: 360,
              transition: { duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
            }}
            className="w-12 h-12 border-4 border-green-100 border-t-green-500 rounded-full"
          />
        </div>
        <p className="text-green-700 font-medium">Procesando...</p>
      </div>
    </motion.div>
  </motion.div>
)

// Error modal component
const ErrorModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-white rounded-lg p-6 shadow-2xl max-w-md w-full mx-4 border border-green-200"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">Demasiados intentos fallidos</h3>
            <p className="text-green-700 mb-6">
              Has excedido el número de intentos permitidos. Por favor, intenta nuevamente más tarde o contacta a
              soporte.
            </p>
            <button
              onClick={onClose}
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)

// Loading transition component
const LoadingTransition = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
    className="fixed inset-0 bg-gradient-to-br from-green-50 to-white flex items-center justify-center z-50"
  >
    <div className="relative w-20 h-20 grid grid-cols-2 gap-2">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
          className="w-8 h-8 rounded-full bg-green-600"
        />
      ))}
    </div>
  </motion.div>
)

interface LoginFormProps {
  onLoginSuccess: (userData: {
    codigo: string
    nombre: string
    cedula: string
    rol: string
    telefono: string
  }) => void
}

const AUTH_COOKIE_NAME = "sao6_auth"
const AUTH_COOKIE_EXPIRY = 14 // days

export default function ModernLoginForm({ onLoginSuccess }: LoginFormProps) {
  const [codigo, setCodigo] = useState("")
  const [cedula, setCedula] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [formStep, setFormStep] = useState<"codigo" | "cedula">("codigo")
  const [shake, setShake] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [codigoFocused, setCodigoFocused] = useState(false)
  const [cedulaFocused, setCedulaFocused] = useState(false)
  const [showLoadingTransition, setShowLoadingTransition] = useState(false)
  const [checkingAutoLogin, setCheckingAutoLogin] = useState(true)

  const codigoInputRef = useRef<HTMLInputElement>(null)
  const cedulaInputRef = useRef<HTMLInputElement>(null)
  const { login } = useAuth()
  const router = useRouter()

  // Check for auto login on component mount
  useEffect(() => {
    const checkAutoLogin = async () => {
      const authCookie = Cookies.get(AUTH_COOKIE_NAME)

      if (authCookie) {
        try {
          const userData = JSON.parse(atob(authCookie))

          // Show loading transition
          setShowLoadingTransition(true)

          // Simulate API verification
          await new Promise((resolve) => setTimeout(resolve, 1500))

          // Auto login
          login(userData)
          onLoginSuccess(userData)
        } catch (error) {
          console.error("Auto login failed:", error)
          Cookies.remove(AUTH_COOKIE_NAME)
          setCheckingAutoLogin(false)
        }
      } else {
        setCheckingAutoLogin(false)
      }
    }

    checkAutoLogin()
  }, [login, onLoginSuccess])

  // Check for saved credentials on component mount
  useEffect(() => {
    const savedCedula = localStorage.getItem("rememberedCedula")
    if (savedCedula) {
      setCedula(savedCedula)
    }
  }, [])

  // Focus input when form step changes
  useEffect(() => {
    if (formStep === "codigo" && codigoInputRef.current) {
      setTimeout(() => codigoInputRef.current?.focus(), 300)
    } else if (formStep === "cedula" && cedulaInputRef.current) {
      setTimeout(() => cedulaInputRef.current?.focus(), 300)
    }
  }, [formStep])

  const validateCodigo = (codigo: string): boolean => {
    return codigo.length > 0
  }

  const validateCedula = (cedula: string): boolean => {
    return cedula.length > 0
  }

  const handleNextStep = () => {
    if (formStep === "codigo") {
      if (!validateCodigo(codigo)) {
        setError("Por favor ingrese su código")
        setShake(true)
        setTimeout(() => setShake(false), 500)
        return
      }
      setError("")
      setFormStep("cedula")
    }
  }

  const handleBack = () => {
    if (formStep === "cedula") {
      setFormStep("codigo")
    }
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formStep === "codigo") {
      handleNextStep()
      return
    }

    if (!validateCedula(cedula)) {
      setError("Por favor ingrese su cédula")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Check for admin credentials (for this demo, we'll use hardcoded credentials)
      if (codigo === "ADMIN" && cedula === "MarioValle") {
        // Create mock admin user data
        const adminUser = {
          codigo: "ADMIN001",
          nombre: "Mario Valle - Administrador del Sistema",
          cedula: "MarioValle",
          rol: "Administrador",
          telefono: "+34 600 000 000",
          isAdmin: true, // Special flag for admin users
        }

        // Show success animation
        setShowSuccessAnimation(true)

        // Wait for animation to complete before moving forward
        setTimeout(() => {
          // Show loading transition
          setShowLoadingTransition(true)

          // If login is successful, call the onLoginSuccess callback with user data
          setTimeout(() => {
            login(adminUser)
            onLoginSuccess(adminUser)
            router.push("/admin")
          }, 1000)
        }, 1500)

        return
      }

      // For regular users, call the login API endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codigo, cedula }),
      })

      const data = await response.json()

      if (response.ok) {
        // If remember me is checked, save the cedula
        if (rememberMe) {
          localStorage.setItem("rememberedCedula", cedula)

          // Set authentication cookie for auto login
          const cookieValue = btoa(JSON.stringify(data.user))
          Cookies.set(AUTH_COOKIE_NAME, cookieValue, { expires: AUTH_COOKIE_EXPIRY })
        } else {
          localStorage.removeItem("rememberedCedula")
        }

        // Show success animation
        setShowSuccessAnimation(true)

        // Wait for animation to complete before moving forward
        setTimeout(() => {
          // Show loading transition
          setShowLoadingTransition(true)

          setTimeout(() => {
            login(data.user)
            onLoginSuccess(data.user)
            if (data.user.isAdmin || data.user.rol === "Administrador") {
              router.push("/admin")
            }
          }, 1000)
        }, 1500)
      } else {
        setLoginAttempts((prevAttempts) => {
          const newAttempts = prevAttempts + 1
          if (newAttempts >= 3) {
            setShowErrorModal(true)
          }
          return newAttempts
        })
        setError(data.message || "Credenciales inválidas")
        setShake(true)
        setTimeout(() => setShake(false), 500)
      }
    } catch (error) {
      setError("Ocurrió un error. Por favor, intente nuevamente.")
      console.error("Error de inicio de sesión:", error)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingAutoLogin || showLoadingTransition) {
    return <LoadingTransition />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 30, 0],
            y: [0, -50, 0],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 15,
            ease: "easeInOut",
          }}
          className="absolute top-10 left-10 w-64 h-64 bg-green-200/40 rounded-full mix-blend-multiply filter blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 0.9, 1],
            x: [0, -30, 0],
            y: [0, 30, 0],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 18,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute top-0 right-10 w-72 h-72 bg-green-300/30 rounded-full mix-blend-multiply filter blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-green-200/50 overflow-hidden relative z-10 ${shake ? "animate-shake" : ""}`}
      >
        <div className="w-full p-8 md:p-10">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="relative w-24 h-24 flex items-center justify-center mb-4 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl"
              >
                <Image src="/sao6-logo.png" alt="Logo SAO6" width={80} height={80} className="object-contain" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-6 h-6 text-green-500" />
                </motion.div>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-4xl font-black text-green-800 text-center font-sans">
                Indicador de Desempeño
              </motion.h1>
              <motion.p variants={itemVariants} className="text-green-600 text-center mt-2 font-medium">
                Bienvenido de vuelta
              </motion.p>
            </motion.div>

            <AnimatePresence mode="wait">
              {formStep === "codigo" && (
                <motion.form
                  key="codigoStep"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                  onSubmit={handleSubmit}
                >
                  <div className="relative">
                    <label
                      htmlFor="codigo"
                      className="text-green-800 flex items-center gap-2 text-sm font-semibold mb-3"
                    >
                      Código de Operador
                    </label>
                    <div className="relative">
                      <div
                        className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl ${codigoFocused ? "bg-green-500" : "bg-green-100"} flex items-center justify-center transition-all duration-300`}
                      >
                        <User
                          className={`${codigoFocused ? "text-white" : "text-green-600"} h-5 w-5 transition-colors duration-300`}
                        />
                      </div>
                      <input
                        ref={codigoInputRef}
                        id="codigo"
                        type="text"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value)}
                        onFocus={() => setCodigoFocused(true)}
                        onBlur={() => setCodigoFocused(false)}
                        className={`pl-16 pr-4 w-full border-0 ${codigoFocused ? "ring-2 ring-green-500" : "ring-1 ring-green-200"} rounded-2xl focus:outline-none text-base h-16 bg-white shadow-sm transition-all duration-300 font-medium placeholder:text-green-400`}
                        placeholder="Ingrese su código"
                        required
                        autoFocus
                      />
                      {codigo && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute right-4 top-1/2 -translate-y-1/2"
                        >
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="text-green-500 h-5 w-5" />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <button
                      type="submit"
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl h-16 flex items-center justify-center gap-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading || !codigo}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                          Procesando...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          Continuar
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      )}
                    </button>
                  </motion.div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-center gap-3"
                    >
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <p className="font-medium">{error}</p>
                    </motion.div>
                  )}
                </motion.form>
              )}

              {formStep === "cedula" && (
                <motion.form
                  key="cedulaStep"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                  onSubmit={handleSubmit}
                >
                  <div className="relative">
                    <label
                      htmlFor="cedula"
                      className="text-green-800 flex items-center gap-2 text-sm font-semibold mb-3"
                    >
                      Cédula de Identidad
                    </label>
                    <div className="relative">
                      <div
                        className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl ${cedulaFocused ? "bg-green-500" : "bg-green-100"} flex items-center justify-center transition-all duration-300`}
                      >
                        <User
                          className={`${cedulaFocused ? "text-white" : "text-green-600"} h-5 w-5 transition-colors duration-300`}
                        />
                      </div>
                      <input
                        ref={cedulaInputRef}
                        id="cedula"
                        type="text"
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value)}
                        onFocus={() => setCedulaFocused(true)}
                        onBlur={() => setCedulaFocused(false)}
                        className={`pl-16 pr-4 w-full border-0 ${cedulaFocused ? "ring-2 ring-green-500" : "ring-1 ring-green-200"} rounded-2xl focus:outline-none text-base h-16 bg-white shadow-sm transition-all duration-300 font-medium placeholder:text-green-400`}
                        placeholder="Ingrese su número de cédula"
                        required
                        autoFocus
                      />
                      {cedula && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute right-4 top-1/2 -translate-y-1/2"
                        >
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="text-green-500 h-5 w-5" />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <motion.div
                    variants={itemVariants}
                    className="bg-green-50 p-4 rounded-2xl flex items-center justify-between border border-green-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <User className="text-green-600 h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-semibold text-green-800 text-sm">Código: </span>
                        <span className="font-mono text-green-600 font-bold">{codigo}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-white hover:text-white text-sm px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 font-semibold transition-all duration-200"
                      onClick={handleBack}
                    >
                      Cambiar
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <button
                      type="submit"
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-3 h-16 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading || !cedula}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                          Iniciando sesión...
                        </>
                      ) : (
                        <>
                          <Lock className="h-5 w-5" />
                          Iniciar Sesión
                        </>
                      )}
                    </button>
                  </motion.div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-center gap-3"
                    >
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <p className="font-medium">{error}</p>
                    </motion.div>
                  )}
                </motion.form>
              )}

            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      {isLoading && <LoadingOverlay />}
      <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} />

      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-white rounded-3xl p-12 shadow-2xl border border-green-200"
            >
              <motion.div className="w-24 h-24 relative">
                <svg
                  className="w-24 h-24 text-green-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                  <motion.polyline
                    points="22 4 12 14.01 9 11.01"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeInOut", delay: 0.8 }}
                  />
                </svg>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add CSS for animations */}
      <style jsx global>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  )
}
