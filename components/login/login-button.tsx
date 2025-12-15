"use client"

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface LoginButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean
    loadingText?: string
}

const LoginButton = forwardRef<HTMLButtonElement, LoginButtonProps>(
    ({ children, isLoading = false, loadingText = "Ingresando...", className, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    "w-full bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600",
                    "text-white font-semibold py-4 rounded-full",
                    "transition-all duration-200",
                    "shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30",
                    "transform hover:-translate-y-0.5 active:translate-y-0",
                    "disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
                    "text-base",
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        {loadingText}
                    </span>
                ) : (
                    children
                )}
            </button>
        )
    }
)

LoginButton.displayName = "LoginButton"

export { LoginButton }
