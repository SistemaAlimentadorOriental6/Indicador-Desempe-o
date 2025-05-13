"use client"

import { useMemo } from "react"

// Types for categories
export type CategoryLevel = "Oro" | "Plata" | "Bronce" | "Mejorar" | "Taller Conciencia"

// Interfaces for data
interface CategoryData {
  bonusPercentage: number
  kmPercentage: number
}

// Function to determine bonus category
export function getBonusCategory(percentage: number): CategoryLevel {
  if (percentage >= 100) return "Oro"
  if (percentage >= 95) return "Plata"
  if (percentage >= 90) return "Bronce"
  if (percentage >= 60) return "Mejorar"
  return "Taller Conciencia"
}

// Function to determine kilometers category
export function getKmCategory(percentage: number): CategoryLevel {
  if (percentage >= 94) return "Oro"
  if (percentage >= 90) return "Plata"
  if (percentage >= 85) return "Bronce"
  if (percentage >= 70) return "Mejorar"
  return "Taller Conciencia"
}

// Function to determine final category based on combination matrix
export function getFinalCategory(bonusCategory: CategoryLevel, kmCategory: CategoryLevel): CategoryLevel {
  // Combination matrix according to the provided table
  const combinationMatrix: Record<CategoryLevel, Record<CategoryLevel, CategoryLevel>> = {
    Oro: {
      Oro: "Oro",
      Plata: "Plata",
      Bronce: "Plata",
      Mejorar: "Bronce",
      "Taller Conciencia": "Bronce",
    },
    Plata: {
      Oro: "Plata",
      Plata: "Plata",
      Bronce: "Bronce",
      Mejorar: "Bronce",
      "Taller Conciencia": "Bronce",
    },
    Bronce: {
      Oro: "Plata",
      Plata: "Plata",
      Bronce: "Bronce",
      Mejorar: "Bronce",
      "Taller Conciencia": "Bronce",
    },
    Mejorar: {
      Oro: "Mejorar",
      Plata: "Mejorar",
      Bronce: "Mejorar",
      Mejorar: "Mejorar",
      "Taller Conciencia": "Taller Conciencia",
    },
    "Taller Conciencia": {
      Oro: "Taller Conciencia",
      Plata: "Taller Conciencia",
      Bronce: "Taller Conciencia",
      Mejorar: "Taller Conciencia",
      "Taller Conciencia": "Taller Conciencia",
    },
  }

  return combinationMatrix[bonusCategory][kmCategory]
}

// Update the useUserCategory hook to handle edge cases better
export function useUserCategory(bonusPercentage: number, kmPercentage: number) {
  return useMemo(() => {
    // Ensure we have valid numbers
    const validBonusPercentage = isNaN(bonusPercentage) ? 0 : bonusPercentage
    const validKmPercentage = isNaN(kmPercentage) ? 0 : kmPercentage

    // Calculate individual categories
    const bonusCategory = getBonusCategory(validBonusPercentage)
    const kmCategory = getKmCategory(validKmPercentage)

    // Calculate final category
    const finalCategory = getFinalCategory(bonusCategory, kmCategory)

    // Return all categories for reference
    return {
      bonusCategory,
      kmCategory,
      finalCategory,
    }
  }, [bonusPercentage, kmPercentage])
}

// Function to get specific colors for categories
export function getCategoryColors(category: CategoryLevel) {
  switch (category) {
    case "Oro":
      return {
        base: "bg-yellow-500",
        text: "text-white",
        border: "border-yellow-400",
        shadow: "shadow-yellow-400/30",
        fill: "#fde047",
        gradient: "from-yellow-400 to-amber-500",
        lightGradient: "from-yellow-50 to-amber-50",
        ring: "ring-yellow-400/50",
        hoverBg: "hover:bg-yellow-600",
        focusRing: "focus-visible:ring-yellow-500/70",
      }
    case "Plata":
      return {
        base: "bg-gray-300",
        text: "text-gray-800",
        border: "border-gray-200",
        shadow: "shadow-gray-400/30",
        fill: "#e2e8f0",
        gradient: "from-gray-300 to-gray-400",
        lightGradient: "from-gray-50 to-gray-100",
        ring: "ring-gray-300/50",
        hoverBg: "hover:bg-gray-400",
        focusRing: "focus-visible:ring-gray-400/70",
      }
    case "Bronce":
      return {
        base: "bg-amber-700",
        text: "text-white",
        border: "border-amber-600",
        shadow: "shadow-amber-700/30",
        fill: "#d97706",
        gradient: "from-amber-600 to-amber-800",
        lightGradient: "from-amber-50 to-amber-100",
        ring: "ring-amber-600/50",
        hoverBg: "hover:bg-amber-800",
        focusRing: "focus-visible:ring-amber-700/70",
      }
    case "Mejorar":
      return {
        base: "bg-green-500",
        text: "text-white",
        border: "border-green-400",
        shadow: "shadow-green-500/30",
        fill: "#22c55e",
        gradient: "from-green-400 to-green-600",
        lightGradient: "from-green-50 to-green-100",
        ring: "ring-green-400/50",
        hoverBg: "hover:bg-green-600",
        focusRing: "focus-visible:ring-green-500/70",
      }
    case "Taller Conciencia":
      return {
        base: "bg-red-500",
        text: "text-white",
        border: "border-red-400",
        shadow: "shadow-red-500/30",
        fill: "#ef4444",
        gradient: "from-red-400 to-red-600",
        lightGradient: "from-red-50 to-red-100",
        ring: "ring-red-400/50",
        hoverBg: "hover:bg-red-600",
        focusRing: "focus-visible:ring-red-500/70",
      }
    default:
      return {
        base: "bg-green-500",
        text: "text-white",
        border: "border-green-400",
        shadow: "shadow-green-500/30",
        fill: "#22c55e",
        gradient: "from-green-400 to-green-600",
        lightGradient: "from-green-50 to-green-100",
        ring: "ring-green-400/50",
        hoverBg: "hover:bg-green-600",
        focusRing: "focus-visible:ring-green-500/70",
      }
  }
}

// Updated CategoryBadge component with enhanced design
export function CategoryBadge({ category }: { category: CategoryLevel }) {
  const colors = getCategoryColors(category)

  return (
    <div
      className={`py-1 px-3 rounded-full text-xs font-medium ${colors.base} ${colors.text} 
      shadow-sm transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5`}
    >
      {category}
    </div>
  )
}

// Component to display category details with enhanced visuals
export function CategoryDetails({ bonusPercentage, kmPercentage }: CategoryData) {
  const { bonusCategory, kmCategory, finalCategory } = useUserCategory(bonusPercentage, kmPercentage)

  return (
    <div className="space-y-3 p-4 bg-white rounded-xl shadow-sm border border-green-100">
      <h3 className="text-sm font-semibold text-green-700 mb-3">Categoría de Rendimiento</h3>

      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-600 font-medium">Bono:</span>
        <CategoryBadge category={bonusCategory} />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-600 font-medium">Kilómetros:</span>
        <CategoryBadge category={kmCategory} />
      </div>

      <div className="pt-2 border-t border-green-100">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700 font-semibold">Categoría Final:</span>
          <CategoryBadge category={finalCategory} />
        </div>
      </div>
    </div>
  )
}
