"use client"

import { AnimatePresence } from "framer-motion"
import {
  Calendar,
  User,
  LogOut,
  Sparkles,
  Bell,
  ChevronRight,
  MapPin,
  CreditCard,
  Users,
  BadgeIcon as IdCard,
  Home,
  BarChart3,
  Settings,
  HelpCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import LogoutConfirmation from "./logout-confirmation"
import { useProfileData } from "@/hooks/use-profile-data"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { useDynamicUserImage } from "@/hooks/use-dynamic-user-image"

interface DesktopSidebarProps {
  user: any
  openProfile: () => void
  handleLogout: () => void
  kilometersTotal: number
  bonusesAvailable: number
  lastMonthName: string
  lastMonthYear: number
  kilometersData: any
}

export default function DesktopSidebar({
  user,
  openProfile,
  handleLogout,
  kilometersTotal,
  bonusesAvailable,
  lastMonthName,
  lastMonthYear,
  kilometersData,
}: DesktopSidebarProps) {
  const [currentDate, setCurrentDate] = useState<string>("")
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Obtener datos adicionales del perfil
  const { profileData, isLoading, error } = useProfileData(user?.cedula)
  const { imgSrc, isLoading: isImageLoading } = useDynamicUserImage(user?.cedula)

  // Format current date
  useEffect(() => {
    const date = new Date()
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    setCurrentDate(date.toLocaleDateString("es-CO", options))
  }, [])

  // Handle logout with confirmation
  const confirmLogout = () => {
    setShowLogoutConfirm(true)
  }

  const menuItems = [
    { icon: Home, label: "Dashboard", active: true },
    { icon: BarChart3, label: "Reportes" },
    { icon: User, label: "Perfil" },
    { icon: Settings, label: "Configuración" },
    { icon: HelpCircle, label: "Ayuda" },
  ]

  return (
    <>
      <div className="w-full h-full bg-gradient-to-b from-white to-green-50/30 border border-green-200/50 flex flex-col shadow-xl rounded-2xl overflow-hidden">
        <div className="p-8 border-b border-green-100/50 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 shadow-lg">
              <Image src="/LOGOS-SAO.webp" alt="Logo" width={32} height={32} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-green-800">Panel Principal</h1>
              <p className="text-xs text-green-600/70 font-medium">Sistema de Gestión</p>
            </div>
          </div>

          <Badge className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/50 text-green-700 px-4 py-2 rounded-xl border w-full justify-center shadow-sm">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="text-sm font-semibold">{currentDate}</span>
          </Badge>
        </div>

        <div className="p-8 border-b border-green-100/50">
          <div className="text-center mb-6">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full blur-md opacity-20 scale-110"></div>
              <Avatar className="relative h-24 w-24 border-4 border-white shadow-2xl mx-auto ring-2 ring-green-200/50">
                {isImageLoading ? (
                  <Skeleton className="h-full w-full rounded-full" />
                ) : (
                  <>
                    <AvatarImage src={imgSrc || undefined} alt={user?.nombre || "Usuario"} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-xl font-bold">
                      {user?.nombre
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2) || "FS"}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-green-400 to-green-500 rounded-full p-2 border-3 border-white shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">
              {user?.nombre}
            </h2>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-full border border-green-200/50">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-green-700 font-semibold text-sm">{profileData?.cargo}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full bg-green-100 rounded-lg" />
              <Skeleton className="h-4 w-3/4 bg-green-100 rounded-lg" />
              <Skeleton className="h-4 w-5/6 bg-green-100 rounded-lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-green-100/50 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-2">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Zona Asignada</p>
                    <p className="text-sm font-bold text-gray-800">{profileData?.zona}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-green-100/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="h-3 w-3 text-green-500" />
                    <p className="text-xs text-gray-500 font-medium">Código</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {profileData?.codigo || user?.codigo || "Sin código"}
                  </p>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-green-100/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <IdCard className="h-3 w-3 text-green-500" />
                    <p className="text-xs text-gray-500 font-medium">Cédula</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800 truncate">{user?.cedula}</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-green-100/50 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-2">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Padrino Asignado</p>
                    <p className="text-sm font-bold text-gray-800">{profileData?.padrino}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-green-100/50 bg-white/50 backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="ghost"
              onClick={confirmLogout}
              className="bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 text-gray-600 rounded-xl border border-gray-200/50 py-3 font-semibold shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <LogoutConfirmation
            isOpen={showLogoutConfirm}
            onClose={() => setShowLogoutConfirm(false)}
            onConfirm={handleLogout}
          />
        )}
      </AnimatePresence>
    </>
  )
}
