"use client"

import { motion } from "framer-motion"

interface PropsPatronDecorativo {
    className?: string
    variant?: "dots" | "grid" | "waves" | "circles"
    color?: string
}

/**
 * Componente de patrón decorativo para fondos de tarjetas
 * Soporta variantes: dots, grid, waves, circles
 */
export function PatronDecorativo({
    className = "",
    variant = "dots",
    color = "currentColor",
}: PropsPatronDecorativo) {
    if (variant === "waves") {
        return (
            <div className={`absolute inset-0 overflow-hidden opacity-5 pointer-events-none ${className}`}>
                <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <motion.path
                        d="M 0 1000 Q 250 850 500 1000 Q 750 850 1000 1000 L 1000 0 L 0 0 Z"
                        fill={color}
                        opacity="0.3"
                        animate={{
                            d: [
                                "M 0 1000 Q 250 850 500 1000 Q 750 850 1000 1000 L 1000 0 L 0 0 Z",
                                "M 0 1000 Q 250 900 500 1000 Q 750 900 1000 1000 L 1000 0 L 0 0 Z",
                                "M 0 1000 Q 250 850 500 1000 Q 750 850 1000 1000 L 1000 0 L 0 0 Z",
                            ],
                        }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 12, ease: "easeInOut" }}
                    />
                </svg>
            </div>
        )
    }

    return (
        <div className={`absolute inset-0 overflow-hidden opacity-5 pointer-events-none ${className}`}>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill={color} />
                    </pattern>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#dots)" />
            </svg>
        </div>
    )
}
