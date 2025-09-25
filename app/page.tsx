"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ModernLoginForm from "../components/login-form"
import MedicalApp from "../components/dashboard/app"
import { useAuth } from "../hooks/use-auth"

export default function Page() {
  const { user, isLoading, login } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle admin redirect in useEffect to avoid render-time navigation
  useEffect(() => {
    if (user && (user.isAdmin || user.rol === "Administrador")) {
      router.push("/admin")
    }
  }, [user, router])

  // Handle successful login
  const handleLoginSuccess = (userData: any) => {
    login(userData)
    // Navigation will be handled by useEffect above
  }

  if (!isClient) {
    return null // Prevent hydration errors
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-900/5 via-emerald-50/40 to-white">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // If user is not logged in, show login form
  if (!user) {
    return <ModernLoginForm onLoginSuccess={handleLoginSuccess} />
  }

  // If user is admin, show loading while redirect happens
  if (user.isAdmin || user.rol === "Administrador") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-900/5 via-emerald-50/40 to-white">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Redirigiendo al panel de administración...</p>
        </div>
      </div>
    )
  }

  // If user is regular user, show the main app
  return <MedicalApp />
}
