"use client"

import React, { useState, memo, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { LogOut, ChevronLeft, Trophy } from 'lucide-react'
import LogoutConfirmation from './dashboard/logout-confirmation'
import Image from 'next/image'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  activeView: string
  onViewChange: (view: string) => void
}

// Obtiene las iniciales del nombre del usuario
const obtenerIniciales = (nombre: string): string => {
  if (!nombre) return 'U'
  const partes = nombre.trim().split(' ')
  if (partes.length === 1) {
    return partes[0].charAt(0).toUpperCase()
  }
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase()
}

// Items del menú
const MENU_ITEMS = [
  {
    id: 'rankings',
    label: 'Rankings',
    icon: Trophy,
  },
]

// Componente de item del menú
const MenuItem = memo(({
  item,
  isActive,
  collapsed,
  onClick
}: {
  item: typeof MENU_ITEMS[0]
  isActive: boolean
  collapsed: boolean
  onClick: () => void
}) => {
  const Icon = item.icon

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors
        ${isActive
          ? 'bg-green-500 text-white'
          : 'text-gray-600 hover:bg-gray-50'
        }
      `}
    >
      <div className={`
        flex items-center justify-center w-8 h-8 rounded-lg
        ${isActive ? 'bg-white/20' : 'bg-gray-100'}
      `}>
        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-600'}`} />
      </div>

      {!collapsed && (
        <span className="font-medium text-sm">{item.label}</span>
      )}
    </button>
  )
})

MenuItem.displayName = 'MenuItem'

function SidebarBase({ collapsed, onToggle, activeView, onViewChange }: SidebarProps) {
  const { user } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const abrirModalLogout = useCallback(() => {
    setShowLogoutModal(true)
  }, [])

  const cerrarModalLogout = useCallback(() => {
    setShowLogoutModal(false)
  }, [])

  return (
    <div className={`
      fixed left-0 top-0 h-full bg-white border-r border-gray-100
      transition-all duration-300 z-50
      ${collapsed ? 'w-20' : 'w-72'}
    `}>
      {/* Encabezado */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <Image
                src="/LOGOS-SAO.webp"
                alt="Logo SAO6"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">SAO6</h1>
              <p className="text-xs text-gray-500">Panel de Control</p>
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Menú de navegación */}
      <nav className="p-3 space-y-1">
        {!collapsed && (
          <div className="px-3 mb-4">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Principal
            </span>
          </div>
        )}

        {MENU_ITEMS.map((item) => (
          <MenuItem
            key={item.id}
            item={item}
            isActive={activeView === item.id}
            collapsed={collapsed}
            onClick={() => onViewChange(item.id)}
          />
        ))}
      </nav>

      {/* Sección de usuario */}
      {!collapsed && user && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {obtenerIniciales(user.nombre)}
                  </span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
              </div>

              {/* Info del usuario */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user.nombre}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.rol}
                </p>
              </div>

              {/* Botón de logout */}
              <button
                onClick={abrirModalLogout}
                className="p-2 rounded-lg bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors border border-gray-200"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de logout */}
      <LogoutConfirmation
        isOpen={showLogoutModal}
        onClose={cerrarModalLogout}
        userCode={user?.codigo}
      />
    </div>
  )
}

export default memo(SidebarBase)
