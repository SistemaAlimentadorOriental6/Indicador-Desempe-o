"use client"

import { useState, useEffect } from "react"
import EnhancedKpiDashboard from "./enhanced-kpi-dashboard"

export default function KpiDashboard() {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/admin/users")

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()
        setUsers(data.users || [])
      } catch (err) {
        console.error("Error fetching users:", err)
        setError("No se pudieron cargar los usuarios. Intente nuevamente más tarde.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <EnhancedKpiDashboard users={users} isLoading={isLoading} />
    </div>
  )
}
