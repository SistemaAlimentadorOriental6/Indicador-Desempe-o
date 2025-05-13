"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  BarChart3,
  Route,
  Award,
  User,
  Search,
  ChevronRight,
  Calendar,
  Filter,
  LogOut,
  Settings,
  Bell,
  ChevronDown,
  Activity,
  AlertTriangle,
  RefreshCw,
  PieChart,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import UserProfileViewer from "./user-profile-viewer"
import TopPerformersChart from "./top-performers-chart"
import UserActivityTimeline from "./user-activity-timeline"
import UserStatisticsGrid from "./user-statistics-grid"
import UsersList from "./users-list"
import KpiDashboard from "./enhanced-kpi-dashboard"

export default function AdminDashboard() {
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<any[]>([])
  const [userStats, setUserStats] = useState<any>({
    totalUsers: 0,
    activeUsers: 0,
    totalKilometers: 0,
    averageKilometers: 0,
  })
  const [topPerformers, setTopPerformers] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showMonthSelector, setShowMonthSelector] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const { logout } = useAuth()

  // Fetch user data on component mount
  useEffect(() => {
    setLoaded(true)
    fetchUserData()
  }, [selectedMonth, selectedYear])

  // Update the fetchUserData function to handle errors better
  const fetchUserData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch all users
      let usersData = { users: [] }
      try {
        console.log("Fetching users data...")
        const usersResponse = await fetch("/api/admin/users")
        if (usersResponse.ok) {
          usersData = await usersResponse.json()
          console.log("Users data fetched successfully")
        } else {
          const errorText = await usersResponse.text()
          console.error("Error fetching users:", errorText)
          setError("Error al cargar usuarios")
        }
      } catch (error) {
        console.error("Error fetching users:", error)
        setError("Error al cargar usuarios")
      }

      // Fetch statistics
      let statsData = { statistics: { totalUsers: 0, activeUsers: 0, totalKilometers: 0, averageKilometers: 0 } }
      try {
        const apiUrl = `/api/admin/statistics?month=${selectedMonth + 1}&year=${selectedYear}`
        console.log("Fetching statistics from:", apiUrl)

        const statsResponse = await fetch(apiUrl)
        console.log("Statistics response status:", statsResponse.status)

        if (statsResponse.ok) {
          statsData = await statsResponse.json()
          console.log("Statistics data fetched successfully:", statsData)
        } else {
          const errorText = await statsResponse.text()
          console.error("Error fetching statistics:", errorText)
          setError("Error al cargar estadísticas")
        }
      } catch (error) {
        console.error("Error fetching statistics:", error)
        setError("Error al cargar estadísticas")
      }

      // Fetch top performers
      let topData = { topPerformers: [] }
      try {
        console.log("Fetching top performers data...")
        const topResponse = await fetch(`/api/admin/top-performers?month=${selectedMonth + 1}&year=${selectedYear}`)
        if (topResponse.ok) {
          topData = await topResponse.json()
          console.log("Top performers data fetched successfully")
        } else {
          const errorText = await topResponse.text()
          console.error("Error fetching top performers:", errorText)
          setError("Error al cargar mejores rendimientos")
        }
      } catch (error) {
        console.error("Error fetching top performers:", error)
        setError("Error al cargar mejores rendimientos")
      }

      // Fetch recent activities
      let activitiesData = { activities: [] }
      try {
        console.log("Fetching recent activities data...")
        const activitiesResponse = await fetch(`/api/admin/recent-activities`)
        if (activitiesResponse.ok) {
          activitiesData = await activitiesResponse.json()
          console.log("Recent activities data fetched successfully")
        } else {
          const errorText = await activitiesResponse.text()
          console.error("Error fetching activities:", errorText)
          setError("Error al cargar actividades recientes")
        }
      } catch (error) {
        console.error("Error fetching activities:", error)
        setError("Error al cargar actividades recientes")
      }

      // Set the data
      setUserData(usersData.users || [])
      setUserStats(statsData.statistics || { totalUsers: 0, activeUsers: 0, totalKilometers: 0, averageKilometers: 0 })
      setTopPerformers(topData.topPerformers || [])
      setRecentActivities(activitiesData.activities || [])
    } catch (error) {
      console.error("Error fetching user data:", error)
      setError("Error al cargar datos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserSelect = (user: any) => {
    setSelectedUser(user)
    setShowUserProfile(true)
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month)
    setShowMonthSelector(false)
  }

  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  }

  // Animated particles for background effects
  const particles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 15 + Math.random() * 30,
    delay: Math.random() * 5,
  }))

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-green-900/5 via-emerald-50/40 to-white">
      {/* Enhanced background design */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-green-600/20 to-emerald-400/20 -z-10"></div>
      <div className="absolute top-12 right-12 w-40 h-40 rounded-full bg-green-300/10 blur-3xl -z-10"></div>
      <div className="absolute bottom-32 left-8 w-80 h-80 rounded-full bg-emerald-200/20 blur-3xl -z-10"></div>

      {/* Animated particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-green-200/30 -z-10"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Number.POSITIVE_INFINITY,
            delay: particle.delay,
          }}
        />
      ))}

      <div className="w-full mx-auto px-4 sm:px-6 py-8 relative z-0 lg:max-w-none lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="hidden lg:block lg:col-span-3 xl:col-span-3"
          >
            <div className="sticky top-8">
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-green-100 mb-6">
                {/* Admin header */}
                <div className="bg-gradient-to-r from-green-700 to-green-600 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-md"></div>
                  <div className="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full animate-pulse"></div>

                  <div className="flex items-center justify-center mb-4 relative z-10">
                    <div className="relative group">
                      <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-emerald-300 blur-md opacity-70 scale-110"
                        animate={{
                          scale: [1.1, 1.2, 1.1],
                          opacity: [0.7, 0.8, 0.7],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatType: "reverse",
                        }}
                      ></motion.div>
                      <div className="h-24 w-24 rounded-full border-4 border-white overflow-hidden shadow-lg relative z-10">
                        <div className="h-full w-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                          <Users className="h-12 w-12 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center relative z-10">
                    <h2 className="text-xl font-bold text-white">Administrador</h2>
                    <p className="text-green-50/90 text-sm mt-1">Panel de Control</p>

                    <div className="flex justify-center mt-3">
                      <div className="bg-white/20 py-1 px-3 rounded-full backdrop-blur-sm inline-flex items-center">
                        <Settings className="w-3.5 h-3.5 mr-1 text-white" />
                        <span className="text-xs text-white font-medium">Acceso Total</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar navigation */}
                <div className="p-4">
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar usuario..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <nav className="space-y-1 mb-6">
                    <motion.button
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab("dashboard")}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl ${
                        activeTab === "dashboard"
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          : "text-gray-700 hover:bg-green-50"
                      }`}
                    >
                      <BarChart3
                        className={`mr-3 h-5 w-5 ${activeTab === "dashboard" ? "text-white" : "text-green-500"}`}
                      />
                      Dashboard
                      {activeTab === "dashboard" && (
                        <div className="ml-auto bg-white/20 rounded-full h-5 w-5 flex items-center justify-center">
                          <ChevronRight className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab("kpi")}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl ${
                        activeTab === "kpi"
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          : "text-gray-700 hover:bg-green-50"
                      }`}
                    >
                      <PieChart className={`mr-3 h-5 w-5 ${activeTab === "kpi" ? "text-white" : "text-green-500"}`} />
                      KPI Kilómetros
                      {activeTab === "kpi" && (
                        <div className="ml-auto bg-white/20 rounded-full h-5 w-5 flex items-center justify-center">
                          <ChevronRight className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab("users")}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl ${
                        activeTab === "users"
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          : "text-gray-700 hover:bg-green-50"
                      }`}
                    >
                      <Users className={`mr-3 h-5 w-5 ${activeTab === "users" ? "text-white" : "text-green-500"}`} />
                      Usuarios
                      {activeTab === "users" && (
                        <div className="ml-auto bg-white/20 rounded-full h-5 w-5 flex items-center justify-center">
                          <ChevronRight className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab("statistics")}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl ${
                        activeTab === "statistics"
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          : "text-gray-700 hover:bg-green-50"
                      }`}
                    >
                      <Activity
                        className={`mr-3 h-5 w-5 ${activeTab === "statistics" ? "text-white" : "text-green-500"}`}
                      />
                      Estadísticas
                      {activeTab === "statistics" && (
                        <div className="ml-auto bg-white/20 rounded-full h-5 w-5 flex items-center justify-center">
                          <ChevronRight className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab("settings")}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl ${
                        activeTab === "settings"
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          : "text-gray-700 hover:bg-green-50"
                      }`}
                    >
                      <Settings
                        className={`mr-3 h-5 w-5 ${activeTab === "settings" ? "text-white" : "text-green-500"}`}
                      />
                      Configuración
                      {activeTab === "settings" && (
                        <div className="ml-auto bg-white/20 rounded-full h-5 w-5 flex items-center justify-center">
                          <ChevronRight className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </motion.button>
                  </nav>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Usuarios</h3>
                    <UsersList
                      users={userData}
                      searchQuery={searchQuery}
                      onUserSelect={handleUserSelect}
                      isLoading={isLoading}
                    />
                  </div>

                  {/* Logout button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="w-full mt-6 py-2.5 flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-medium transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main content area */}
          <div className="lg:col-span-9 xl:col-span-9">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden mb-8 border border-green-100"
              >
                <div className="bg-gradient-to-r from-green-700 to-green-600 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-md"></div>
                  <div className="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full animate-pulse"></div>

                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <div className="flex items-center">
                        <div className="h-1 w-6 bg-white rounded-full mr-2"></div>
                        <h2 className="text-white font-bold text-2xl">Panel de Administración</h2>
                      </div>
                      <p className="text-green-50/90 mt-2 font-light">
                        Monitoreo y gestión de usuarios del Sistema SAO6
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <button
                          onClick={() => setShowMonthSelector(!showMonthSelector)}
                          className="bg-white/20 py-1.5 px-3 rounded-lg backdrop-blur-sm text-white text-sm flex items-center"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            {months[selectedMonth]} {selectedYear}
                          </span>
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </button>

                        {showMonthSelector && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-lg border border-gray-100 p-3 z-20 w-64"
                          >
                            <div className="grid grid-cols-3 gap-2">
                              {months.map((month, index) => (
                                <button
                                  key={month}
                                  onClick={() => handleMonthChange(index)}
                                  className={`text-sm py-1.5 px-2 rounded-lg ${
                                    selectedMonth === index
                                      ? "bg-green-100 text-green-700 font-medium"
                                      : "hover:bg-gray-100"
                                  }`}
                                >
                                  {month}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.3)" }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white/20 p-2 rounded-xl backdrop-blur-md border border-white/10 relative"
                      >
                        <Bell className="h-5 w-5 text-white" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                          3
                        </span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.3)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLogout}
                        className="bg-white/20 p-2 rounded-xl backdrop-blur-md border border-white/10"
                      >
                        <LogOut className="h-5 w-5 text-white" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                      <p className="text-red-700">{error}</p>
                    </div>
                    <button
                      onClick={fetchUserData}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium flex items-center"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Reintentar
                    </button>
                  </div>
                )}

                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm transition-all group hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-400/10 p-2.5 rounded-xl">
                          <Users className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Total Usuarios</p>
                          {isLoading ? (
                            <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                          ) : (
                            <p className="text-gray-800 font-bold text-xl">{userStats.totalUsers}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm transition-all group hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-400/10 p-2.5 rounded-xl">
                          <Route className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Total Kilómetros</p>
                          {isLoading ? (
                            <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                          ) : (
                            <p className="text-gray-800 font-bold text-xl">
                              {userStats.totalKilometers.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm transition-all group hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-400/10 p-2.5 rounded-xl">
                          <Activity className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Promedio Km</p>
                          {isLoading ? (
                            <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                          ) : (
                            <p className="text-gray-800 font-bold text-xl">{userStats.averageKilometers.toFixed(1)}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-4 rounded-2xl border border-green-100/40 shadow-sm transition-all group hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-400/10 p-2.5 rounded-xl">
                          <Award className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Usuarios Activos</p>
                          {isLoading ? (
                            <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                          ) : (
                            <p className="text-gray-800 font-bold text-xl">{userStats.activeUsers}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Main content based on active tab */}
              <AnimatePresence mode="wait">
                {activeTab === "dashboard" && !showUserProfile && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                      {/* Top Performers Chart */}
                      <div className="lg:col-span-2">
                        <TopPerformersChart
                          data={topPerformers}
                          isLoading={isLoading}
                          month={months[selectedMonth]}
                          year={selectedYear}
                          onUserSelect={handleUserSelect}
                        />
                      </div>

                      {/* Recent Activity Timeline */}
                      <div className="lg:col-span-1">
                        <UserActivityTimeline
                          activities={recentActivities}
                          isLoading={isLoading}
                          onUserSelect={handleUserSelect}
                        />
                      </div>
                    </div>

                    {/* User Statistics Grid */}
                    <UserStatisticsGrid
                      users={userData}
                      isLoading={isLoading}
                      onUserSelect={handleUserSelect}
                      month={months[selectedMonth]}
                      year={selectedYear}
                    />
                  </motion.div>
                )}

                {activeTab === "kpi" && !showUserProfile && (
                  <motion.div
                    key="kpi"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <KpiDashboard users={userData} isLoading={isLoading} />
                  </motion.div>
                )}

                {activeTab === "users" && !showUserProfile && (
                  <motion.div
                    key="users"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-green-100 p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-green-600" />
                        Gestión de Usuarios
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Buscar usuario..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1">
                          <span>Filtrar</span>
                          <Filter className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500">Cargando usuarios...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Usuario
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Cédula
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Rol
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Teléfono
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Kilómetros
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {userData
                              .filter(
                                (user) =>
                                  user.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  user.cedula.toString().includes(searchQuery),
                              )
                              .map((user) => (
                                <tr key={user.codigo} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                          <User className="h-5 w-5 text-green-600" />
                                        </div>
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
                                        <div className="text-sm text-gray-500">{user.codigo}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{user.cedula}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{user.rol}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{user.telefono}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {user.kilometros ? user.kilometros.toLocaleString() : "0"} km
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                      onClick={() => handleUserSelect(user)}
                                      className="text-green-600 hover:text-green-900 mr-3"
                                    >
                                      Ver perfil
                                    </button>
                                    <button className="text-blue-600 hover:text-blue-900 mr-3">Editar</button>
                                    <button className="text-red-600 hover:text-red-900">Desactivar</button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "statistics" && !showUserProfile && (
                  <motion.div
                    key="statistics"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-green-100 p-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-6">
                      <Activity className="h-5 w-5 mr-2 text-green-600" />
                      Estadísticas Detalladas
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-5 rounded-2xl border border-green-100/40 shadow-sm">
                        <h4 className="text-lg font-medium text-gray-800 mb-4">Distribución de Kilómetros</h4>
                        {isLoading ? (
                          <div className="h-64 flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <div className="h-64">
                            {/* Placeholder for chart - would be implemented with a real chart library */}
                            <div className="h-full w-full bg-white rounded-xl flex items-center justify-center">
                              <p className="text-gray-500">Gráfico de distribución de kilómetros</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-5 rounded-2xl border border-green-100/40 shadow-sm">
                        <h4 className="text-lg font-medium text-gray-800 mb-4">Actividad por Día</h4>
                        {isLoading ? (
                          <div className="h-64 flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <div className="h-64">
                            {/* Placeholder for chart - would be implemented with a real chart library */}
                            <div className="h-full w-full bg-white rounded-xl flex items-center justify-center">
                              <p className="text-gray-500">Gráfico de actividad diaria</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-5 rounded-2xl border border-green-100/40 shadow-sm">
                        <h4 className="text-lg font-medium text-gray-800 mb-4">Progreso Mensual</h4>
                        {isLoading ? (
                          <div className="h-64 flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <div className="h-64">
                            {/* Placeholder for chart - would be implemented with a real chart library */}
                            <div className="h-full w-full bg-white rounded-xl flex items-center justify-center">
                              <p className="text-gray-500">Gráfico de progreso mensual</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-5 rounded-2xl border border-green-100/40 shadow-sm">
                        <h4 className="text-lg font-medium text-gray-800 mb-4">Distribución por Rol</h4>
                        {isLoading ? (
                          <div className="h-64 flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <div className="h-64">
                            {/* Placeholder for chart - would be implemented with a real chart library */}
                            <div className="h-full w-full bg-white rounded-xl flex items-center justify-center">
                              <p className="text-gray-500">Gráfico de distribución por rol</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "settings" && !showUserProfile && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-green-100 p-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-6">
                      <Settings className="h-5 w-5 mr-2 text-green-600" />
                      Configuración del Sistema
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-5 rounded-2xl border border-green-100/40 shadow-sm">
                        <h4 className="text-lg font-medium text-gray-800 mb-4">Configuración General</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Sistema</label>
                            <input
                              type="text"
                              defaultValue="Sistema SAO6"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contacto</label>
                            <input
                              type="email"
                              defaultValue="admin@sao6.com"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Zona Horaria</label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                              <option>América/Bogotá</option>
                              <option>América/Mexico_City</option>
                              <option>América/Lima</option>
                              <option>América/Santiago</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100/40 p-5 rounded-2xl border border-green-100/40 shadow-sm">
                        <h4 className="text-lg font-medium text-gray-800 mb-4">Notificaciones</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Notificaciones por Email</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Notificaciones Push</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Resumen Diario</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* User Profile Viewer */}
                {showUserProfile && (
                  <motion.div
                    key="user-profile"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center mb-6">
                      <button
                        onClick={() => setShowUserProfile(false)}
                        className="mr-4 p-2 bg-white rounded-xl shadow-sm hover:bg-gray-50"
                      >
                        <svg
                          className="h-5 w-5 text-gray-600"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h3 className="text-xl font-semibold text-gray-800">Perfil de {selectedUser?.nombre}</h3>
                    </div>

                    <UserProfileViewer user={selectedUser} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
