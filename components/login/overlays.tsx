"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle } from "lucide-react"

export const LoadingOverlay = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
    >
        <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-gray-200 border-t-green-500 rounded-full animate-spin" />
                <p className="text-gray-600 text-sm font-medium">Procesando...</p>
            </div>
        </div>
    </motion.div>
)

interface ErrorModalProps {
    isOpen: boolean
    onClose: () => void
}

export const ErrorModal = ({ isOpen, onClose }: ErrorModalProps) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4"
                >
                    <div className="text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
                            <AlertCircle className="h-7 w-7 text-red-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Demasiados intentos</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Has excedido el límite de intentos. Intenta más tarde.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-xl transition-colors"
                        >
                            Entendido
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
)

export const LoadingTransition = () => (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-3 border-gray-200 border-t-green-500 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
    </div>
)
