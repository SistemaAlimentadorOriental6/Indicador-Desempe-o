// Tipos para los datos de usuario
export interface UserData {
    id: string
    nombre?: string
    cedula?: string
    role?: string
    kilometros?: number
    bonos?: number
    ultimaActividad?: string
    [key: string]: any
  }
  
  // Tipos para los datos de gráficos
  export interface ChartData {
    name: string
    value: number
    [key: string]: any
  }
  
  // Tipos para los datos mensuales
  export interface MonthlyData {
    month: string
    value: number
    [key: string]: any
  }
  
  // Tipo para los kilómetros por mes
  export interface KilometersByMonth {
    month: string
    kilometers: number
    users: number
    average: number
  }
  
  // Tipos para los datos KPI
  export interface KpiData {
    totalKilometers: number
    averageKilometers: number
    userCount: number
    trend: number
    topPerformer: UserData | null
    monthlyData: MonthlyData[]
    kilometersPerRole: ChartData[]
  }
  
  // Tipos para las opciones de filtro
  export interface FilterOptions {
    year: number
    month: number | null
    role: string | null
    minKm: number | null
    maxKm: number | null
  }
  
// User data types
export interface User {
  id?: string
  nombre?: string
  codigo?: string
  cedula?: string
  rol?: string
}

// Health metrics
export interface HealthMetrics {
  heartRate: number
  sleep: number
  stress: number
  hydration: number
}

// Achievement type
export interface Achievement {
  id: number
  title: string
  description: string
  icon: any
  date: string
  xp: number
}

// Activity type
export interface Activity {
  id: number
  day: string
  month: string
  title: string
  time: string
  dayOfWeek: string
  distance: string
  location: string
  participants: number
  image: string
  difficulty: string
  elevation: string
  terrain: string
}
