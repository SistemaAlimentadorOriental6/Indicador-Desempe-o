"use client"

import { memo, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Award, Crown, Shield, Target, AlertTriangle, Sparkles } from 'lucide-react'
import type { CategoryLevel } from "./user-category"

// Component to display floating particles based on category
export const CategoryParticles = memo(function CategoryParticles({
  category,
  size = "medium",
}: {
  category: CategoryLevel
  size?: "small" | "medium" | "large"
}) {
  // Configure particles based on category
  const getParticleProps = () => {
    const sizeMultiplier = size === "small" ? 0.7 : size === "large" ? 1.3 : 1

    switch (category) {
      case "Oro":
        return {
          color: "#fbbf24",
          secondaryColor: "#fef3c7",
          count: 8 * sizeMultiplier,
          speed: 8,
          size: [2, 5],
          shapes: ["circle", "star", "diamond"],
        }
      case "Plata":
        return {
          color: "#d1d5db",
          secondaryColor: "#f9fafb",
          count: 6 * sizeMultiplier,
          speed: 6,
          size: [2, 4],
          shapes: ["circle", "square"],
        }
      case "Bronce":
        return {
          color: "#b45309",
          secondaryColor: "#fbbf24",
          count: 5 * sizeMultiplier,
          speed: 4,
          size: [1.5, 3.5],
          shapes: ["circle", "triangle"],
        }
      case "Mejorar":
        return {
          color: "#22c55e",
          secondaryColor: "#86efac",
          count: 4 * sizeMultiplier,
          speed: 3,
          size: [1, 3],
          shapes: ["circle"],
        }
      case "Taller Conciencia":
        return {
          color: "#f87171",
          secondaryColor: "#fca5a5",
          count: 3 * sizeMultiplier,
          speed: 2,
          size: [1, 2.5],
          shapes: ["circle"],
        }
      default:
        return {
          color: "#10b981",
          secondaryColor: "#6ee7b7",
          count: 5 * sizeMultiplier,
          speed: 5,
          size: [1.5, 3],
          shapes: ["circle"],
        }
    }
  }

  const { color, secondaryColor, count, speed, size: particleSize, shapes } = getParticleProps()

  // Generate particles
  const particles = Array.from({ length: Math.round(count) }, (_, i) => {
    const delay = i * 0.8
    const sz = particleSize[0] + Math.random() * (particleSize[1] - particleSize[0])
    const shape = shapes[Math.floor(Math.random() * shapes.length)]
    const particleColor = i % 2 === 0 ? color : secondaryColor

    // Render different shapes based on type
    const renderShape = () => {
      switch (shape) {
        case "star":
          return (
            <motion.div
              className="absolute"
              style={{
                width: `${sz * 2}px`,
                height: `${sz * 2}px`,
                color: particleColor,
              }}
              animate={{
                y: [0, -15, 0],
                x: [0, Math.random() * 10 - 5, 0],
                opacity: [0, 0.9, 0],
                scale: [1, 1.2, 0.9, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: speed,
                repeat: Number.POSITIVE_INFINITY,
                delay: delay,
              }}
            >
              <Sparkles size={sz * 2} className="text-current" />
            </motion.div>
          )
        case "diamond":
          return (
            <motion.div
              className="absolute rotate-45"
              style={{
                width: `${sz * 1.5}px`,
                height: `${sz * 1.5}px`,
                backgroundColor: particleColor,
              }}
              animate={{
                y: [0, -15, 0],
                x: [0, Math.random() * 10 - 5, 0],
                opacity: [0, 0.9, 0],
                scale: [1, 1.2, 0.9, 1],
                rotate: ["45deg", "225deg", "405deg"],
              }}
              transition={{
                duration: speed,
                repeat: Number.POSITIVE_INFINITY,
                delay: delay,
              }}
            />
          )
        case "square":
          return (
            <motion.div
              className="absolute"
              style={{
                width: `${sz * 1.2}px`,
                height: `${sz * 1.2}px`,
                backgroundColor: particleColor,
              }}
              animate={{
                y: [0, -15, 0],
                x: [0, Math.random() * 10 - 5, 0],
                opacity: [0, 0.9, 0],
                scale: [1, 1.2, 0.9, 1],
                rotate: [0, 90, 180, 270, 360],
              }}
              transition={{
                duration: speed,
                repeat: Number.POSITIVE_INFINITY,
                delay: delay,
              }}
            />
          )
        case "triangle":
          return (
            <motion.div
              className="absolute"
              style={{
                width: 0,
                height: 0,
                borderLeft: `${sz}px solid transparent`,
                borderRight: `${sz}px solid transparent`,
                borderBottom: `${sz * 1.5}px solid ${particleColor}`,
              }}
              animate={{
                y: [0, -15, 0],
                x: [0, Math.random() * 10 - 5, 0],
                opacity: [0, 0.9, 0],
                scale: [1, 1.2, 0.9, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: speed,
                repeat: Number.POSITIVE_INFINITY,
                delay: delay,
              }}
            />
          )
        default:
          return (
            <motion.div
              className="absolute rounded-full z-0"
              style={{
                width: `${sz}px`,
                height: `${sz}px`,
                backgroundColor: particleColor,
                boxShadow: `0 0 ${sz / 2}px ${particleColor}`,
              }}
              animate={{
                y: [0, -15, 0],
                x: [0, Math.random() * 10 - 5, 0],
                opacity: [0, 0.9, 0],
                scale: [1, 1.2, 0.9, 1],
              }}
              transition={{
                duration: speed,
                repeat: Number.POSITIVE_INFINITY,
                delay: delay,
              }}
            />
          )
      }
    }

    return (
      <div
        key={i}
        className="absolute"
        style={{
          top: `${30 + Math.random() * 40}%`,
          left: `${20 + Math.random() * 60}%`,
          zIndex: 0,
        }}
      >
        {renderShape()}
      </div>
    )
  })

  return <>{particles}</>
})

// Component to display a halo based on category
export const CategoryHalo = memo(function CategoryHalo({
  category,
  size = "medium",
}: {
  category: CategoryLevel
  size?: "small" | "medium" | "large"
}) {
  const getHaloProps = () => {
    const sizeMultiplier = size === "small" ? 0.7 : size === "large" ? 1.3 : 1

    switch (category) {
      case "Oro":
        return {
          colors: ["rgba(251, 191, 36, 0.7)", "rgba(251, 191, 36, 0.2)"],
          secondaryColors: ["rgba(234, 179, 8, 0.6)", "rgba(202, 138, 4, 0.2)"],
          scale: 1.25 * sizeMultiplier,
          pulseSpeed: 3,
          glow: "0 0 15px rgba(251, 191, 36, 0.7)",
        }
      case "Plata":
        return {
          colors: ["rgba(209, 213, 219, 0.7)", "rgba(209, 213, 219, 0.2)"],
          secondaryColors: ["rgba(229, 231, 235, 0.6)", "rgba(156, 163, 175, 0.2)"],
          scale: 1.2 * sizeMultiplier,
          pulseSpeed: 4,
          glow: "0 0 12px rgba(209, 213, 219, 0.6)",
        }
      case "Bronce":
        return {
          colors: ["rgba(180, 83, 9, 0.6)", "rgba(180, 83, 9, 0.15)"],
          secondaryColors: ["rgba(217, 119, 6, 0.5)", "rgba(146, 64, 14, 0.15)"],
          scale: 1.15 * sizeMultiplier,
          pulseSpeed: 5,
          glow: "0 0 10px rgba(180, 83, 9, 0.5)",
        }
      case "Mejorar":
        return {
          colors: ["rgba(34, 197, 94, 0.6)", "rgba(34, 197, 94, 0.15)"],
          secondaryColors: ["rgba(22, 163, 74, 0.5)", "rgba(21, 128, 61, 0.15)"],
          scale: 1.1 * sizeMultiplier,
          pulseSpeed: 6,
          glow: "0 0 8px rgba(34, 197, 94, 0.5)",
        }
      case "Taller Conciencia":
        return {
          colors: ["rgba(248, 113, 113, 0.6)", "rgba(248, 113, 113, 0.15)"],
          secondaryColors: ["rgba(239, 68, 68, 0.5)", "rgba(220, 38, 38, 0.15)"],
          scale: 1.08 * sizeMultiplier,
          pulseSpeed: 7,
          glow: "0 0 8px rgba(248, 113, 113, 0.5)",
        }
      default:
        return {
          colors: ["rgba(16, 185, 129, 0.6)", "rgba(16, 185, 129, 0.15)"],
          secondaryColors: ["rgba(5, 150, 105, 0.5)", "rgba(4, 120, 87, 0.15)"],
          scale: 1.15 * sizeMultiplier,
          pulseSpeed: 5,
          glow: "0 0 10px rgba(16, 185, 129, 0.5)",
        }
    }
  }

  const { colors, secondaryColors, scale, pulseSpeed, glow } = getHaloProps()

  return (
    <>
      {/* Main halo */}
      <motion.div
        className="absolute inset-0 rounded-full z-0 blur-md"
        style={{
          background: `radial-gradient(circle, ${colors[0]} 0%, ${colors[1]} 70%, transparent 100%)`,
          boxShadow: glow,
        }}
        animate={{
          scale: [scale, scale * 1.08, scale],
          opacity: [0.8, 0.9, 0.8],
        }}
        transition={{
          duration: pulseSpeed,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
      />

      {/* Secondary halo with rotation */}
      <motion.div
        className="absolute inset-0 rounded-full z-0 blur-md"
        style={{
          background: `radial-gradient(circle, ${secondaryColors[0]} 0%, ${secondaryColors[1]} 60%, transparent 100%)`,
          opacity: 0.6,
        }}
        animate={{
          scale: [scale * 0.9, scale * 1.05, scale * 0.9],
          rotate: [0, 360],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: pulseSpeed * 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
      />
    </>
  )
})

// Component to display an icon based on category
export const CategoryIcon = memo(function CategoryIcon({
  category,
  size = "medium",
  animated = false,
}: {
  category: CategoryLevel
  size?: "small" | "medium" | "large"
  animated?: boolean
}) {
  const sizePx = size === "small" ? 14 : size === "large" ? 24 : 18

  const getCategoryIcon = () => {
    switch (category) {
      case "Oro":
        return <Crown className="text-yellow-400 drop-shadow-md" size={sizePx} fill="#fbbf24" strokeWidth={1.5} />
      case "Plata":
        return <Award className="text-gray-300 drop-shadow-md" size={sizePx} fill="#d1d5db" strokeWidth={1.5} />
      case "Bronce":
        return <Shield className="text-amber-700 drop-shadow-md" size={sizePx} fill="#b45309" strokeWidth={1.5} />
      case "Mejorar":
        return <Target className="text-green-500 drop-shadow-md" size={sizePx} fill="#22c55e" strokeWidth={1.5} />
      case "Taller Conciencia":
        return <AlertTriangle className="text-red-500 drop-shadow-md" size={sizePx} fill="#f87171" strokeWidth={1.5} />
      default:
        return <Award className="text-green-500 drop-shadow-md" size={sizePx} fill="#10b981" strokeWidth={1.5} />
    }
  }

  if (!animated) {
    return <div className="flex items-center justify-center">{getCategoryIcon()}</div>
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.2, rotate: [0, 10, -10, 0] }}
      className="flex items-center justify-center"
    >
      <motion.div
        animate={{
          y: [0, -2, 0],
          scale: [1, 1.1, 1],
          rotate: [-5, 5, -5],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
      >
        {getCategoryIcon()}
      </motion.div>
    </motion.div>
  )
})

// Component to display a badge based on category
export const CategoryBadge3D = memo(function CategoryBadge3D({
  category,
  size = "medium",
  showText = true,
  animated = true,
}: {
  category: CategoryLevel
  size?: "small" | "medium" | "large"
  showText?: boolean
  animated?: boolean
}) {
  // Configuration based on size
  const getBadgeSize = () => {
    switch (size) {
      case "small":
        return {
          padding: "px-2 py-0.5",
          fontSize: "text-[10px]",
          iconSize: "small",
        }
      case "large":
        return {
          padding: "px-4 py-1.5",
          fontSize: "text-sm",
          iconSize: "large",
        }
      default:
        return {
          padding: "px-3 py-1",
          fontSize: "text-xs",
          iconSize: "medium",
        }
    }
  }

  // Configuration based on category
  const getBadgeStyles = () => {
    switch (category) {
      case "Oro":
        return {
          bg: "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500",
          border: "border-yellow-200",
          shadow: "shadow-yellow-500/30",
          textColor: "text-yellow-900",
          textShadow: "text-shadow-sm",
          glow: "0 0 10px rgba(251, 191, 36, 0.7)",
        }
      case "Plata":
        return {
          bg: "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400",
          border: "border-gray-100",
          shadow: "shadow-gray-400/30",
          textColor: "text-gray-800",
          textShadow: "text-shadow-sm",
          glow: "0 0 8px rgba(209, 213, 219, 0.6)",
        }
      case "Bronce":
        return {
          bg: "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700",
          border: "border-amber-400",
          shadow: "shadow-amber-700/30",
          textColor: "text-white",
          textShadow: "text-shadow-sm",
          glow: "0 0 8px rgba(180, 83, 9, 0.5)",
        }
      case "Mejorar":
        return {
          bg: "bg-gradient-to-br from-green-400 via-green-500 to-green-600",
          border: "border-green-300",
          shadow: "shadow-green-500/30",
          textColor: "text-white",
          textShadow: "text-shadow-sm",
          glow: "0 0 8px rgba(34, 197, 94, 0.5)",
        }
      case "Taller Conciencia":
        return {
          bg: "bg-gradient-to-br from-red-400 via-red-500 to-red-600",
          border: "border-red-300",
          shadow: "shadow-red-500/30",
          textColor: "text-white",
          textShadow: "text-shadow-sm",
          glow: "0 0 8px rgba(248, 113, 113, 0.5)",
        }
      default:
        return {
          bg: "bg-gradient-to-br from-green-400 via-green-500 to-green-600",
          border: "border-green-300",
          shadow: "shadow-green-500/30",
          textColor: "text-white",
          textShadow: "text-shadow-sm",
          glow: "0 0 8px rgba(16, 185, 129, 0.5)",
        }
    }
  }

  const { padding, fontSize, iconSize } = getBadgeSize()
  const { bg, border, shadow, textColor, textShadow, glow } = getBadgeStyles()

  if (!animated) {
    return (
      <div
        className={`rounded-full border backdrop-blur-sm ${padding} flex items-center gap-1.5
          ${bg} ${border} ${shadow} transform-gpu`}
        style={{
          boxShadow: `0 3px 5px -1px rgba(0,0,0,0.1), 0 2px 3px -1px rgba(0,0,0,0.06), ${glow}`,
        }}
      >
        <CategoryIcon category={category} size={iconSize as "small" | "medium" | "large"} />
        {showText && <span className={`font-bold ${fontSize} ${textColor} ${textShadow}`}>{category}</span>}
      </div>
    )
  }

  return (
    <motion.div
      className={`rounded-full border backdrop-blur-sm ${padding} flex items-center gap-1.5
        ${bg} ${border} ${shadow} transform-gpu`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: [1, 1.05, 1],
        opacity: 1,
      }}
      transition={{
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
      }}
      style={{
        boxShadow: `0 3px 5px -1px rgba(0,0,0,0.1), 0 2px 3px -1px rgba(0,0,0,0.06), ${glow}`,
      }}
      whileHover={{
        scale: 1.1,
        transition: { duration: 0.2 },
      }}
    >
      <CategoryIcon category={category} size={iconSize as "small" | "medium" | "large"} animated />
      {showText && <span className={`font-bold ${fontSize} ${textColor} ${textShadow}`}>{category}</span>}
    </motion.div>
  )
})

// Golden crown effect for Gold category
export const GoldenCrown = memo(function GoldenCrown({ visible = true }: { visible?: boolean }) {
  if (!visible) return null

  return (
    <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 15,
          delay: 0.2,
        }}
      >
        <motion.div
          animate={{
            y: [0, -3, 0],
            rotateZ: [-3, 3, -3],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        >
          <div className="relative">
            {/* Glow effect behind the crown */}
            <motion.div
              className="absolute inset-0 rounded-full bg-yellow-300/50 blur-md"
              style={{ width: "120%", height: "120%", top: "-10%", left: "-10%" }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />

            {/* Crown with glow effect */}
            <Crown
              size={36}
              className="text-yellow-500 drop-shadow-lg relative z-10"
              fill="#fbbf24"
              strokeWidth={1.5}
            />

            {/* Sparkles around the crown */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-yellow-200"
                style={{
                  width: 3 + (i % 2),
                  height: 3 + (i % 2),
                  top: 10 + ((i * 10) % 20),
                  left: 5 + ((i * 8) % 30),
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7],
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 1 + i * 0.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
})
