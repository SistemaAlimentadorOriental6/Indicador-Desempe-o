"use client"

import { useState, useEffect, memo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Calendar, LogOut, MapPin, CreditCard, Users, BadgeIcon as IdCard } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import LogoutConfirmation from "./logout-confirmation"
import { useProfileData } from "@/hooks/use-profile-data"
import { useDynamicUserImage } from "@/hooks/use-dynamic-user-image"
import Image from "next/image"

interface SidebarProps {
  user: {
    nombre?: string
    codigo?: string
    cedula?: string
    rol?: string
  }
  openProfile: () => void
  handleLogout: () => void
  kilometersTotal: number
  bonusesAvailable: number
  lastMonthName: string
  lastMonthYear: number
  kilometersData: any
}

const SidebarSkeleton = memo(() => (
  <div className="animate-pulse p-6 space-y-6">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gray-200 rounded-xl" />
      <div className="space-y-2">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-3 w-16 bg-gray-100 rounded" />
      </div>
    </div>
    <div className="h-10 bg-gray-100 rounded-xl" />
    <div className="flex flex-col items-center gap-4">
      <div className="w-20 h-20 bg-gray-200 rounded-full" />
      <div className="h-5 w-32 bg-gray-200 rounded" />
      <div className="h-4 w-24 bg-gray-100 rounded-full" />
    </div>
    <div className="space-y-3">
      <div className="h-16 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-14 bg-gray-100 rounded-xl" />
        <div className="h-14 bg-gray-100 rounded-xl" />
      </div>
      <div className="h-16 bg-gray-100 rounded-xl" />
    </div>
  </div>
))

SidebarSkeleton.displayName = "SidebarSkeleton"

const InfoCard = memo(({ icon: Icon, label, value, iconBg = "bg-green-500" }: {
  icon: any
  label: string
  value?: string
  iconBg?: string
}) => (
  <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
    <div className={`${iconBg} rounded-lg p-2`}>
      <Icon className="h-4 w-4 text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-800 truncate">{value || "—"}</p>
    </div>
  </div>
))

InfoCard.displayName = "InfoCard"

function DesktopSidebar({
  user,
  handleLogout,
  kilometersTotal,
  bonusesAvailable,
  lastMonthName,
  lastMonthYear,
}: SidebarProps) {
  const [currentDate, setCurrentDate] = useState("")
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { profileData, isLoading } = useProfileData(user?.cedula)
  const { imgSrc, isLoading: isImageLoading } = useDynamicUserImage(user?.cedula)

  useEffect(() => {
    setMounted(true)
    const date = new Date()
    setCurrentDate(date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }))
  }, [])

  const userInitials = user?.nombre
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "US"

  if (!mounted) {
    return <SidebarSkeleton />
  }

  return (
    <>
      <div className="h-full bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-500 rounded-xl p-2.5">
              <Image src="/LOGOS-SAO.webp" alt="Logo" width={24} height={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">SAO6</h1>
              <p className="text-xs text-gray-500">Sistema de Gestión</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{currentDate}</span>
          </div>
        </div>

        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                {isImageLoading ? (
                  <div className="w-full h-full bg-gray-200 animate-pulse rounded-full" />
                ) : (
                  <>
                    <AvatarImage src={imgSrc || undefined} alt={user?.nombre} className="object-cover" />
                    <AvatarFallback className="bg-green-500 text-white text-lg font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-1">{user?.nombre || "Usuario"}</h2>

            {isLoading ? (
              <div className="h-6 w-24 bg-gray-100 rounded-full animate-pulse" />
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                {profileData?.cargo || user?.rol || "Operador"}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              </div>
              <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          ) : (
            <div className="space-y-3">
              <InfoCard
                icon={MapPin}
                label="Zona Asignada"
                value={profileData?.zona}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CreditCard className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Código</span>
                  </div>
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {profileData?.codigo || user?.codigo || "—"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <IdCard className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Cédula</span>
                  </div>
                  <p className="text-sm font-bold text-gray-800 truncate">{user?.cedula || "—"}</p>
                </div>
              </div>

              <InfoCard
                icon={Users}
                label="Padrino Asignado"
                value={profileData?.padrino}
                iconBg="bg-emerald-500"
              />
            </div>
          )}
        </div>

        <div className="mt-auto p-6 border-t border-gray-100">
          <Button
            variant="ghost"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl py-3 font-medium"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

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

export default memo(DesktopSidebar)
