export interface ActiveUser {
    id: number
    name: string
    email: string
    phone: string
    status: "online" | "away" | "busy" | "offline"
    activity: string
    time: string
    avatar: string
    zone: string 
    sponsor: string 
    role: string 
    department: string
    activeTime: string 
    rank: "Oro" | "Plata" | "Bronce" | "Mejorar" | "Taller Conciencia" 
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
  
  export type ViewMode = "grid" | "list"
  export type SortBy = "name" | "status" | "zone" | "rank" | "productivity"
  export type SortOrder = "asc" | "desc"
  export type StatusFilter = "all" | "online" | "away" | "busy" | "offline"
  