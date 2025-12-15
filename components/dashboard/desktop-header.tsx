"use client"

import { Sparkles } from "lucide-react"

interface DesktopHeaderProps {
  user: any
  bonusesAvailable?: number
  lastMonthName?: string
  lastMonthYear?: number
  openProfile?: () => void
}

export default function DesktopHeader({
  user,
  bonusesAvailable = 0,
  lastMonthName = "",
  lastMonthYear = new Date().getFullYear(),
  openProfile
}: DesktopHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Buenos días"
    if (hour < 18) return "Buenas tardes"
    return "Buenas noches"
  }

  const userFirstName = user?.nombre?.split(" ")[0] || "Usuario"

  return (
    <div className="bg-white p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-green-50 p-2 rounded-lg w-fit">
          <Sparkles className="h-4 w-4 text-green-600" />
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
            Panel Principal
          </span>
        </div>

        <h1 className="text-2xl font-bold text-green-800">
          {getGreeting()}, <span className="text-green-600">{userFirstName}</span>
        </h1>

        <p className="text-green-600/70">
          Bienvenido de vuelta a <span className="font-semibold text-green-700">SAO6</span>.
          Esperamos que tengas una jornada productiva hoy.
        </p>
      </div>
    </div>
  )
}
