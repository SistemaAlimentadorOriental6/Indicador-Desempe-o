"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import AdminDashboard from "@/components/admin/admin-dashboard"

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in and is an admin
    if (!user) {
      router.push("/")
      return
    }

    if (user.cedula !== "admin") {
      router.push("/")
      return
    }

    setIsLoading(false)
  }, [user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
          <p className="text-green-700 font-medium">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  return <AdminDashboard />
}
