"use client"

import type React from "react"
import { Search, ArrowUpDown, Grid, List, Download } from "lucide-react"
import type { ViewMode, SortBy, SortOrder, StatusFilter } from "@/types/user-types"
import { getStatusColor, getStatusStats } from "@/utils/user-utils"
import type { ActiveUser } from "@/types/user-types"

interface UsersControlsProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortBy: SortBy
  setSortBy: (sortBy: SortBy) => void
  sortOrder: SortOrder
  setSortOrder: (order: SortOrder) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  filter: StatusFilter
  setFilter: (filter: StatusFilter) => void
  users: ActiveUser[]
}

export const UsersControls: React.FC<UsersControlsProps> = ({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  filter,
  setFilter,
  users,
}) => {
  const statusStats = getStatusStats(users)

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, zona, padrino..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-gray-25 focus:bg-white font-medium"
            />
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white font-medium"
            >
              <option value="name">Nombre</option>
              <option value="status">Estado</option>
              <option value="zone">Zona</option>
              <option value="rank">Rango</option>
              <option value="productivity">Productividad</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-3 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all duration-300"
            >
              <ArrowUpDown className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                viewMode === "grid" ? "bg-white shadow-soft text-primary-600" : "text-gray-600"
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                viewMode === "list" ? "bg-white shadow-soft text-primary-600" : "text-gray-600"
              }`}
            >
              <List className="w-4 h-4" />
              <span>Lista</span>
            </button>
          </div>

          <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-green font-semibold hover:scale-105">
            <Download className="w-5 h-5" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-3">
        {(["all", "online", "away", "busy", "offline"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`
              flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105
              ${
                filter === status
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-green"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
              }
            `}
          >
            {status !== "all" && <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>}
            <span>{status === "all" ? "Todos" : status.charAt(0).toUpperCase() + status.slice(1)}</span>
            <span
              className={`
                text-sm px-3 py-1 rounded-full font-bold
                ${filter === status ? "bg-white/20 text-white" : "bg-white text-gray-600"}
              `}
            >
              {status === "all" ? users.length : statusStats[status as keyof typeof statusStats]}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
