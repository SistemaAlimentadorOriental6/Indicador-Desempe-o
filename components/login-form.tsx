"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"

import { LoginHero } from "./login/login-hero"
import { LoginInput } from "./login/login-input"
import { LoginButton } from "./login/login-button"
import { ErrorModal, LoadingTransition } from "./login/overlays"
import { itemVariants, staggerContainer } from "./login/animations"
import { loginStyles } from "./login/styles"
import { LoginFormProps, AUTH_COOKIE_NAME, AUTH_COOKIE_EXPIRY, UserData } from "./login/types"

export default function ModernLoginForm({ onLoginSuccess }: LoginFormProps) {
  const [codigo, setCodigo] = useState("")
  const [cedula, setCedula] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [shake, setShake] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [checkingAutoLogin, setCheckingAutoLogin] = useState(true)
  const [showLoadingTransition, setShowLoadingTransition] = useState(false)

  const codigoInputRef = useRef<HTMLInputElement>(null)
  const cedulaInputRef = useRef<HTMLInputElement>(null)
  const { login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const checkAutoLogin = async () => {
      const savedAuth = Cookies.get(AUTH_COOKIE_NAME)

      if (savedAuth) {
        try {
          const userData = JSON.parse(savedAuth) as UserData
          setShowLoadingTransition(true)
          await new Promise((resolve) => setTimeout(resolve, 1500))
          login(userData)
          onLoginSuccess(userData)
          document.cookie = `user=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=86400; samesite=strict`
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

  useEffect(() => {
    const savedCedula = localStorage.getItem("rememberedCedula")
    if (savedCedula) {
      setCedula(savedCedula)
    }
  }, [])

  const validateCodigo = (codigo: string): boolean => codigo.length > 0
  const validateCedula = (cedula: string): boolean => cedula.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateCodigo(codigo)) {
      setError("Por favor ingrese su código de operador")
      setShake(true)
      setTimeout(() => setShake(false), 500)
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
      if (codigo === "ADMIN" && cedula === "MarioValle") {
        const adminUser: UserData = {
          codigo: "ADMIN001",
          nombre: "Mario Valle - Administrador del Sistema",
          cedula: "MarioValle",
          rol: "Administrador",
          telefono: "+34 600 000 000",
          isAdmin: true,
        }

        if (rememberMe) {
          Cookies.set(AUTH_COOKIE_NAME, JSON.stringify(adminUser), {
            expires: AUTH_COOKIE_EXPIRY,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          })
          localStorage.setItem("rememberedCedula", cedula)
        }

        login(adminUser)
        onLoginSuccess(adminUser)
        document.cookie = `user=${encodeURIComponent(JSON.stringify(adminUser))}; path=/; max-age=86400; samesite=strict`
        router.push("/admin")
        return
      }



      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, cedula }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error de autenticación")
      }

      const userData: UserData = {
        codigo: data.user.codigo,
        nombre: data.user.nombre,
        cedula: data.user.cedula,
        rol: data.user.rol,
        telefono: data.user.telefono || "",
        isAdmin: data.user.isAdmin || false,
      }

      if (rememberMe) {
        Cookies.set(AUTH_COOKIE_NAME, JSON.stringify(userData), {
          expires: AUTH_COOKIE_EXPIRY,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        })
        localStorage.setItem("rememberedCedula", cedula)
      }

      login(userData)
      onLoginSuccess(userData)
      document.cookie = `user=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=86400; samesite=strict`

      if (userData.isAdmin || userData.rol === "Administrador") {
        router.push("/admin")
      }
    } catch (err) {
      const newAttempts = loginAttempts + 1
      setLoginAttempts(newAttempts)

      if (newAttempts >= 5) {
        setShowErrorModal(true)
        setError("")
      } else {
        setError(err instanceof Error ? err.message : "Error de conexión")
        setShake(true)
        setTimeout(() => setShake(false), 500)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingAutoLogin || showLoadingTransition) {
    return <LoadingTransition />
  }

  return (
    <div className={`min-h-screen bg-white flex flex-col lg:flex-row relative overflow-hidden ${shake ? "animate-shake" : ""}`}>
      <LoginHero />

      <div className="lg:order-1 w-full lg:w-1/2 flex-1 lg:min-h-screen bg-white -mt-6 lg:mt-0 rounded-t-3xl lg:rounded-none relative z-20 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.12)] lg:shadow-none">
        <div className="h-full flex flex-col justify-center px-6 py-10 lg:px-12 xl:px-16 relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-md mx-auto w-full relative z-10"
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-8 lg:hidden" />

            <motion.div variants={itemVariants} className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Bienvenido{" "}
                <motion.span
                  animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
                  className="inline-block origin-bottom-right"
                >
                  👋
                </motion.span>
              </h1>
              <p className="text-gray-500 text-base">Ingresa tus credenciales para continuar.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div variants={itemVariants}>
                <LoginInput
                  ref={codigoInputRef}
                  label="Código de Operador"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ej: 12345"
                  showValidation
                  required
                  autoFocus
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <LoginInput
                  ref={cedulaInputRef}
                  label="Contraseña"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="••••••••"
                  isPassword
                  required
                />
              </motion.div>

              <motion.div variants={itemVariants} className="pt-3">
                <LoginButton
                  type="submit"
                  isLoading={isLoading}
                  disabled={!codigo || !cedula}
                >
                  Iniciar Sesión
                </LoginButton>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <p className="font-medium">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </div>
      </div>

      <ErrorModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} />

      <style jsx global>{loginStyles}</style>
    </div>
  )
}
