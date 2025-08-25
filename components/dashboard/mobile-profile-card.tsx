"use client"

import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import {
  User,
  LogOut,
  Calendar,
  CreditCard,
  BadgeIcon as IdCard,
  Award,
  Sparkles,
  MapPin,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import LogoutConfirmation from "./logout-confirmation"
import { useProfileData } from "@/hooks/use-profile-data"
import { Skeleton } from "@/components/ui/skeleton"
import { useDynamicUserImage } from "@/hooks/use-dynamic-user-image"

interface MobileSidebarProps {
  user: { nombre: string; rol: string; codigo?: string; cedula?: string }
  handleLogout: () => void
}

export default function MobileSidebar({ user, handleLogout }: MobileSidebarProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [currentDate, setCurrentDate] = useState<string>("")
  const { profileData, isLoading } = useProfileData(user?.cedula)
  const { imgSrc, isLoading: isImageLoading } = useDynamicUserImage(user?.cedula)

  useEffect(() => {
    const date = new Date()
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    setCurrentDate(date.toLocaleDateString("es-CO", options))
  }, [])

  const confirmLogout = () => {
    setShowLogoutConfirm(true)
  }

  const getUserCategory = () => {
    const role = profileData?.cargo?.toLowerCase() || user?.rol?.toLowerCase() || ""
    if (role.includes("admin") || role.includes("supervisor")) return "Élite"
    if (role.includes("senior") || role.includes("avanzado")) return "Avanzado"
    if (role.includes("junior") || role.includes("intermedio")) return "Intermedio"
    return "Principiante"
  }

  const getCategoryColor = () => {
    const category = getUserCategory()
    switch (category) {
      case "Élite":
        return "from-emerald-600 to-green-700"
      case "Avanzado":
        return "from-green-500 to-emerald-600"
      case "Intermedio":
        return "from-green-400 to-green-500"
      default:
        return "from-green-300 to-green-400"
    }
  }

  return (
    <>
      <div className="w-full h-full bg-gradient-to-br from-white via-green-50/40 to-emerald-50/60 border border-green-200/60 flex flex-col shadow-2xl rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-8 border-b border-green-100/60 bg-gradient-to-r from-white/95 to-green-50/80 backdrop-blur-md">
          <div className="flex items-center gap-4 mb-6">
            <div className={`bg-gradient-to-br ${getCategoryColor()} rounded-2xl p-3 shadow-xl ring-2 ring-white/50`}>
              <Sparkles className="h-6 w-6 text-white drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-green-900 tracking-tight">Mi Perfil</h1>
              <p className="text-sm text-green-600/80 font-medium">Panel Personal</p>
            </div>
          </div>

          <Badge className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/60 text-green-800 px-4 py-3 rounded-2xl border w-full justify-center shadow-lg backdrop-blur-sm">
            <Calendar className="h-4 w-4 mr-3" />
            <span className="text-sm font-semibold">{currentDate}</span>
          </Badge>
        </div>

        <div className="p-8 flex-1 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor()} rounded-full blur-xl opacity-30 scale-125 animate-pulse`}
              ></div>
              <div
                className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor()} rounded-full blur-md opacity-20 scale-110`}
              ></div>
              <Avatar className="relative h-24 w-24 border-4 border-white shadow-2xl mx-auto ring-4 ring-green-100/50">
                {isImageLoading ? (
                  <Skeleton className="h-full w-full rounded-full" />
                ) : (
                  <>
                    <AvatarImage src={imgSrc || undefined} alt={user?.nombre || "Usuario"} className="object-cover" />
                    <AvatarFallback className={`bg-gradient-to-br ${getCategoryColor()} text-white text-xl font-bold`}>
                      {user?.nombre
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2) || "US"}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div
                className={`absolute -bottom-2 -right-2 bg-gradient-to-br ${getCategoryColor()} rounded-full p-2.5 border-4 border-white shadow-xl`}
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-green-900 mb-3 tracking-tight">{user?.nombre || "Usuario"}</h2>
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-100 to-emerald-100 px-5 py-2.5 rounded-full border border-green-200/60 shadow-lg backdrop-blur-sm">
              <Award className="w-4 h-4 text-green-600" />
              <p className="text-green-800 font-bold text-sm">{profileData?.cargo || getUserCategory()}</p>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[76px] w-full bg-green-100/50 rounded-2xl" />
                <Skeleton className="h-[76px] w-full bg-green-100/50 rounded-2xl" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-[68px] w-full bg-green-100/50 rounded-2xl" />
                  <Skeleton className="h-[68px] w-full bg-green-100/50 rounded-2xl" />
                </div>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-white/90 to-green-50/70 backdrop-blur-sm rounded-2xl p-5 border border-green-100/60 shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3 shadow-lg">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-green-600/80 font-medium mb-1">Zona Asignada</p>
                      <p className="text-lg font-bold text-green-900">{profileData?.zona || "No asignada"}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-white/90 to-green-50/70 backdrop-blur-sm rounded-2xl p-5 border border-green-100/60 shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3 shadow-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-green-600/80 font-medium mb-1">Padrino</p>
                      <p className="text-lg font-bold text-green-900">{profileData?.padrino || "No asignado"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-white/90 to-green-50/70 backdrop-blur-sm rounded-2xl p-4 border border-green-100/60 shadow-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="h-4 w-4 text-green-500" />
                      <p className="text-xs text-green-600/80 font-medium">Código</p>
                    </div>
                    <p className="text-sm font-bold text-green-900 truncate">
                      {profileData?.codigo || user?.codigo || "Sin código"}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-white/90 to-green-50/70 backdrop-blur-sm rounded-2xl p-4 border border-green-100/60 shadow-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <IdCard className="h-4 w-4 text-green-500" />
                      <p className="text-xs text-green-600/80 font-medium">Cédula</p>
                    </div>
                    <p className="text-sm font-bold text-green-900 truncate">{user?.cedula || "N/A"}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-8 bg-gradient-to-r from-white/80 to-green-50/60 backdrop-blur-md border-t border-green-100/60">
          <Button
            variant="ghost"
            onClick={confirmLogout}
            className="w-full bg-gradient-to-r from-white to-green-50/80 hover:from-green-50 hover:to-green-100/80 text-green-700 hover:text-green-800 rounded-2xl border border-green-200/60 py-4 font-bold text-base shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] backdrop-blur-sm"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Cerrar Sesión
          </Button>
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
