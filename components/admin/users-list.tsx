"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { User, Search } from 'lucide-react'

interface UsersListProps {
  users: any[]
  searchQuery: string
  onUserSelect: (user: any) => void
  isLoading: boolean
}

export default function UsersList({ users, searchQuery, onUserSelect, isLoading }: UsersListProps) {
  const [hoveredUser, setHoveredUser] = useState<string | null>(null)

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.cedula.toString().includes(searchQuery)
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((_, index) => (
          <div key={index} className="animate-pulse flex items-center p-2 rounded-xl">
            <div className="h-10 w-10 rounded-full bg-gray-200"></div>
            <div className="ml-3 space-y-1 flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (filteredUsers.length === 0) {
    return (
      <div className="text-center py-6">
        <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No se encontraron usuarios</p>
        <p className="text-gray-400 text-sm">Intenta con otra búsqueda</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {filteredUsers.map((user) => (
        <motion.div
          key={user.codigo}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, backgroundColor: "rgba(16, 185, 129, 0.05)" }}
          whileTap={{ scale: 0.98 }}
          onMouseEnter={() => setHoveredUser(user.codigo)}
          onMouseLeave={() => setHoveredUser(null)}
          onClick={() => onUserSelect(user)}
          className={`flex items-center p-2 rounded-xl cursor-pointer transition-colors ${
            hoveredUser === user.codigo ? "bg-green-50" : ""
          }`}
        >
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <User className="h-5 w-5 text-green-600" />
            </div>
            {user.online && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
            )}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user.nombre}</p>
            <p className="text-xs text-gray-500 truncate">
              {user.rol} • {user.cedula}
            </p>
          </div>
          {user.kilometros && (
            <div className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {user.kilometros} km
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
