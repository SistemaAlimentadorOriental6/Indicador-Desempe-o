"use client"

import type React from "react"

interface PerformanceChartProps {
  data: number[]
  small?: boolean
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, small = false }) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  return (
    <div className={`flex items-end space-x-1 ${small ? "h-6" : "h-12"}`}>
      {data.map((value, index) => {
        const height = ((value - min) / range) * 100
        return (
          <div
            key={index}
            className={`${small ? "w-1" : "w-2"} bg-gradient-to-t from-primary-200 to-primary-500 rounded-full transition-all duration-500 hover:from-primary-300 hover:to-primary-600`}
            style={{ height: `${Math.max(height, 15)}%` }}
            title={`Día ${index + 1}: ${value}%`}
          />
        )
      })}
    </div>
  )
}
