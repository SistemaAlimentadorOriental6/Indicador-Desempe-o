import type React from "react"
import {
  Crown,
  Medal,
  Award,
  AlertCircle,
  Search,
  TrendingUp,
  Sparkles,
  Target,
  Zap,
  Star,
  Trophy,
  Shield,
  Flame,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus,
  Activity,
} from "lucide-react"
import type { Operator, CategoryColors, CategoryStats, FilterType, SortType, SortOrder } from "../types/operator-types"

// ============================================================================
// ENHANCED CATEGORY SYSTEM
// ============================================================================

export const CATEGORY_SYSTEM = {
  Oro: {
    icon: Crown,
    secondaryIcon: Sparkles,
    emoji: "👑",
    label: "Oro",
    shortLabel: "ORO",
    description: "Rendimiento excepcional",
    priority: 1,
    tier: "premium",
    achievement: "Líder destacado",
    minScore: 90,
    gradient: "from-yellow-300 via-yellow-400 to-amber-500",
    glowColor: "yellow-400",
    particleColor: "yellow-300",
  },
  Plata: {
    icon: Medal,
    secondaryIcon: Star,
    emoji: "🥈",
    label: "Plata",
    shortLabel: "PLT",
    description: "Rendimiento sobresaliente",
    priority: 2,
    tier: "high",
    achievement: "Excelente desempeño",
    minScore: 75,
    gradient: "from-slate-300 via-slate-400 to-gray-500",
    glowColor: "slate-400",
    particleColor: "slate-300",
  },
  Bronce: {
    icon: Award,
    secondaryIcon: Trophy,
    emoji: "🥉",
    label: "Bronce",
    shortLabel: "BRZ",
    description: "Rendimiento sólido",
    priority: 3,
    tier: "medium",
    achievement: "Buen rendimiento",
    minScore: 60,
    gradient: "from-amber-400 via-orange-400 to-amber-600",
    glowColor: "amber-400",
    particleColor: "amber-300",
  },
  Mejorar: {
    icon: TrendingUp,
    secondaryIcon: Target,
    emoji: "📈",
    label: "Mejorar",
    shortLabel: "MEJ",
    description: "En proceso de mejora",
    priority: 4,
    tier: "attention",
    achievement: "Potencial de crecimiento",
    minScore: 40,
    gradient: "from-orange-400 via-red-400 to-pink-500",
    glowColor: "orange-400",
    particleColor: "orange-300",
  },
  "Taller Conciencia": {
    icon: AlertCircle,
    secondaryIcon: Flame,
    emoji: "⚠️",
    label: "Taller Conciencia",
    shortLabel: "TCN",
    description: "Requiere atención urgente",
    priority: 5,
    tier: "critical",
    achievement: "Necesita apoyo",
    minScore: 0,
    gradient: "from-red-500 via-red-600 to-rose-700",
    glowColor: "red-500",
    particleColor: "red-400",
  },
} as const

// ============================================================================
// ADVANCED VISUAL COMPONENTS
// ============================================================================

/**
 * Componente de icono de categoría con efectos avanzados
 */
export const CategoryIcon: React.FC<{
  category: string
  size?: "sm" | "md" | "lg" | "xl"
  showGlow?: boolean
  showParticles?: boolean
  animated?: boolean
}> = ({ category, size = "md", showGlow = false, showParticles = false, animated = false }) => {
  const config = CATEGORY_SYSTEM[category as keyof typeof CATEGORY_SYSTEM]

  if (!config) {
    return <Award className="w-5 h-5 text-gray-400" />
  }

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  }

  const IconComponent = config.icon
  const SecondaryIcon = config.secondaryIcon
  const colors = getAdvancedCategoryColors(category)

  return (
    <div className={`relative inline-flex items-center justify-center ${animated ? "group" : ""}`}>
      {/* Glow effect */}
      {showGlow && (
        <div
          className={`absolute inset-0 bg-${config.glowColor} rounded-full opacity-20 blur-md ${animated ? "group-hover:opacity-40 transition-opacity duration-300" : ""}`}
        />
      )}

      {/* Main icon */}
      <div className={`relative z-10 ${animated ? "group-hover:scale-110 transition-transform duration-200" : ""}`}>
        <IconComponent className={`${sizeClasses[size]} ${colors.iconColor}`} />

        {/* Secondary icon overlay for premium categories */}
        {(category === "Oro" || category === "Plata") && (
          <SecondaryIcon
            className={`absolute -top-1 -right-1 w-2 h-2 ${colors.accentColor} ${animated ? "animate-pulse" : ""}`}
          />
        )}
      </div>

      {/* Particle effects */}
      {showParticles && category === "Oro" && (
        <>
          <div className="absolute -top-1 -left-1 w-1 h-1 bg-yellow-300 rounded-full animate-ping" />
          <div className="absolute -bottom-1 -right-1 w-1 h-1 bg-yellow-400 rounded-full animate-ping animation-delay-150" />
          <div className="absolute top-0 right-0 w-0.5 h-0.5 bg-yellow-200 rounded-full animate-pulse animation-delay-300" />
        </>
      )}
    </div>
  )
}

/**
 * Badge de categoría con diseño premium
 */
export const CategoryBadge: React.FC<{
  category: string
  variant?: "default" | "compact" | "detailed" | "minimal"
  showIcon?: boolean
  showDescription?: boolean
  interactive?: boolean
}> = ({ category, variant = "default", showIcon = true, showDescription = false, interactive = false }) => {
  const config = CATEGORY_SYSTEM[category as keyof typeof CATEGORY_SYSTEM]
  const colors = getAdvancedCategoryColors(category)

  if (!config) return null

  const baseClasses = `
    inline-flex items-center gap-2 font-medium rounded-xl border-2 transition-all duration-200
    ${colors.badgeBackground} ${colors.badgeText} ${colors.badgeBorder}
    ${interactive ? `${colors.hoverBackground} cursor-pointer transform hover:scale-105 hover:shadow-lg` : ""}
  `

  const variantClasses = {
    default: "px-3 py-1.5 text-sm",
    compact: "px-2 py-1 text-xs",
    detailed: "px-4 py-2 text-sm",
    minimal: "px-2 py-0.5 text-xs",
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`}>
      {showIcon && (
        <CategoryIcon
          category={category}
          size={variant === "compact" || variant === "minimal" ? "sm" : "md"}
          animated={interactive}
        />
      )}

      <div className="flex flex-col">
        <span className="font-semibold">
          {variant === "compact" || variant === "minimal" ? config.shortLabel : config.label}
        </span>

        {showDescription && variant === "detailed" && (
          <span className={`text-xs opacity-80 ${colors.mutedText}`}>{config.description}</span>
        )}
      </div>

      {variant === "detailed" && (
        <div className={`ml-auto text-xs font-bold ${colors.accentColor}`}>{config.emoji}</div>
      )}
    </div>
  )
}

// ============================================================================
// ENHANCED COLOR SYSTEM
// ============================================================================

/**
 * Sistema de colores avanzado con más opciones
 */
export const getAdvancedCategoryColors = (category: string) => {
  const config = CATEGORY_SYSTEM[category as keyof typeof CATEGORY_SYSTEM]

  if (!config) {
    return {
      gradient: "from-gray-400 to-gray-600",
      iconColor: "text-gray-600",
      badgeBackground: "bg-gray-100",
      badgeText: "text-gray-800",
      badgeBorder: "border-gray-300",
      hoverBackground: "hover:bg-gray-200",
      accentColor: "text-gray-500",
      mutedText: "text-gray-600",
      glowColor: "shadow-gray-200/50",
    }
  }

  switch (category) {
    case "Oro":
      return {
        gradient: `bg-gradient-to-r ${config.gradient}`,
        iconColor: "text-yellow-600",
        badgeBackground: "bg-gradient-to-r from-yellow-50 to-amber-50",
        badgeText: "text-yellow-900",
        badgeBorder: "border-yellow-300",
        hoverBackground: "hover:from-yellow-100 hover:to-amber-100",
        accentColor: "text-yellow-600",
        mutedText: "text-yellow-700",
        glowColor: "shadow-yellow-300/60",
      }
    case "Plata":
      return {
        gradient: `bg-gradient-to-r ${config.gradient}`,
        iconColor: "text-slate-600",
        badgeBackground: "bg-gradient-to-r from-slate-50 to-gray-50",
        badgeText: "text-slate-900",
        badgeBorder: "border-slate-300",
        hoverBackground: "hover:from-slate-100 hover:to-gray-100",
        accentColor: "text-slate-600",
        mutedText: "text-slate-700",
        glowColor: "shadow-slate-300/60",
      }
    case "Bronce":
      return {
        gradient: `bg-gradient-to-r ${config.gradient}`,
        iconColor: "text-amber-600",
        badgeBackground: "bg-gradient-to-r from-amber-50 to-orange-50",
        badgeText: "text-amber-900",
        badgeBorder: "border-amber-300",
        hoverBackground: "hover:from-amber-100 hover:to-orange-100",
        accentColor: "text-amber-600",
        mutedText: "text-amber-700",
        glowColor: "shadow-amber-300/60",
      }
    case "Mejorar":
      return {
        gradient: `bg-gradient-to-r ${config.gradient}`,
        iconColor: "text-orange-600",
        badgeBackground: "bg-gradient-to-r from-orange-50 to-red-50",
        badgeText: "text-orange-900",
        badgeBorder: "border-orange-300",
        hoverBackground: "hover:from-orange-100 hover:to-red-100",
        accentColor: "text-orange-600",
        mutedText: "text-orange-700",
        glowColor: "shadow-orange-300/60",
      }
    case "Taller Conciencia":
      return {
        gradient: `bg-gradient-to-r ${config.gradient}`,
        iconColor: "text-red-600",
        badgeBackground: "bg-gradient-to-r from-red-50 to-rose-50",
        badgeText: "text-red-900",
        badgeBorder: "border-red-300",
        hoverBackground: "hover:from-red-100 hover:to-rose-100",
        accentColor: "text-red-600",
        mutedText: "text-red-700",
        glowColor: "shadow-red-300/60",
      }
    default:
      return {
        gradient: "bg-gradient-to-r from-gray-400 to-gray-600",
        iconColor: "text-gray-600",
        badgeBackground: "bg-gray-100",
        badgeText: "text-gray-800",
        badgeBorder: "border-gray-300",
        hoverBackground: "hover:bg-gray-200",
        accentColor: "text-gray-500",
        mutedText: "text-gray-600",
        glowColor: "shadow-gray-200/50",
      }
  }
}

// ============================================================================
// ADVANCED TREND SYSTEM
// ============================================================================

/**
 * Componente de indicador de tendencia avanzado
 */
export const TrendIndicator: React.FC<{
  trend: "up" | "down" | "stable" | "volatile"
  value?: number
  showValue?: boolean
  size?: "sm" | "md" | "lg"
  animated?: boolean
}> = ({ trend, value, showValue = false, size = "md", animated = true }) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }

  const containerSize = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  }

  const getTrendConfig = () => {
    switch (trend) {
      case "up":
        return {
          icon: ArrowUp,
          color: "text-emerald-600",
          bgColor: "bg-emerald-100",
          borderColor: "border-emerald-300",
          glowColor: "shadow-emerald-200/60",
          animation: animated ? "animate-bounce" : "",
        }
      case "down":
        return {
          icon: ArrowDown,
          color: "text-red-600",
          bgColor: "bg-red-100",
          borderColor: "border-red-300",
          glowColor: "shadow-red-200/60",
          animation: animated ? "animate-pulse" : "",
        }
      case "stable":
        return {
          icon: Minus,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          borderColor: "border-blue-300",
          glowColor: "shadow-blue-200/60",
          animation: "",
        }
      case "volatile":
        return {
          icon: Activity,
          color: "text-purple-600",
          bgColor: "bg-purple-100",
          borderColor: "border-purple-300",
          glowColor: "shadow-purple-200/60",
          animation: animated ? "animate-ping" : "",
        }
      default:
        return {
          icon: Minus,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          borderColor: "border-gray-300",
          glowColor: "shadow-gray-200/60",
          animation: "",
        }
    }
  }

  const config = getTrendConfig()
  const IconComponent = config.icon

  return (
    <div className={`relative inline-flex items-center gap-2`}>
      <div
        className={`
          ${containerSize[size]} rounded-full border-2 flex items-center justify-center
          ${config.bgColor} ${config.borderColor} ${config.glowColor} shadow-md
          ${animated ? "hover:scale-110 transition-transform duration-200" : ""}
        `}
      >
        <IconComponent className={`${sizeClasses[size]} ${config.color} ${config.animation}`} />
      </div>

      {showValue && value !== undefined && (
        <span className={`text-sm font-semibold ${config.color}`}>
          {trend === "up" ? "+" : trend === "down" ? "-" : ""}
          {Math.abs(value)}%
        </span>
      )}
    </div>
  )
}

// ============================================================================
// ENHANCED RANKING SYSTEM
// ============================================================================

/**
 * Componente de ranking con diseño premium
 */
export const RankingBadge: React.FC<{
  rank: number
  total?: number
  showPosition?: boolean
  variant?: "default" | "compact" | "detailed"
  animated?: boolean
}> = ({ rank, total, showPosition = true, variant = "default", animated = true }) => {
  const getRankTier = (rank: number) => {
    if (rank === 1) return "champion"
    if (rank === 2) return "runner-up"
    if (rank === 3) return "third"
    if (rank <= 10) return "top-ten"
    if (rank <= 25) return "top-quarter"
    return "standard"
  }

  const getRankConfig = (tier: string) => {
    switch (tier) {
      case "champion":
        return {
          icon: Crown,
          gradient: "from-yellow-400 via-yellow-500 to-amber-600",
          textColor: "text-yellow-900",
          glowColor: "shadow-yellow-300/80",
          borderColor: "border-yellow-400",
          label: "Campeón",
        }
      case "runner-up":
        return {
          icon: Medal,
          gradient: "from-slate-400 via-slate-500 to-gray-600",
          textColor: "text-slate-900",
          glowColor: "shadow-slate-300/80",
          borderColor: "border-slate-400",
          label: "Subcampeón",
        }
      case "third":
        return {
          icon: Award,
          gradient: "from-amber-400 via-orange-500 to-amber-600",
          textColor: "text-amber-900",
          glowColor: "shadow-amber-300/80",
          borderColor: "border-amber-400",
          label: "Tercer lugar",
        }
      case "top-ten":
        return {
          icon: Target,
          gradient: "from-emerald-400 to-emerald-600",
          textColor: "text-emerald-900",
          glowColor: "shadow-emerald-300/60",
          borderColor: "border-emerald-400",
          label: "Top 10",
        }
      case "top-quarter":
        return {
          icon: Zap,
          gradient: "from-blue-400 to-blue-600",
          textColor: "text-blue-900",
          glowColor: "shadow-blue-300/60",
          borderColor: "border-blue-400",
          label: "Top 25",
        }
      default:
        return {
          icon: Shield,
          gradient: "from-gray-300 to-gray-500",
          textColor: "text-gray-800",
          glowColor: "shadow-gray-300/40",
          borderColor: "border-gray-400",
          label: "Participante",
        }
    }
  }

  const tier = getRankTier(rank)
  const config = getRankConfig(tier)
  const IconComponent = config.icon

  const variantClasses = {
    default: "px-3 py-2",
    compact: "px-2 py-1",
    detailed: "px-4 py-3",
  }

  return (
    <div
      className={`
        inline-flex items-center gap-2 rounded-xl border-2 font-bold
        bg-gradient-to-r ${config.gradient} ${config.textColor} ${config.borderColor}
        ${config.glowColor} shadow-lg ${variantClasses[variant]}
        ${animated ? "hover:scale-105 transition-all duration-200" : ""}
      `}
    >
      <IconComponent className="w-4 h-4 text-white" />

      <div className="flex flex-col items-center">
        <span className="text-white font-black">#{rank}</span>
        {variant === "detailed" && total && <span className="text-xs text-white/80">de {total}</span>}
      </div>

      {variant === "detailed" && <div className="ml-2 text-xs text-white/90 font-medium">{config.label}</div>}
    </div>
  )
}

// ============================================================================
// ENHANCED STATISTICS
// ============================================================================

/**
 * Calcula estadísticas avanzadas con métricas adicionales
 */
export const calculateAdvancedStats = (operators: Operator[]) => {
  const basicStats = calculateCategoryStats(operators)
  const total = operators.length

  return {
    ...basicStats,
    total,
    distribution: Object.entries(basicStats).map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      config: CATEGORY_SYSTEM[category as keyof typeof CATEGORY_SYSTEM],
    })),
    topPerformers: operators.filter((op) => ["Oro", "Plata", "Bronce"].includes(op.category)).length,
    needsAttention: operators.filter((op) => ["Taller Conciencia", "Mejorar"].includes(op.category)).length,
    averageRank: total > 0 ? Math.round(operators.reduce((sum, op) => sum + (op.rank || 0), 0) / total) : 0,
  }
}

// ============================================================================
// LEGACY COMPATIBILITY (mantener funciones originales)
// ============================================================================

export const getCategoryIcon = (category: string, className = "w-5 h-5") => {
  return <CategoryIcon category={category} size="md" />
}

export const getCategoryColor = (category: string): CategoryColors => {
  const colors = getAdvancedCategoryColors(category)
  return {
    bg: colors.gradient.replace("bg-gradient-to-r ", ""),
    text: colors.badgeText,
    border: colors.badgeBorder.replace("border-", ""),
    bgLight: colors.badgeBackground.replace("bg-gradient-to-r ", ""),
    shadow: colors.glowColor,
    ring: colors.badgeBorder.replace("border-", "ring-"),
  }
}

export const getTrendIcon = (trend: string, className = "w-4 h-4") => {
  return <TrendIndicator trend={trend as any} size="md" />
}

export const getRankBadgeColor = (rank: number) => {
  const tier = rank === 1 ? "champion" : rank === 2 ? "runner-up" : rank === 3 ? "third" : "standard"
  const config = {
    champion: "bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 shadow-lg shadow-yellow-300/80",
    "runner-up": "bg-gradient-to-r from-slate-400 via-slate-500 to-gray-600 shadow-lg shadow-slate-300/80",
    third: "bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 shadow-lg shadow-amber-300/80",
    standard: "bg-gradient-to-r from-gray-300 to-gray-500 shadow-md",
  }
  return config[tier as keyof typeof config]
}

export const getRankTextColor = (rank: number) => {
  if (rank === 1) return "text-yellow-700 font-bold"
  if (rank === 2) return "text-slate-700 font-bold"
  if (rank === 3) return "text-amber-700 font-bold"
  return "text-gray-600 font-medium"
}

export const calculateCategoryStats = (operators: Operator[]): CategoryStats => {
  if (!operators || operators.length === 0) {
    return {
      Oro: 0,
      Plata: 0,
      Bronce: 0,
      Mejorar: 0,
      "Taller Conciencia": 0,
    }
  }

  return {
    Oro: operators.filter((op) => op.category === "Oro").length,
    Plata: operators.filter((op) => op.category === "Plata").length,
    Bronce: operators.filter((op) => op.category === "Bronce").length,
    Mejorar: operators.filter((op) => op.category === "Mejorar").length,
    "Taller Conciencia": operators.filter((op) => op.category === "Taller Conciencia").length,
  }
}

export const filterAndSortOperators = (
  operators: Operator[],
  filter: FilterType,
  searchQuery: string,
  sortBy: SortType,
  sortOrder: SortOrder,
): Operator[] => {
  if (!operators || operators.length === 0) return []

  const normalizedQuery = searchQuery.toLowerCase().trim()
  let filtered = operators

  // Apply search
  if (normalizedQuery) {
    filtered = filtered.filter((op) => {
      const opAny = op as any
      const searchFields = [
        op.name || opAny.nombre || "",
        op.department || opAny.cargo || "",
        op.position || opAny.cargo || "",
        String(op.id || opAny.codigo || ""),
        op.document || opAny.cedula || "",
      ]
      return searchFields.some((field) => String(field).toLowerCase().includes(normalizedQuery))
    })
  }

  // Apply category filter
  if (filter !== "all") {
    filtered = filtered.filter((op) => {
      const opAny = op as any
      const category = op.category || opAny.finalCategory
      return category === filter
    })
  }

  // Apply sorting
  return filtered.sort((a, b) => {
    let aValue, bValue
    const aAny = a as any
    const bAny = b as any

    switch (sortBy) {
      case "bonus":
        aValue = a.bonus?.percentage || aAny.bonusPercentage || 0
        bValue = b.bonus?.percentage || bAny.bonusPercentage || 0
        break
      case "km":
        aValue = a.km?.percentage || aAny.kmPercentage || 0
        bValue = b.km?.percentage || bAny.kmPercentage || 0
        break
      case "efficiency":
        aValue = a.efficiency || aAny.efficiency || 0
        bValue = b.efficiency || bAny.efficiency || 0
        break
      default:
        aValue = a.rank || aAny.rank || 999
        bValue = b.rank || bAny.rank || 999
    }

    return sortOrder === "desc" ? bValue - aValue : aValue - bValue
  })
}
