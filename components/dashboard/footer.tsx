"use client"

import { Heart, GitCommit } from "lucide-react"
import { motion } from "framer-motion"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1 }}
      className="w-full mt-auto"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="border-t border-gray-200/50 py-8 text-center">
          <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5">
            Creado con <Heart className="h-4 w-4 text-emerald-500" /> por el equipo de Mejora Continua SAO6
          </p>
          <div className="mt-2 flex items-center justify-center space-x-4 text-xs text-gray-400">
            <span>&copy; {currentYear} SAO S.A. E.S.P.</span>
            <span className="flex items-center gap-1">
              <GitCommit className="h-3 w-3" />
              <span>v1.2.0</span>
            </span>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
