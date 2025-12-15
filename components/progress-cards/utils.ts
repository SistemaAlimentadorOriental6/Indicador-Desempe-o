// Funciones utilitarias para las tarjetas de progreso

// Bandera de depuración - configurar a true para habilitar modo debug
const MODO_DEBUG = true

/**
 * Función de registro de depuración
 * Solo imprime en consola si MODO_DEBUG está activo
 */
export function registroDebug(...args: any[]) {
    if (MODO_DEBUG) {
        console.log("[DEBUG]", ...args)
    }
}

/**
 * Obtiene el nombre del mes en español
 * @param numeroMes - Número del mes (1-12)
 * @returns Nombre del mes en español
 */
export function obtenerNombreMes(numeroMes: number): string {
    const meses = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
    ]
    const indice = Math.max(0, Math.min(11, Number(numeroMes) - 1))
    return meses[indice] || ""
}

/**
 * Formatea un número de forma segura evitando concatenaciones
 * @param valor - Valor a formatear
 * @param valorPorDefecto - Valor por defecto si el valor es inválido
 * @returns Número formateado
 */
export function formatoNumeroSeguro(valor: any, valorPorDefecto: number = 0): number {
    if (valor === null || valor === undefined || valor === "") {
        return valorPorDefecto
    }

    const num = Number(valor)
    if (isNaN(num)) {
        return valorPorDefecto
    }

    return isFinite(num) ? num : valorPorDefecto
}

/**
 * Obtiene el bono base según el año
 * @param year - Año a consultar
 * @returns Valor del bono base para ese año
 */
export function obtenerBonoBaseAnual(year: number): number {
    switch (year) {
        case 2025:
            return 142000
        case 2024:
            return 135000
        case 2023:
            return 128000
        case 2022:
        case 2021:
        case 2020:
            return 122000
        default:
            return 122000
    }
}

/**
 * Formatea un número con separadores de miles (formato colombiano)
 * @param num - Número a formatear
 * @returns Cadena formateada
 */
export function formatearNumero(num: number): string {
    return new Intl.NumberFormat("es-CO", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num)
}

/**
 * Formatea una cantidad como moneda (sin símbolo, solo formato)
 * @param cantidad - Cantidad a formatear
 * @returns Cadena formateada
 */
export function formatearMoneda(cantidad: number): string {
    return new Intl.NumberFormat("es-CO", {
        style: "decimal",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(cantidad)
}
