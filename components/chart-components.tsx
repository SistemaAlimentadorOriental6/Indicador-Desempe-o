"use client"

import React from "react"
import { motion } from "framer-motion"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { TrendingUp, Award } from "lucide-react"

// Custom tooltip for performance chart
export const PerformanceTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0]?.value || 0
    return (
      <div className="bg-gradient-to-br from-white via-green-50/80 to-white border-2 border-green-200/60 backdrop-blur-sm p-4 rounded-xl shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Award className="h-4 w-4 text-green-600" />
          <p className="font-bold text-green-800 text-sm">Año {label}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600" />
          <span className="text-green-700 font-semibold text-lg">{value}%</span>
          <span className="text-green-600/80 text-sm">rendimiento</span>
        </div>
        <div className="mt-2 text-xs text-green-600/70">
          {value >= 94 ? "Oro" : 
           value >= 90 ? "Plata" : 
           value >= 85 ? "Bronce" : 
           value >= 60 ? "Mejorar" : "Taller Conciencia"}
        </div>
      </div>
    );
  }
  return null;
};

// Three Year Comparison Chart Component
interface ThreeYearChartProps {
  data: any[]
  isLoading?: boolean
  currentYearPerformance?: number // Add this to receive actual 2025 performance
}

export const ThreeYearComparisonChart: React.FC<ThreeYearChartProps> = ({ data, isLoading = false, currentYearPerformance }) => {
  console.log('[DEBUG] ThreeYearComparisonChart received data:', data)
  console.log('[DEBUG] Data structure analysis:', data?.map(item => ({
    year: item.year,
    rendimiento: item['rendimiento general (%)'],
    keys: Object.keys(item)
  })))
  
  if (isLoading || !data || data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-56 bg-gradient-to-br from-white via-green-50/30 to-white backdrop-blur-sm rounded-2xl border-2 border-green-100/50 p-4 flex items-center justify-center shadow-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full"></div>
            <div className="text-green-700 font-medium">Cargando análisis de rendimiento...</div>
          </div>
        </div>
      </div>
    )
  }

  // Separate historical data (last 3 years) from current year (2025)
  const currentYear = 2025
  const historicalData = data.filter(item => item.year !== currentYear).map(item => ({
    year: item.year,
    rendimiento: item['rendimiento general (%)'] || 0
  }))
  
  // Handle current year data (2025)
  let currentPerformance = 0
  let isEstimate = false
  let currentYearData = null
  
  // First, try to use the passed currentYearPerformance parameter
  if (currentYearPerformance && currentYearPerformance > 0) {
    currentPerformance = currentYearPerformance
    isEstimate = false // This is real data, not an estimate
    console.log(`[DEBUG] Using passed 2025 performance (REAL):`, currentPerformance)
  } else {
    // Fallback: try to find 2025 data in the historical array (unlikely but possible)
    currentYearData = data.find(item => item.year === currentYear)
    
    if (currentYearData) {
      currentPerformance = currentYearData['rendimiento general (%)'] || 0
      console.log(`[DEBUG] Found direct 2025 data in array:`, currentPerformance)
    } else {
      // If no direct data, calculate based on what we know
      // Since this component is receiving historical data only,
      // we'll need to calculate or estimate from available context
      
      // For now, return 0 and let the parent component pass the correct value
      currentPerformance = 0
      isEstimate = true
      console.log(`[DEBUG] No 2025 data available, needs to be passed from parent`)
    }
  }
  
  // Create current year data object
  currentYearData = {
    year: currentYear,
    'rendimiento general (%)': currentPerformance,
    isEstimate: isEstimate
  }

  // Combine all data for the bar chart display - include ALL years (last 3 + current 2025)
  const allYearsData = [...historicalData]
  if (currentPerformance > 0) {
    allYearsData.push({ year: currentYear, rendimiento: currentPerformance })
  }
  
  // Also combine for min/max calculations
  const allPerformanceData = [...allYearsData]

  const maxPerformance = allPerformanceData.length > 0 ? Math.max(...allPerformanceData.map(d => d.rendimiento)) : 0
  const minPerformance = allPerformanceData.length > 0 ? Math.min(...allPerformanceData.map(d => d.rendimiento)) : 0
  const avgHistoricalPerformance = historicalData.length > 0 ? Number((historicalData.reduce((sum, d) => sum + d.rendimiento, 0) / historicalData.length).toFixed(1)) : 0

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Performance Chart */}
      <motion.div 
        className="relative h-56 bg-gradient-to-br from-white via-green-50/30 to-white backdrop-blur-sm rounded-2xl border-2 border-green-100/50 p-4 shadow-lg overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/20 to-green-300/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100/30 to-green-200/20 rounded-full blur-2xl translate-y-12 -translate-x-12" />
        
        <div className="relative z-10 h-full">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="font-bold text-green-800 text-sm">Evolución del Rendimiento - Últimos 3 Años</h3>
          </div>
          
          <ResponsiveContainer width="100%" height="75%">
            <BarChart data={allYearsData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="performanceBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="currentYearBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="50%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#10b981" opacity={0.15} />
              <XAxis 
                dataKey="year" 
                stroke="#065f46"
                tick={{ fontSize: 13, fill: '#065f46', fontWeight: 600 }}
                tickLine={{ stroke: '#10b981', strokeWidth: 2 }}
                axisLine={{ stroke: '#10b981', strokeWidth: 2 }}
              />
              <YAxis 
                stroke="#065f46"
                tick={{ fontSize: 12, fill: '#065f46', fontWeight: 500 }}
                tickLine={{ stroke: '#10b981', strokeWidth: 2 }}
                axisLine={{ stroke: '#10b981', strokeWidth: 2 }}
                domain={[Math.max(0, minPerformance - 10), 100]}
                label={{ 
                  value: 'Rendimiento (%)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { textAnchor: 'middle', fontSize: '12px', fill: '#065f46', fontWeight: 600 } 
                }}
              />
              <Tooltip content={<PerformanceTooltip />} />
              
              <Bar 
                dataKey="rendimiento" 
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
              >
                {allYearsData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.year === currentYear ? "url(#currentYearBarGradient)" : "url(#performanceBarGradient)"}
                    stroke={entry.year === currentYear ? "#3b82f6" : "#10b981"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Performance Summary Cards - Historical + Current Year */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
      >
        {/* Historical Years (Last 3) */}
        <div className="grid grid-cols-3 gap-3">
          {historicalData.map((yearData, index) => {
            const isHighestHistorical = historicalData.length > 0 && yearData.rendimiento === Math.max(...historicalData.map(d => d.rendimiento))
            const isLowestHistorical = historicalData.length > 0 && yearData.rendimiento === Math.min(...historicalData.map(d => d.rendimiento))
            
            return (
              <motion.div 
                key={yearData.year}
                className={`
                  relative p-4 rounded-xl border-2 backdrop-blur-sm shadow-lg
                  ${isHighestHistorical ? 'bg-gradient-to-br from-green-100 via-green-50 to-white border-green-300' : 
                    isLowestHistorical ? 'bg-gradient-to-br from-red-50 via-white to-white border-red-200' :
                    'bg-gradient-to-br from-white via-green-50/20 to-white border-green-100'}
                `}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  ease: "easeOut", 
                  delay: 0.4 + index * 0.1 
                }}
                whileHover={{ 
                  scale: 1.02, 
                  y: -2,
                  transition: { duration: 0.2 }
                }}
              >
                {isHighestHistorical && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <Award className="h-3 w-3 text-white" />
                  </div>
                )}
                
                <div className="text-center">
                  <div className={`text-lg font-bold mb-1 ${isHighestHistorical ? 'text-green-800' : 'text-green-700'}`}>
                    {yearData.year}
                  </div>
                  <div className={`text-2xl font-extrabold mb-1 ${
                    yearData.rendimiento >= 94 ? 'text-green-600' :
                    yearData.rendimiento >= 90 ? 'text-green-500' :
                    yearData.rendimiento >= 85 ? 'text-blue-500' :
                    yearData.rendimiento >= 60 ? 'text-yellow-600' : 'text-red-500'
                  }`}>
                    {yearData.rendimiento.toFixed(1)}%
                  </div>
                  <div className={`text-xs font-medium ${
                    yearData.rendimiento >= 94 ? 'text-green-600' :
                    yearData.rendimiento >= 90 ? 'text-green-500' :
                    yearData.rendimiento >= 85 ? 'text-blue-500' :
                    yearData.rendimiento >= 60 ? 'text-yellow-600' : 'text-red-500'
                  }`}>
                    {yearData.rendimiento >= 94 ? 'Oro' :
                     yearData.rendimiento >= 90 ? 'Plata' :
                     yearData.rendimiento >= 85 ? 'Bronce' :
                     yearData.rendimiento >= 60 ? 'Mejorar' : 'Taller Conciencia'}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Divisor with Current Year Label */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-dashed border-green-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">
              AÑO ACTUAL - 2025
            </span>
          </div>
        </div>

        {/* Current Year 2025 - Always Show */}
        <div className="flex justify-center">
          <motion.div 
            className="relative p-6 rounded-2xl border-3 backdrop-blur-sm shadow-2xl bg-gradient-to-br from-green-50 via-white to-green-50 border-green-400 min-w-[300px] max-w-[400px]"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              duration: 0.7, 
              ease: "easeOut", 
              delay: 0.7 
            }}
            whileHover={{ 
              scale: 1.03, 
              y: -4,
              transition: { duration: 0.2 }
            }}
          >
            {/* Crown for highest overall performance */}
            {currentPerformance > 0 && currentPerformance === maxPerformance && (
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-xl">
                <Award className="h-4 w-4 text-white" />
              </div>
            )}
            
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-green-800">
                {currentYear}
                {(currentYearData?.isEstimate || isEstimate) && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full ml-2">
                    Est.
                  </span>
                )}
              </div>
              <div className={`text-5xl font-extrabold mb-3 ${
                currentPerformance >= 94 ? 'text-green-600' :
                currentPerformance >= 90 ? 'text-green-500' :
                currentPerformance >= 85 ? 'text-blue-500' :
                currentPerformance >= 60 ? 'text-yellow-600' : 
                currentPerformance > 0 ? 'text-red-500' : 'text-gray-500'
              }`}>
                {currentPerformance > 0 ? `${currentPerformance.toFixed(1)}%` : 'N/A'}
              </div>
              <div className={`text-sm font-bold mb-3 ${
                currentPerformance >= 94 ? 'text-green-600' :
                currentPerformance >= 90 ? 'text-green-500' :
                currentPerformance >= 85 ? 'text-blue-500' :
                currentPerformance >= 60 ? 'text-yellow-600' : 
                currentPerformance > 0 ? 'text-red-500' : 'text-gray-500'
              }`}>
                {currentPerformance >= 94 ? 'ORO' :
                 currentPerformance >= 90 ? 'PLATA' :
                 currentPerformance >= 85 ? 'BRONCE' :
                 currentPerformance >= 60 ? 'MEJORAR' : 
                 currentPerformance > 0 ? 'TALLER CONCIENCIA' : 'INICIANDO AÑO'}
                {(currentYearData?.isEstimate || isEstimate) && (
                  <div className="text-xs text-yellow-600 mt-1">
                    Basado en tendencia
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Monthly Performance Chart Component
interface MonthlyChartProps {
  data: any[]
  year: number
  isLoading?: boolean
}

export const MonthlyPerformanceChart: React.FC<MonthlyChartProps> = ({ data, year, isLoading = false }) => {
  console.log('[DEBUG] MonthlyPerformanceChart received data:', data)
  
  if (isLoading || !data || data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-56 bg-gradient-to-br from-white via-green-50/30 to-white backdrop-blur-sm rounded-2xl border-2 border-green-100/50 p-4 flex items-center justify-center shadow-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full"></div>
            <div className="text-green-700 font-medium">Cargando análisis mensual...</div>
          </div>
        </div>
      </div>
    )
  }

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const monthlyData = months.map((month, index) => {
    const monthData = data.find(item => item.month === index + 1)
    const hasData = !!monthData
    let performance = 0
    
    // Debug: Log the actual data structure for February
    if (index + 1 === 2) {
      console.log(`[DEBUG] February monthData structure:`, monthData)
      console.log(`[DEBUG] February monthData keys:`, monthData ? Object.keys(monthData) : 'null')
    }
    
    if (hasData) {
      // Calculate monthly performance based on km and bonus efficiency
      let kmPercentage = 0
      let bonusPercentage = 0 // Start with 0, use calculated values from data
      
      // Calculate KM efficiency
      if (monthData.valor_programacion && monthData.valor_programacion > 0) {
        kmPercentage = Number(((monthData.valor_ejecucion / monthData.valor_programacion) * 100).toFixed(1))
      }
      
      // PRIORITY 1: Calculate from finalBonus and baseBonus (most accurate)
      if (monthData.baseBonus && monthData.baseBonus > 0 && monthData.finalBonus !== undefined) {
        bonusPercentage = Number(((monthData.finalBonus / monthData.baseBonus) * 100).toFixed(1))
        console.log(`[DEBUG] Month ${month}: Calculated from finalBonus(${monthData.finalBonus})/baseBonus(${monthData.baseBonus})=${bonusPercentage}%`)
      }
      // PRIORITY 2: Use porcentaje if available  
      else if (monthData.porcentaje !== undefined) {
        bonusPercentage = monthData.porcentaje
        console.log(`[DEBUG] Month ${month}: Using porcentaje=${monthData.porcentaje}`)
      } 
      // PRIORITY 3: Use bonusPercentage (least reliable, often incorrect)
      else if (monthData.bonusPercentage !== undefined) {
        bonusPercentage = monthData.bonusPercentage
        console.log(`[DEBUG] Month ${month}: Using bonusPercentage=${monthData.bonusPercentage}`)
      } 
      // FALLBACK: Default logic
      else if (typeof monthData.finalBonus === 'number') {
        bonusPercentage = monthData.finalBonus > 0 ? 100 : 0;
        console.log(`[DEBUG] Month ${month}: Using finalBonus fallback=${bonusPercentage}`)
      }
      
      // Debug log
      console.log(`[DEBUG] Month ${month} (${monthData.month}): kmPercentage=${kmPercentage}, bonusPercentage=${bonusPercentage}`)
      
      // Combined performance (average of both metrics)
      performance = Number(((kmPercentage + bonusPercentage) / 2).toFixed(1))
      
      console.log(`[DEBUG] Month ${month} (${monthData.month}): Final performance=${performance}`)
    }
    
    return {
      month,
      monthNumber: index + 1,
      rendimiento: hasData ? performance : 0, // Set to 0 when no data
      hasData
    }
  })

  console.log('[DEBUG] Processed monthlyData:', monthlyData)

  const currentMonth = new Date().getMonth() + 1
  const maxPerformance = Math.max(...monthlyData.filter(d => d.hasData).map(d => d.rendimiento))
  const minPerformance = Math.min(...monthlyData.filter(d => d.hasData).map(d => d.rendimiento))
  const avgPerformance = Number((
    monthlyData
      .filter(d => d.hasData)
      .reduce((sum, d) => sum + d.rendimiento, 0) / 
    monthlyData.filter(d => d.hasData).length
  ).toFixed(1))

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Monthly Performance Chart */}
      <motion.div 
        className="relative h-56 bg-gradient-to-br from-white via-green-50/30 to-white backdrop-blur-sm rounded-2xl border-2 border-green-100/50 p-4 shadow-lg overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/20 to-green-300/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100/30 to-green-200/20 rounded-full blur-2xl translate-y-12 -translate-x-12" />
        
        <div className="relative z-10 h-full">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="font-bold text-green-800 text-sm">Rendimiento Mensual {year}</h3>
          </div>
          
          <ResponsiveContainer width="100%" height="75%">
            <BarChart data={monthlyData.filter(d => d.hasData)} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="monthlyBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#10b981" opacity={0.15} />
              <XAxis 
                dataKey="month" 
                stroke="#065f46"
                tick={{ fontSize: 11, fill: '#065f46', fontWeight: 600 }}
                tickLine={{ stroke: '#10b981', strokeWidth: 2 }}
                axisLine={{ stroke: '#10b981', strokeWidth: 2 }}
              />
              <YAxis 
                stroke="#065f46"
                tick={{ fontSize: 12, fill: '#065f46', fontWeight: 500 }}
                tickLine={{ stroke: '#10b981', strokeWidth: 2 }}
                axisLine={{ stroke: '#10b981', strokeWidth: 2 }}
                domain={[0, 100]}
                label={{ 
                  value: 'Rendimiento (%)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { textAnchor: 'middle', fontSize: '12px', fill: '#065f46', fontWeight: 600 } 
                }}
              />
              <Tooltip content={<PerformanceTooltip />} />
              
              <Bar 
                dataKey="rendimiento" 
                fill="url(#monthlyBarGradient)"
                stroke="#10b981"
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Monthly Summary Grid */}
      <motion.div 
        className="grid grid-cols-4 gap-2"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
      >
        {monthlyData.filter(d => d.hasData).map((monthData, index) => {
          const isCurrentMonth = monthData.monthNumber === currentMonth
          const isHighest = monthData.hasData && monthData.rendimiento === Math.max(...monthlyData.filter(d => d.hasData).map(d => d.rendimiento))
          
          return (
            <motion.div 
              key={monthData.month}
              className={`
                relative p-2 rounded-lg border backdrop-blur-sm shadow text-center
                ${!monthData.hasData ? 'bg-gray-50 border-gray-200 opacity-50' :
                  isHighest ? 'bg-gradient-to-br from-green-100 via-green-50 to-white border-green-300' : 
                  isCurrentMonth ? 'bg-gradient-to-br from-green-50 via-white to-white border-green-200' :
                  'bg-gradient-to-br from-white via-green-50/20 to-white border-green-100'}
              `}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                ease: "easeOut", 
                delay: 0.4 + index * 0.05 
              }}
              whileHover={{ 
                scale: 1.05, 
                y: -2,
                transition: { duration: 0.2 }
              }}
            >
              {isHighest && monthData.hasData && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow">
                  <Award className="h-2 w-2 text-white" />
                </div>
              )}
              
              <div className="text-xs font-medium text-green-700 mb-1">{monthData.month}</div>
              
              {monthData.hasData ? (
                <>
                  <div className={`text-lg font-bold mb-1 ${
                    monthData.rendimiento >= 94 ? 'text-green-600' :
                    monthData.rendimiento >= 90 ? 'text-green-500' :
                    monthData.rendimiento >= 85 ? 'text-blue-500' :
                    monthData.rendimiento >= 60 ? 'text-yellow-600' : 'text-red-500'
                  }`}>
                    {monthData.rendimiento.toFixed(1)}%
                  </div>
                  <div className={`text-xs ${
                    monthData.rendimiento >= 94 ? 'text-green-600' :
                    monthData.rendimiento >= 90 ? 'text-green-500' :
                    monthData.rendimiento >= 85 ? 'text-blue-500' :
                    monthData.rendimiento >= 60 ? 'text-yellow-600' : 'text-red-500'
                  }`}>
                    {monthData.rendimiento >= 94 ? 'Oro' :
                     monthData.rendimiento >= 90 ? 'Plata' :
                     monthData.rendimiento >= 85 ? 'Bronce' :
                     monthData.rendimiento >= 60 ? 'Mejorar' : 'Taller Conc.'}
                  </div>
                </>
              ) : (
                <div className="text-gray-400 text-xs">Sin datos</div>
              )}
            </motion.div>
          )
        })}
      </motion.div>

      {/* Monthly Summary Stats */}
      <motion.div 
        className="bg-gradient-to-r from-green-50/80 via-white/60 to-green-50/80 backdrop-blur-sm rounded-xl p-4 border-2 border-green-100/50 shadow-lg"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
      >
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-green-800">Promedio del año:</span>
          </div>
          <span className="font-bold text-green-700 text-lg">{avgPerformance}%</span>
        </div>
        <div className="flex justify-between text-xs text-green-600/80">
          <span>Meses con datos: {monthlyData.filter(d => d.hasData).length}/12</span>
          <span>Máximo: {maxPerformance}% | Mínimo: {minPerformance}%</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Kilometers Monthly Chart Component
interface KilometersChartProps {
  data: any[]
  year: number
  isLoading?: boolean
}

export const KilometersMonthlyChart: React.FC<KilometersChartProps> = ({ data, year, isLoading = false }) => {
  if (isLoading || !data || data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-56 bg-gradient-to-br from-white via-green-50/30 to-white backdrop-blur-sm rounded-2xl border-2 border-green-100/50 p-4 flex items-center justify-center shadow-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full"></div>
            <div className="text-green-700 font-medium">Cargando análisis de kilómetros...</div>
          </div>
        </div>
      </div>
    )
  }

  // Prepare monthly data - create array for all 12 months
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const monthlyData = months.map((month, index) => {
    const monthData = data.find(item => item.month === index + 1)
    const porcentaje = monthData?.valor_programacion > 0 ? 
      Number(((monthData.valor_ejecucion / monthData.valor_programacion) * 100).toFixed(1)) : 0
    
    return {
      month,
      monthNumber: index + 1,
      ejecutado: monthData?.valor_ejecucion || 0,
      programado: monthData?.valor_programacion || 0,
      porcentaje: porcentaje,
      hasData: !!monthData
    }
  })

  const currentMonth = new Date().getMonth() + 1
  const maxPorcentaje = Math.max(...monthlyData.filter(d => d.hasData).map(d => d.porcentaje))
  const minPorcentaje = Math.min(...monthlyData.filter(d => d.hasData).map(d => d.porcentaje))
  const totalEjecutado = monthlyData.filter(d => d.hasData).reduce((sum, d) => sum + d.ejecutado, 0)
  const totalProgramado = monthlyData.filter(d => d.hasData).reduce((sum, d) => sum + d.programado, 0)
  const avgPercentage = totalProgramado > 0 ? Math.round((totalEjecutado / totalProgramado) * 100) : 0

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Kilometers Chart */}
      <motion.div 
        className="relative h-64 bg-gradient-to-br from-white via-green-50/30 to-white backdrop-blur-sm rounded-2xl border-2 border-green-100/50 p-4 shadow-lg overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/20 to-green-300/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100/30 to-green-200/20 rounded-full blur-2xl translate-y-12 -translate-x-12" />
        
        <div className="relative z-10 h-full">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="font-bold text-green-800 text-sm">Rendimiento Kilómetros {year}</h3>
          </div>
          
          <ResponsiveContainer width="100%" height="75%">
            <BarChart data={monthlyData.filter(d => d.hasData)} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="kmBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#10b981" opacity={0.15} />
              <XAxis 
                dataKey="month" 
                stroke="#065f46"
                tick={{ fontSize: 11, fill: '#065f46', fontWeight: 600 }}
                tickLine={{ stroke: '#10b981', strokeWidth: 2 }}
                axisLine={{ stroke: '#10b981', strokeWidth: 2 }}
              />
              <YAxis 
                domain={[0, 120]}
                stroke="#065f46"
                tick={{ fontSize: 12, fill: '#065f46', fontWeight: 500 }}
                tickLine={{ stroke: '#10b981', strokeWidth: 2 }}
                axisLine={{ stroke: '#10b981', strokeWidth: 2 }}
                label={{ 
                  value: 'Rendimiento (%)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { textAnchor: 'middle', fontSize: '12px', fill: '#065f46', fontWeight: 600 } 
                }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value}%`, 'Rendimiento']}
                labelFormatter={(label) => `${label}`}
                contentStyle={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,244,0.8) 100%)',
                  border: '2px solid rgba(16,185,129,0.3)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(8px)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              />
              
              <Bar 
                dataKey="porcentaje" 
                fill="url(#kmBarGradient)"
                stroke="#10b981"
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
                name="Rendimiento"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Monthly Summary Grid */}
      <motion.div 
        className="grid grid-cols-4 gap-2"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
      >
        {monthlyData.filter(d => d.hasData).map((monthData, index) => {
          const isCurrentMonth = monthData.monthNumber === currentMonth
          const isHighest = monthData.hasData && monthData.porcentaje === maxPorcentaje
          
          return (
            <motion.div 
              key={monthData.month}
              className={`
                relative p-2 rounded-lg border backdrop-blur-sm shadow text-center
                ${!monthData.hasData ? 'bg-gray-50 border-gray-200 opacity-50' :
                  isHighest ? 'bg-gradient-to-br from-green-100 via-green-50 to-white border-green-300' : 
                  isCurrentMonth ? 'bg-gradient-to-br from-green-50 via-white to-white border-green-200' :
                  'bg-gradient-to-br from-white via-green-50/20 to-white border-green-100'}
              `}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                ease: "easeOut", 
                delay: 0.4 + index * 0.05 
              }}
              whileHover={monthData.hasData ? { 
                scale: 1.05, 
                y: -2,
                transition: { duration: 0.2 }
              } : {}}
            >
              {isHighest && monthData.hasData && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow">
                  <Award className="h-2 w-2 text-white" />
                </div>
              )}
              
              <div className="text-xs font-medium text-green-700 mb-1">{monthData.month}</div>
              
              {monthData.hasData ? (
                <>
                  <div className="text-lg font-bold text-green-700 mb-1">
                      {monthData.porcentaje.toFixed(1)}%
                  </div>
                  <div className="text-xs text-green-600/70">
                    {(monthData.ejecutado / 1000).toFixed(1)}K km
                  </div>
                </>
              ) : (
                <div className="text-gray-400 text-xs">Sin datos</div>
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}

// Bonus Monthly Chart Component
interface BonusChartProps {
  data: any[]
  year: number
  isLoading?: boolean
}

export const BonusMonthlyChart: React.FC<BonusChartProps> = ({ data, year, isLoading = false }) => {
  console.log("[DEBUG] BonusMonthlyChart received:", { data, year, isLoading, dataLength: data?.length })
  
  // Check if we're loading OR if there's no meaningful data
  const hasValidData = data && Array.isArray(data) && data.length > 0
  
  if (isLoading) {
    console.log("[DEBUG] BonusMonthlyChart showing loading state - isLoading true")
    return (
      <div className="space-y-4">
        <div className="h-56 bg-gradient-to-br from-white via-green-50/30 to-white backdrop-blur-sm rounded-2xl border-2 border-green-100/50 p-4 flex items-center justify-center shadow-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full"></div>
            <div className="text-green-700 font-medium">Cargando análisis de bonificaciones...</div>
          </div>
        </div>
      </div>
    )
  }
  
  if (!hasValidData) {
    console.log("[DEBUG] BonusMonthlyChart showing empty state - no valid data")
    return (
      <div className="space-y-4">
        <div className="h-56 bg-gradient-to-br from-white via-green-50/30 to-white backdrop-blur-sm rounded-2xl border-2 border-green-100/50 p-4 flex items-center justify-center shadow-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-green-700 font-medium text-center">
              <div>No hay datos de bonificaciones</div>
              <div className="text-sm text-green-600 opacity-75 mt-1">para el año {year}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Prepare monthly data - create array for all 12 months
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago']
  const monthlyData = months.map((month, index) => {
    const monthNumber = index + 1
    const monthData = data.find(item => 
      item.month === monthNumber || 
      item.monthNumber === monthNumber
    )
    
    // Handle different data structure possibilities
    const bonusValue = monthData?.bonusValue || monthData?.baseBonus || 0
    const finalValue = monthData?.finalValue || monthData?.finalBonus || 0
    
    // Calculate percentage safely - only if we have REAL bonus data
    let porcentaje = 0
    if (bonusValue > 0) {
      porcentaje = Number(((finalValue / bonusValue) * 100).toFixed(1))
    }
    // Don't assume 100% for months without real data
    
    // Smart validation: Only consider hasData if we have meaningful bonus values AND it's not a future month
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1  // JavaScript months are 0-based
    
    const isCurrentOrPastMonth = year < currentYear || (year === currentYear && monthNumber <= currentMonth)
    const hasData = !!monthData && bonusValue > 0 && isCurrentOrPastMonth
    
    // Debug log for problematic months
    if (monthNumber >= 9) {  // Sep, Oct, Nov, Dic
      console.log(`[DEBUG] BonusMonthlyChart ${month} (${monthNumber}):`, {
        monthData: !!monthData,
        bonusValue,
        finalValue,
        porcentaje,
        isCurrentOrPastMonth,
        hasData
      })
    }
    
    return {
      month,
      monthNumber,
      bonusValue: Math.max(0, bonusValue),
      finalValue: Math.max(0, finalValue),
      porcentaje: Math.max(0, Math.min(100, porcentaje)), // Clamp between 0-100
      hasData
    }
  })
  
  console.log("[DEBUG] Processed monthlyData:", monthlyData)

  const currentMonth = new Date().getMonth() + 1
  const dataWithValues = monthlyData.filter(d => d.hasData)
  const maxPorcentaje = dataWithValues.length > 0 ? Math.max(...dataWithValues.map(d => d.porcentaje)) : 0
  const minPorcentaje = dataWithValues.length > 0 ? Math.min(...dataWithValues.map(d => d.porcentaje)) : 0
  const totalBonusValue = dataWithValues.reduce((sum, d) => sum + d.bonusValue, 0)
  const totalFinalValue = dataWithValues.reduce((sum, d) => sum + d.finalValue, 0)
  const avgPercentage = totalBonusValue > 0 ? Math.round((totalFinalValue / totalBonusValue) * 100) : 0

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Bonus Chart */}
      <motion.div 
        className="relative h-64 bg-gradient-to-br from-white via-green-50/30 to-white backdrop-blur-sm rounded-2xl border-2 border-green-100/50 p-4 shadow-lg overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/20 to-green-300/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100/30 to-green-200/20 rounded-full blur-2xl translate-y-12 -translate-x-12" />
        
        <div className="relative z-10 h-full">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="font-bold text-green-800 text-sm">Rendimiento Bonificaciones {year}</h3>
          </div>
          
          <ResponsiveContainer width="100%" height="75%">
            <BarChart data={monthlyData.filter(d => d.hasData)} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="bonusBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#10b981" opacity={0.15} />
              <XAxis 
                dataKey="month" 
                stroke="#065f46"
                tick={{ fontSize: 11, fill: '#065f46', fontWeight: 600 }}
                tickLine={{ stroke: '#10b981', strokeWidth: 2 }}
                axisLine={{ stroke: '#10b981', strokeWidth: 2 }}
              />
              <YAxis 
                domain={[0, 120]}
                stroke="#065f46"
                tick={{ fontSize: 12, fill: '#065f46', fontWeight: 500 }}
                tickLine={{ stroke: '#10b981', strokeWidth: 2 }}
                axisLine={{ stroke: '#10b981', strokeWidth: 2 }}
                label={{ 
                  value: 'Bonificación (%)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { textAnchor: 'middle', fontSize: '12px', fill: '#065f46', fontWeight: 600 } 
                }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value}%`, 'Bonificación']}
                labelFormatter={(label) => `${label}`}
                contentStyle={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,244,0.8) 100%)',
                  border: '2px solid rgba(16,185,129,0.3)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(8px)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              />
              
              <Bar 
                dataKey="porcentaje" 
                fill="url(#bonusBarGradient)"
                stroke="#10b981"
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
                name="Bonificación"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Monthly Summary Grid */}
      <motion.div 
        className="grid grid-cols-4 gap-2"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
      >
        {monthlyData.filter(d => d.hasData).map((monthData, index) => {
          const isCurrentMonth = monthData.monthNumber === currentMonth
          const isHighest = monthData.hasData && monthData.porcentaje === maxPorcentaje
          
          return (
            <motion.div 
              key={monthData.month}
              className={`
                relative p-2 rounded-lg border backdrop-blur-sm shadow text-center
                ${!monthData.hasData ? 'bg-gray-50 border-gray-200 opacity-50' :
                  isHighest ? 'bg-gradient-to-br from-green-100 via-green-50 to-white border-green-300' : 
                  isCurrentMonth ? 'bg-gradient-to-br from-green-50 via-white to-white border-green-200' :
                  'bg-gradient-to-br from-white via-green-50/20 to-white border-green-100'}
              `}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                ease: "easeOut", 
                delay: 0.4 + index * 0.05 
              }}
              whileHover={monthData.hasData ? { 
                scale: 1.05, 
                y: -2,
                transition: { duration: 0.2 }
              } : {}}
            >
              {isHighest && monthData.hasData && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow">
                  <Award className="h-2 w-2 text-white" />
                </div>
              )}
              
              <div className="text-xs font-medium text-green-700 mb-1">{monthData.month}</div>
              
              {monthData.hasData ? (
                <>
                  <div className="text-lg font-bold text-green-700 mb-1">
                      {monthData.porcentaje.toFixed(1)}%
                  </div>
                  <div className="text-xs text-green-600/70">
                    ${(monthData.finalValue / 1000).toFixed(1)}K
                  </div>
                </>
              ) : (
                <div className="text-gray-400 text-xs">Sin datos</div>
              )}
            </motion.div>
          )
        })}
      </motion.div>

      {/* Bonus Summary Stats */}
      <motion.div 
        className="bg-gradient-to-r from-green-50/80 via-white/60 to-green-50/80 backdrop-blur-sm rounded-xl p-4 border-2 border-green-100/50 shadow-lg"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-800 text-sm">Total Bonificado:</span>
            </div>
            <div className="text-lg font-bold text-green-700">${totalFinalValue.toLocaleString()}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-green-800 text-sm">Eficiencia:</span>
            </div>
            <div className="text-lg font-bold text-green-700">{avgPercentage}%</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-green-100 flex justify-between text-xs text-green-600/80">
          <span>Meses con datos: {dataWithValues.length}/12</span>
          {dataWithValues.length > 0 && (
            <span>Máximo: {maxPorcentaje}% | Mínimo: {minPorcentaje}%</span>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
