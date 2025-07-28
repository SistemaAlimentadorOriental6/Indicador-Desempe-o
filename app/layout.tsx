import type React from "react"
import { AuthProvider } from "../hooks/use-auth"
import "./globals.css"

export const metadata = {
  title: "Indicador de desempeño",
  description: "Aplicación para visualizar Kilómetros y bonos de los operadores",
  icons: {
    icon: "./sao6-logo.png", 
    apple: "./sao6-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={metadata.description} />
        <link rel="icon" href="/sao6-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/sao6-logo.png" />
        <title>{metadata.title}</title>
      </head>
      <body className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 font-sans antialiased text-slate-800">
        <AuthProvider>
          <main className="flex flex-col min-h-screen w-full max-w-[1920px] mx-auto px-2 md:px-6 lg:px-12">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
