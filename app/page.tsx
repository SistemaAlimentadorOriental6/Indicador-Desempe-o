"use client"

import { useState, useEffect } from "react"
import ModernLoginForm from "@/components/login-form"
import MedicalApp from "@/components/dashboard/app"
import { useAuth } from "@/hooks/use-auth"
import { UserData } from "@/components/login/types"

export default function Page() {
  const { user, isLoading, login } = useAuth()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleLoginSuccess = (userData: UserData) => {
    login(userData)
  }

  if (!isClient) {
    return null
  }

  if (isLoading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center bg-white"
        role="status"
        aria-label="Cargando aplicación"
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 border-3 border-gray-200 rounded-full animate-spin"
            aria-hidden="true"
          />
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </main>
    )
  }

  if (!user) {
    return <ModernLoginForm onLoginSuccess={handleLoginSuccess} />
  }

  if (user.isAdmin || user.rol === "Administrador") {
    return <ModernLoginForm onLoginSuccess={handleLoginSuccess} />
  }

  return <MedicalApp />
}
