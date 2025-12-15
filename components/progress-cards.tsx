/**
 * Archivo de compatibilidad - Re-exporta componentes desde la estructura modular
 * 
 * Este archivo mantiene la compatibilidad con importaciones existentes.
 * Para nuevas implementaciones, se recomienda importar directamente desde:
 * @/components/progress-cards
 * 
 * Estructura modular:
 * - progress-cards/types.ts          - Interfaces y tipos
 * - progress-cards/hooks.ts          - Hooks personalizados
 * - progress-cards/utils.ts          - Funciones utilitarias
 * - progress-cards/api.ts            - Funciones de API
 * - progress-cards/card-variants.ts  - Variantes de animación
 * - progress-cards/decorative-pattern.tsx - Componente decorativo
 * - progress-cards/kilometers-card.tsx    - Tarjeta de kilómetros
 * - progress-cards/bonus-card.tsx         - Tarjeta de bonificaciones
 * - progress-cards/annual-progress-card.tsx  - Tarjeta de progreso anual
 * - progress-cards/monthly-progress-card.tsx - Tarjeta de progreso mensual
 * - progress-cards/index.tsx               - Exportaciones principales
 */

// Re-exportar todo desde el módulo principal (usando ruta explícita al index)
export * from "./progress-cards/index"

// Exportar el componente principal por defecto
export { default } from "./progress-cards/index"