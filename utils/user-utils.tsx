import { Crown, Award, Star, UserPlus, User } from "lucide-react"
import type { ActiveUser, SortBy, SortOrder } from "@/types/user-types"

export const getStatusColor = (status: string) => {
  switch (status) {
    case "online":
      return "bg-primary-500"
    case "away":
      return "bg-yellow-500"
    case "busy":
      return "bg-red-500"
    case "offline":
      return "bg-gray-400"
    default:
      return "bg-gray-500"
  }
}

export const getRankColor = (rank: string) => {
  switch (rank) {
    case "Oro":
      return {
        bg: "from-yellow-400 to-yellow-600",
        text: "text-yellow-800",
        bgLight: "bg-yellow-50",
        border: "border-yellow-200",
      }
    case "Plata":
      return {
        bg: "from-gray-400 to-gray-600",
        text: "text-gray-800",
        bgLight: "bg-gray-50",
        border: "border-gray-200",
      }
    case "Bronce":
      return {
        bg: "from-amber-400 to-amber-600",
        text: "text-amber-800",
        bgLight: "bg-amber-50",
        border: "border-amber-200",
      }
    case "Mejorar":
      return {
        bg: "from-blue-400 to-blue-600",
        text: "text-blue-800",
        bgLight: "bg-blue-50",
        border: "border-blue-200",
      }
    case "Taller Conciencia":
      return {
        bg: "from-purple-400 to-purple-600",
        text: "text-purple-800",
        bgLight: "bg-purple-50",
        border: "border-purple-200",
      }
    default:
      return {
        bg: "from-gray-400 to-gray-600",
        text: "text-gray-800",
        bgLight: "bg-gray-50",
        border: "border-gray-200",
      }
  }
}

export const getRankIcon = (rank: string) => {
  switch (rank) {
    case "Oro":
      return <Crown className="w-5 h-5 text-yellow-500" />
    case "Plata":
      return <Award className="w-5 h-5 text-gray-400" />
    case "Bronce":
      return <Star className="w-5 h-5 text-amber-600" />
    case "Mejorar":
      return <UserPlus className="w-5 h-5 text-blue-500" />
    case "Taller Conciencia":
      return <User className="w-5 h-5 text-purple-500" />
    default:
      return <User className="w-5 h-5 text-gray-400" />
  }
}

export const sortUsers = (users: ActiveUser[], sortBy: SortBy, sortOrder: SortOrder): ActiveUser[] => {
  return [...users].sort((a, b) => {
    let aValue: string | number, bValue: string | number

    switch (sortBy) {
      case "name":
        aValue = a.name
        bValue = b.name
        break
      case "status":
        aValue = a.status
        bValue = b.status
        break
      case "zone":
        aValue = a.zone
        bValue = b.zone
        break
      case "rank":
        aValue = a.rank
        bValue = b.rank
        break
      case "productivity":
        aValue = a.productivity
        bValue = b.productivity
        break
      default:
        aValue = a.name
        bValue = b.name
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }
    return sortOrder === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
  })
}

export const filterUsers = (users: ActiveUser[], filter: string, searchQuery: string): ActiveUser[] => {
  return users
    .filter((user) => filter === "all" || user.status === filter)
    .filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.sponsor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.rank.toLowerCase().includes(searchQuery.toLowerCase()),
    )
}

export const getStatusStats = (users: ActiveUser[]) => {
  return {
    online: users.filter((u) => u.status === "online").length,
    away: users.filter((u) => u.status === "away").length,
    busy: users.filter((u) => u.status === "busy").length,
    offline: users.filter((u) => u.status === "offline").length,
  }
}

export const getRankStats = (users: ActiveUser[]) => {
  return {
    Oro: users.filter((u) => u.rank === "Oro").length,
    Plata: users.filter((u) => u.rank === "Plata").length,
    Bronce: users.filter((u) => u.rank === "Bronce").length,
    Mejorar: users.filter((u) => u.rank === "Mejorar").length,
    "Taller Conciencia": users.filter((u) => u.rank === "Taller Conciencia").length,
  }
}
