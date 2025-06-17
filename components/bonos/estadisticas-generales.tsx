import type React from "react"
import { Users, DollarSign, CheckCircle, TrendingDown, TrendingUp } from "lucide-react"
import type { PersonaBono } from "@/types/bono-types"
import { formatCurrency } from "@/utils/bono-utils"

interface EstadisticasGeneralesProps {
  personas: PersonaBono[]
  animateCards: boolean
}

export const EstadisticasGenerales: React.FC<EstadisticasGeneralesProps> = ({ personas, animateCards }) => {
  const stats = [
    {
      title: "Total Personal",
      value: personas.length,
      icon: Users,
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100",
      textColor: "text-green-800",
      change: "+12%",
      changeType: "positive",
    },
    {
      title: "Bonos Base Totales",
      value: formatCurrency(personas.reduce((sum, p) => sum + p.montoBase, 0)),
      icon: DollarSign,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      textColor: "text-blue-800",
      change: "+8%",
      changeType: "positive",
    },
    {
      title: "Bonos Actuales",
      value: formatCurrency(personas.reduce((sum, p) => sum + p.montoActual, 0)),
      icon: CheckCircle,
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100",
      textColor: "text-green-800",
      change: "+15%",
      changeType: "positive",
    },
    {
      title: "Total Descuentos",
      value: formatCurrency(personas.reduce((sum, p) => sum + p.totalDescuentosAcumulados, 0)),
      icon: TrendingDown,
      gradient: "from-red-500 to-red-600",
      bgGradient: "from-red-50 to-red-100",
      textColor: "text-red-800",
      change: "-5%",
      changeType: "negative",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`
            relative bg-gradient-to-br ${stat.bgGradient} rounded-3xl p-6 border border-gray-100 
            shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group overflow-hidden
            ${animateCards ? "animate-fade-in-up" : ""}
          `}
          style={{ animationDelay: `${index * 150}ms` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300`}
              >
                <stat.icon className="w-7 h-7 text-white" />
              </div>
              {stat.change && (
                <div
                  className={`
                  flex items-center space-x-1 px-3 py-1 rounded-xl text-xs font-bold
                  ${
                    stat.changeType === "positive"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }
                `}
                >
                  {stat.changeType === "positive" ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{stat.change}</span>
                </div>
              )}
            </div>

            <h4 className={`font-bold text-lg ${stat.textColor} mb-2`}>{stat.title}</h4>
            <p className={`text-3xl font-bold ${stat.textColor} mb-2`}>
              {typeof stat.value === "string" ? stat.value : stat.value.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 font-medium">Actualizado en tiempo real</p>
          </div>
        </div>
      ))}
    </div>
  )
}
