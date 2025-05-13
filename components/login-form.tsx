"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Eye, EyeOff, User, Lock, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react'
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
      className="bg-white/20 backdrop-blur-md rounded-xl p-12 shadow-2xl"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <motion.div
            animate={{
              rotate: 360,
              transition: { duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
            }}
            className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full"
          />
        </div>
        <p className="text-white font-medium">Procesando...</p>
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
          className="bg-white rounded-lg p-6 shadow-2xl max-w-md w-full mx-4"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Demasiados intentos fallidos</h3>
            <p className="text-gray-600 mb-6">
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
    className="fixed inset-0 bg-white flex items-center justify-center z-50"
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
          className="w-8 h-8 rounded-full bg-green-500"
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
  const [cedula, setCedula] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [formStep, setFormStep] = useState<"cedula" | "password">("cedula")
  const [shake, setShake] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [cedulaFocused, setCedulaFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [showLoadingTransition, setShowLoadingTransition] = useState(false)
  const [checkingAutoLogin, setCheckingAutoLogin] = useState(true)

  const cedulaInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
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
    if (formStep === "cedula" && cedulaInputRef.current) {
      setTimeout(() => cedulaInputRef.current?.focus(), 300)
    } else if (formStep === "password" && passwordInputRef.current) {
      setTimeout(() => passwordInputRef.current?.focus(), 300)
    }
  }, [formStep])

  const validateCedula = (cedula: string): boolean => {
    return cedula.length > 0
  }

  const handleNextStep = () => {
    if (!validateCedula(cedula)) {
      setError("Por favor ingrese su cédula")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    setError("")
    setFormStep("password")
  }

  const handleBackToCedula = () => {
    setFormStep("cedula")
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formStep === "cedula") {
      handleNextStep()
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Check for admin credentials (for this demo, we'll use hardcoded credentials)
      if (cedula === "admin" && password === "admin") {
        // Create mock admin user data
        const adminUser = {
          codigo: "ADMIN001",
          nombre: "Administrador del Sistema",
          cedula: "admin",
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
        body: JSON.stringify({ cedula, password }),
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

          // If login is successful, call the onLoginSuccess callback with user data
          setTimeout(() => {
            login(data.user)
            onLoginSuccess(data.user)
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 30, 0],
            y: [0, -50, 0],
            opacity: [0.7, 0.8, 0.7],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 15,
            ease: "easeInOut",
          }}
          className="absolute top-10 left-10 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
        />
        <motion.div
          animate={{
            scale: [1, 0.9, 1],
            x: [0, -30, 0],
            y: [0, 30, 0],
            opacity: [0.7, 0.6, 0.7],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 18,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute top-0 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
            y: [0, 20, 0],
            opacity: [0.7, 0.9, 0.7],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 20,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute -bottom-8 left-20 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden relative z-10 ${shake ? "animate-shake" : ""}`}
      >
        {/* Login Form */}
        <div className="w-full p-8 md:p-10">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants} className="flex justify-center mb-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="relative w-32 h-32 flex items-center justify-center"
              >
                <Image src="/sao6-logo.png" alt="Logo SAO6" width={120} height={120} className="object-contain" />
              </motion.div>
            </motion.div>

            <motion.h2 variants={itemVariants} className="text-3xl font-bold text-green-700 text-center">
              Sistema SAO6
            </motion.h2>

            <AnimatePresence mode="wait">
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
                      className="text-green-700 flex items-center gap-2 text-base font-medium mb-2"
                    >
                      Cédula
                    </label>
                    <div className="relative">
                      <div
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${cedulaFocused ? "bg-green-500" : "bg-green-100"} flex items-center justify-center transition-colors duration-200`}
                      >
                        <User
                          className={`${cedulaFocused ? "text-white" : "text-green-600"} h-3.5 w-3.5 transition-colors duration-200`}
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
                        className={`pl-12 w-full border-0 ${cedulaFocused ? "ring-2 ring-green-500" : "ring-1 ring-green-200"} rounded-xl focus:outline-none text-lg h-14 bg-white shadow-sm transition-all duration-200`}
                        placeholder="Ingrese su cédula"
                        required
                        autoFocus
                      />
                      {cedula && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="text-green-600 h-3.5 w-3.5" />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-green-600 border-green-300 rounded focus:ring-green-500"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-green-700"
                    >
                      Recordar mi cédula e iniciar automáticamente
                    </label>
                  </div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl h-14 flex items-center justify-center gap-2 text-lg"
                      disabled={isLoading || !cedula}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                          Procesando...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
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
                      className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <p>{error}</p>
                    </motion.div>
                  )}
                </motion.form>
              )}

              {formStep === "password" && (
                <motion.form
                  key="passwordStep"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                  onSubmit={handleSubmit}
                >
                  <motion.div
                    variants={itemVariants}
                    className="bg-green-50 p-4 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="text-green-600 h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-medium text-green-700">Cédula: </span>
                        <span className="font-mono text-green-800">{cedula}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-green-600 hover:text-green-800 hover:bg-green-100 text-xs px-3 py-1.5 rounded-lg font-medium"
                      onClick={handleBackToCedula}
                    >
                      Cambiar
                    </button>
                  </motion.div>

                  <motion.div variants={itemVariants} className="relative">
                    <label
                      htmlFor="password"
                      className="text-green-700 flex items-center gap-2 text-base font-medium mb-2"
                    >
                      Contraseña
                    </label>
                    <div className="relative">
                      <div
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${passwordFocused ? "bg-green-500" : "bg-green-100"} flex items-center justify-center transition-colors duration-200`}
                      >
                        <Lock
                          className={`${passwordFocused ? "text-white" : "text-green-600"} h-3.5 w-3.5 transition-colors duration-200`}
                        />
                      </div>
                      <input
                        ref={passwordInputRef}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        className={`pl-12 pr-12 w-full border-0 ${passwordFocused ? "ring-2 ring-green-500" : "ring-1 ring-green-200"} rounded-xl focus:outline-none text-lg h-14 bg-white shadow-sm transition-all duration-200`}
                        placeholder="••••••••"
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="flex items-center space-x-2">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-green-600 border-green-300 rounded focus:ring-green-500"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-green-700"
                    >
                      Recordar mi cédula e iniciar automáticamente
                    </label>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2 h-14 text-lg"
                      disabled={isLoading || !password}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                          Iniciando sesión...
                        </>
                      ) : (
                        <>
                          <User className="h-5 w-5" />
                          Iniciar Sesión
                        </>
                      )}
                    </button>
                  </motion.div>

                  <motion.div variants={itemVariants} className="text-center">
                    <button
                      type="button"
                      className="text-green-600 hover:text-green-800 text-sm underline underline-offset-2"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </motion.div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <p>{error}</p>
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

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-green-900/30 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-white rounded-full p-8 shadow-2xl"
            >
              <motion.div className="w-24 h-24 relative">
                <svg
                  className="w-24 h-24 text-green-600"
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
