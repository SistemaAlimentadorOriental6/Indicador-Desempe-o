import type React from "react"
import { AuthProvider } from "../hooks/use-auth"
import "./globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}

export const metadata = {
  title: "Indicador de desempeño",
  description: "Aplicación para visualizar Kilometros y bonos de los operadores",
    };
