/**
 * Utility functions for consistent formatting across the application
 */

/**
 * Format a number as a string with thousands separator
 * This ensures consistent formatting between server and client
 * to avoid hydration errors
 * 
 * @param value The number to format
 * @param useLocale Whether to use locale-specific formatting (client-side only)
 * @param decimals Number of decimal places to include (default: 0)
 * @returns Formatted number string
 */
export const formatNumber = (value: number | null | undefined, useLocale = false, decimals = 0): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return decimals > 0 ? '0.' + '0'.repeat(decimals) : '0';
  }
  
  // For SSR, use a consistent format that won't cause hydration errors
  if (!useLocale) {
    if (decimals > 0) {
      return value.toFixed(decimals);
    }
    return value.toString();
  }
  
  // Only use locale-specific formatting for client-side rendering
  // after hydration is complete
  return decimals > 0 
    ? value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : value.toLocaleString();
};

/**
 * Format a percentage value
 * 
 * @param value The percentage value
 * @param decimals Number of decimal places to include (default: 0)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number | null | undefined, decimals = 0): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return decimals > 0 ? '0.' + '0'.repeat(decimals) + '%' : '0%';
  }
  
  return decimals > 0
    ? `${value.toFixed(decimals)}%`
    : `${value}%`;
};

/**
 * Format a date string to a human-readable format
 * 
 * @param dateString The date string to format (YYYY-MM-DD or ISO format)
 * @param defaultValue Value to return if date is invalid
 * @returns Formatted date string (DD/MM/YYYY)
 */
export const formatDate = (dateString: string | null | undefined, defaultValue: string = 'Sin fecha'): string => {
  if (!dateString) return defaultValue;
  if (dateString === 'Sin fecha') return defaultValue;
  
  try {
    // Intentar diferentes formatos de fecha
    let date: Date;
    
    // Verificar si la fecha ya tiene el formato DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/');
      date = new Date(`${year}-${month}-${day}`);
    } else {
      // Intentar con el formato estándar
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.log('Fecha inválida:', dateString);
      return defaultValue;
    }
    
    // Format as DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.log('Error al formatear fecha:', dateString, error);
    return defaultValue;
  }
};
