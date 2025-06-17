import { AlertTriangle, FileText, TrendingDown } from "lucide-react"
import { formatNumber } from "./format-utils"

/**
 * Format a number as currency (COP)
 * Uses a consistent format for server-side rendering
 * to avoid hydration errors
 */
export const formatCurrency = (amount: number | null | undefined) => {
  // Handle null, undefined, NaN or invalid values
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }
  
  // For SSR compatibility, use a simple format
  // This ensures the server and client render the same string
  // We can add the $ symbol manually to avoid locale differences
  return `$ ${formatNumber(amount)}`;
}

// Return icon component name as string instead of JSX
export const getNovedadIcon = (tipoIcono: string) => {
  switch (tipoIcono) {
    case "descargo":
      return "AlertTriangle";
    case "incapacidad":
      return "FileText";
    case "suspension":
      return "TrendingDown";
    case "retardo":
      return "AlertTriangle";
    case "daño":
      return "AlertTriangle";
    default:
      return "FileText";
  }
}

// Determinar el tipo de icono basado en el código de afectación
export const getTipoIcono = (codigo: string): string => {
  // Códigos numéricos
  if (codigo === "1" || codigo === "3" || codigo === "4") return "incapacidad";
  if (codigo === "2" || codigo === "9" || codigo === "11") return "suspension";
  if (codigo === "5" || codigo === "12") return "retardo";
  
  // Códigos alfabéticos
  if (["DL", "DG", "DGV"].includes(codigo)) return "daño";
  if (["DEL", "DEG", "DEGV"].includes(codigo)) return "descargo";
  if (["OM", "OMD", "OG"].includes(codigo)) return "descargo";
  
  return "descargo";
}

/**
 * Obtiene el porcentaje de descuento basado en el código de afectación
 * @param codigo Código de afectación
 * @returns Porcentaje de descuento o "Día" si es un descuento por día
 */
export const getDescuentoPorcentaje = (codigo: string): number | string => {
  const descuentos: Record<string, number | string> = {
    // Códigos numéricos
    "1": 100, // Incapacidad
    "2": 100, // Suspensión
    "3": 100, // Incapacidad
    "4": 100, // Incapacidad
    "5": "Día", // Retardo
    "9": 100, // Suspensión
    "11": 100, // Suspensión
    "12": "Día", // Retardo
    
    // Códigos alfabéticos
    "DL": 100, // Daño
    "DG": 100, // Daño
    "DGV": 100, // Daño
    "DEL": 50, // Descargo
    "DEG": 50, // Descargo
    "DEGV": 50, // Descargo
    "OM": 25, // Omisión
    "OMD": 25, // Omisión
    "OG": 25, // Omisión
  };
  
  return descuentos[codigo] || 0;
}

export const getEficienciaColor = (eficiencia: number) => {
  if (eficiencia >= 95) return "text-green-700 bg-green-50 border-green-200";
  if (eficiencia >= 85) return "text-green-600 bg-green-50 border-green-200";
  if (eficiencia >= 75) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-red-600 bg-red-50 border-red-200";
}
