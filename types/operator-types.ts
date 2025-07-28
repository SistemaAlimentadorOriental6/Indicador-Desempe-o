export interface Operator {
    id: number
    codigo: string
    name: string
    cedula?: string
    document?: string
    avatar?: string
    position?: string
    phone?: string
    zona?: string | null
    padrino?: string | null
    tarea?: string | null
    joinDate: string | null
    retirementDate?: string | null
    birthDate?: string | null
    bonus?: {
      percentage: number
      total: number
      category: "Oro" | "Plata" | "Bronce" | "Mejorar" | "Taller Conciencia" | "Revisar"
      trend: "up" | "down" | "stable"
      date: string | null
    }
    km?: {
      percentage: number
      total?: number
      total_programado?: number
      total_ejecutado?: number
      category: "Oro" | "Plata" | "Bronce" | "Mejorar" | "Taller Conciencia" | "Revisar"
      trend: "up" | "down" | "stable"
      date: string | null
    }
    efficiency: number
    category: "Oro" | "Plata" | "Bronce" | "Mejorar" | "Taller Conciencia" | "Revisar"
    rank: number
    weeklyPerformance?: number[]
    department?: string
    monthlyGoal?: number
    lastUpdate?: string
    trend?: "up" | "down" | "stable"
    streak: number
    consistency?: number
    achievements?: string[]
    profileImage?: string
    // Información sobre el filtro de tiempo activo para este operador
    timeFilter?: {
      type: TimeFilterType
      value?: string | number | null
    }
  }
  
  export type FilterType = "all" | "Oro" | "Plata" | "Bronce" | "Mejorar" | "Taller Conciencia" | "Revisar"
  export type SortType = "rank" | "bonus" | "km" | "efficiency"
  export type ViewMode = "grid" | "list"
  export type SortOrder = "asc" | "desc"
  export type TimeFilterType = "global" | "year" | "month"
  // Alias de TimeFilterType para mantener compatibilidad con componentes existentes
  export type TimeFilterOption = TimeFilterType;
  export type TimeFilter = {
    type: TimeFilterType;
    value?: string | number;
  }
  
  export interface CategoryStats {
    [key: string]: number
  }
  
  export interface CategoryColors {
    bg: string
    text: string
    border: string
    bgLight: string
    shadow: string
    ring: string
  }
  