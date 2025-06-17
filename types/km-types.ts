export interface PersonKmData {
    id: number
    code: string
    cedula: string
    name: string
    avatar: string
    department: string
    position: string
    monthlyData: MonthlyKmData[]
    totalProgrammed: number
    totalExecuted: number
    overallReliability: number
    trend: "up" | "down" | "stable"
    status: "excellent" | "good" | "warning" | "poor"
    lastUpdate: string
    performanceScore: number
  }
  
  export interface MonthlyKmData {
    month: string
    year: number
    programmed: number
    executed: number
    reliability: number
    days: number
  }
  
  export interface GlobalStats {
    totalProgrammed: number
    totalExecuted: number
    averageReliability: number
    totalPeople: number
    excellentPerformers: number
    goodPerformers: number
    needsAttention: number
    criticalPerformers: number
    topPerformer: PersonKmData
    lowestPerformer: PersonKmData
  }
  
  export type ViewMode = "global" | "individual" | "detailed"
  export type SortBy = "reliability" | "executed" | "name" | "performance"
  export type FilterBy = "all" | "excellent" | "good" | "warning" | "poor"
  export type SearchType = "name" | "code" | "cedula"
  