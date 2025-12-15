"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

export const LoginHero = () => {
    const [imageLoaded, setImageLoaded] = useState(false)

    return (
        <div className="lg:order-2 w-full lg:w-1/2 relative min-h-[45vh] lg:min-h-screen overflow-hidden bg-gray-800">
            <Image
                src="/busrunner.webp"
                alt="Bus SAO6"
                fill
                className={`object-cover transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={75}
                onLoad={() => setImageLoaded(true)}
            />

            <div className="absolute inset-0 bg-black/50" />

            <div className="relative z-10 flex flex-col h-full p-6 lg:p-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex items-center gap-3"
                >
                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                        <Image
                            src="/sao6-logo.png"
                            alt="Logo SAO6"
                            width={36}
                            height={36}
                            className="object-contain brightness-0 invert"
                        />
                    </div>
                    <span className="text-white font-bold text-2xl lg:text-3xl">SAO6</span>
                </motion.div>

                <div className="flex-1 flex flex-col items-start lg:items-center justify-center py-8 lg:py-0">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                        className="text-4xl lg:text-6xl font-extrabold text-white leading-tight lg:text-center"
                    >
                        ¡Medellín
                        <br />
                        Conduce el
                        <br />
                        <span className="text-green-400">Cambio!</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="hidden lg:block text-white/70 text-lg mt-6 max-w-sm text-center"
                    >
                        Sistema de Indicador de Desempeño para operadores
                    </motion.p>
                </div>
            </div>
        </div>
    )
}
