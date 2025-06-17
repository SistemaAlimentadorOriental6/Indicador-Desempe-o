"use client"

import type React from "react"
import { useState } from "react"
import type { SortOrder, StatusFilter } from "@/types/user-types"
import { activeUsers } from "@/data/users-data"
import { sortUsers, filterUsers } from "@/utils/user-utils"
import { UsersHeader } from "./users-header"
import { UsersControls } from "./users-controls"
import { UserCard } from "./user-card"
import { UserListItem } from "./user-list-item"
import { UserDetailModal } from "./user-detail-modal"
import { NoResults } from "./no-results"

interface ActiveUser {
  id: number
  name: string
  email: string
  phone: string
  status: "online" | "away" | "busy" | "offline"
  activity: string
  time: string
  avatar: string
  zone: string // Zona de Medellín
  sponsor: string // Padrino
  role: string // Cargo
  department: string
  activeTime: string // Tiempo activo en la empresa
  rank: "Oro" | "Plata" | "Bronce" | "Mejorar" | "Taller Conciencia" // Rango
  lastLogin: string
  productivity: number
  currentProject: string
  joinDate: string
  performance: number[]
  badges: string[]
  isVip: boolean
  connectionQuality: "excellent" | "good" | "fair" | "poor"
  workingHours: string
  teamLead: string
  experience: string
  specialization: string
}

type ViewMode = "grid" | "list"
type SortBy = "name" | "status" | "zone" | "rank" | "productivity"
// type SortOrder = "asc" | "desc" // Removed duplicated type definition
// type StatusFilter = "all" | "online" | "away" | "busy" | "offline" // Removed duplicated type definition

const ActiveUsersSection: React.FC = () => {
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [sortBy, setSortBy] = useState<SortBy>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null)

  const filteredUsers = sortUsers(filterUsers(activeUsers, filter, searchQuery), sortBy, sortOrder)

  const handleUserClick = (user: ActiveUser) => {
    setSelectedUser(user)
  }

  const handleCloseModal = () => {
    setSelectedUser(null)
  }

  const handleClearFilters = () => {
    setFilter("all")
    setSearchQuery("")
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <UsersHeader users={activeUsers} />

      {/* Controls */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-soft">
        <UsersControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filter={filter}
          setFilter={setFilter}
          users={activeUsers}
        />
      </div>

      {/* Users Display */}
      {filteredUsers.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} onClick={handleUserClick} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Lista de Usuarios Activos</h3>
              <p className="text-sm text-gray-600 mt-1">Vista detallada por zonas de Medellín</p>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <UserListItem key={user.id} user={user} onClick={handleUserClick} />
              ))}
            </div>
          </div>
        )
      ) : (
        <NoResults onClearFilters={handleClearFilters} />
      )}

      {/* User Detail Modal */}
      {selectedUser && <UserDetailModal user={selectedUser} onClose={handleCloseModal} />}
    </div>
  )
}

export default ActiveUsersSection
