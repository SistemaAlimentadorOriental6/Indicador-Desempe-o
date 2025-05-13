"use client"

import { motion } from "framer-motion"
import { type LucideIcon } from 'lucide-react'

interface ContactButtonProps {
  icon: LucideIcon
  onClick?: () => void
}

export default function ContactButton({ icon: Icon, onClick }: ContactButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, y: -3, boxShadow: "0 8px 20px rgba(16, 185, 129, 0.2)" }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="bg-gradient-to-r from-green-50 to-emerald-50 p-2.5 rounded-xl border border-green-100 shadow-sm text-green-600 hover:text-white relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
      <Icon className="h-5 w-5" />
    </motion.button>
  )
}
