/**
 * Configuración de bonos por año
 * Cada año tiene un valor base diferente para los bonos
 */

// Valores base de bonos por año
export const BONUS_BASE_VALUES: Record<number, number> = {
  2025: 142000, // Valor actual
  2024: 135000, // Año pasado (actualizado según la interfaz)
  2023: 128000, // 2023
  2022: 122000, // 2022
  2021: 122000, // 2021
  2020: 122000  // 2020 y anteriores
};

/**
 * Obtiene el valor base del bono según el año
 * @param year Año para el cual se quiere obtener el valor base
 * @returns Valor base del bono para ese año
 */
export const getBonusBaseValue = (year: number): number => {
  // Si el año existe en la configuración, devolver ese valor
  if (BONUS_BASE_VALUES[year]) {
    return BONUS_BASE_VALUES[year];
  }
  
  // Si el año es anterior a los definidos, usar el valor más antiguo
  if (year < Math.min(...Object.keys(BONUS_BASE_VALUES).map(Number))) {
    return BONUS_BASE_VALUES[2020]; // Valor para años anteriores
  }
  
  // Si el año es posterior a los definidos, usar el valor más reciente
  return BONUS_BASE_VALUES[2025]; // Valor actual
};

/**
 * Calcula el valor del bono según el año y el porcentaje de eficiencia
 * @param year Año para el cálculo
 * @param percentage Porcentaje de eficiencia (0-100)
 * @returns Valor del bono calculado
 */
export const calculateBonusValue = (year: number, percentage: number): number => {
  const baseValue = getBonusBaseValue(year);
  
  // Ajustar el porcentaje (máximo 100%)
  const adjustedPercentage = Math.min(percentage, 100) / 100;
  
  // Calcular el valor del bono
  return baseValue * adjustedPercentage;
};

/**
 * Determina la categoría de bono y su valor monetario
 * @param year Año para el cálculo
 * @param percentage Porcentaje de eficiencia
 * @returns Objeto con la categoría y el valor del bono
 */
export const determineBonusWithValue = (year: number, percentage: number): { 
  category: string; 
  value: number;
} => {
  let category = "Taller Conciencia";
  
  // Determinar categoría según el porcentaje
  if (percentage >= 100) {
    category = "Oro";
  } else if (percentage >= 95) {
    category = "Plata";
  } else if (percentage >= 90) {
    category = "Bronce";
  } else if (percentage >= 60) {
    category = "Mejorar";
  }
  
  // Calcular el valor monetario del bono
  const value = calculateBonusValue(year, percentage);
  
  return { category, value };
};
