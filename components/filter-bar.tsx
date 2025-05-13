"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Filter, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface FilterPanelProps {
  selectedYear: number | null
  selectedMonth: number | null
  availableYears: number[]
  availableMonths: number[]
  onYearChange: (year: number | null) => void
  onMonthChange: (month: number | null) => void
  onlyLastMonth: boolean
  toggleLastMonthFilter: () => void
  lastMonthData: {
    year: number
    month: number
    monthName: string
  } | null
  className?: string
  isCompact?: boolean
}

export default function FilterPanel({
  selectedYear,
  selectedMonth,
  availableYears,
  availableMonths,
  onYearChange,
  onMonthChange,
  onlyLastMonth,
  toggleLastMonthFilter,
  lastMonthData,
  className = "",
  isCompact = false,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!isCompact)

  // Get month name
  const getMonthName = (month: number) => {
    return new Intl.DateTimeFormat("es-CO", { month: "long" }).format(new Date(2000, month - 1, 1))
  }

  return (
    <div className={cn("relative", className)}>
      {isCompact && (
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2 text-emerald-600" />
            <span className="font-medium text-gray-700">Filtros</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-emerald-600"
          >
            {isExpanded ? "Ocultar" : "Mostrar"}
            <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </Button>
        </div>
      )}

      <AnimatePresence>
        {(isExpanded || !isCompact) && (
          <motion.div
            initial={isCompact ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={isCompact ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Selector de año */}
              <div>
                <Label htmlFor="year-select" className="text-sm text-gray-500 mb-1.5 block">
                  Año
                </Label>
                <Select
                  value={selectedYear?.toString() || ""}
                  onValueChange={(value) => onYearChange(value ? Number(value) : null)}
                >
                  <SelectTrigger id="year-select" className="w-full">
                    <SelectValue placeholder="Seleccionar año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los años</SelectItem>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selector de mes */}
              <div>
                <Label htmlFor="month-select" className="text-sm text-gray-500 mb-1.5 block">
                  Mes
                </Label>
                <Select
                  value={selectedMonth?.toString() || ""}
                  onValueChange={(value) => onMonthChange(value ? Number(value) : null)}
                  disabled={!selectedYear}
                >
                  <SelectTrigger
                    id="month-select"
                    className={cn("w-full", !selectedYear && "opacity-50 cursor-not-allowed")}
                  >
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los meses</SelectItem>
                    {availableMonths.map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {getMonthName(month)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de último mes */}
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between space-x-2 h-10 px-3 py-2 rounded-md border border-input bg-background">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="last-month-filter" className="text-sm cursor-pointer">
                      Último mes disponible
                    </Label>
                  </div>
                  <Switch id="last-month-filter" checked={onlyLastMonth} onCheckedChange={toggleLastMonthFilter} />
                </div>
              </div>
            </div>

            {/* Resumen de filtros aplicados */}
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedYear && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Año: {selectedYear}
                </Badge>
              )}
              {selectedMonth && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Mes: {getMonthName(selectedMonth)}
                </Badge>
              )}
              {onlyLastMonth && lastMonthData && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 cursor-help">
                        <Clock className="h-3 w-3 mr-1" />
                        Último mes: {lastMonthData.monthName} {lastMonthData.year}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Mostrando datos del último mes disponible</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {!selectedYear && !selectedMonth && !onlyLastMonth && (
                <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                  Sin filtros aplicados
                </Badge>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
