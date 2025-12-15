"use client"

import { forwardRef, useState } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoginInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    showValidation?: boolean
    isPassword?: boolean
}

const LoginInput = forwardRef<HTMLInputElement, LoginInputProps>(
    ({ label, showValidation = false, isPassword = false, className, value, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false)
        const [showPassword, setShowPassword] = useState(false)

        const hasValue = Boolean(value)

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        type={isPassword ? (showPassword ? "text" : "password") : props.type}
                        value={value}
                        onFocus={(e) => {
                            setIsFocused(true)
                            props.onFocus?.(e)
                        }}
                        onBlur={(e) => {
                            setIsFocused(false)
                            props.onBlur?.(e)
                        }}
                        className={cn(
                            "w-full bg-gray-100 border-0 rounded-2xl py-4 px-5 text-gray-900 text-base focus:outline-none transition-all duration-200 placeholder:text-gray-400",
                            isFocused && "bg-gray-50 ring-2 ring-green-500/30",
                            !isFocused && "hover:bg-gray-50",
                            isPassword && "pr-12",
                            showValidation && hasValue && "pr-12",
                            className
                        )}
                        {...props}
                    />

                    {showValidation && hasValue && !isPassword && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute right-4 top-1/2 -translate-y-1/2"
                        >
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        </motion.div>
                    )}

                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-500 transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    )}
                </div>
            </div>
        )
    }
)

LoginInput.displayName = "LoginInput"

export { LoginInput }
