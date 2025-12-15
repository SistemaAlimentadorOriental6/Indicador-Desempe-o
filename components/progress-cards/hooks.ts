"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { api } from "./api"

// Cache global en memoria para deduplicar solicitudes
const requestCache = new Map<string, Promise<any>>()
const dataCache = new Map<string, { data: any; timestamp: number }>()

// TTL del cache en memoria (5 minutos)
const CACHE_TTL = 5 * 60 * 1000

/**
 * Genera una clave única para la solicitud
 */
function generarClave(tipo: 'km' | 'bonos', userCode: string, year?: number, month?: number): string {
    return `${tipo}:${userCode}:${year || 'all'}:${month || 'all'}`
}

/**
 * Ejecuta una solicitud con deduplicación
 * Si ya hay una solicitud en curso con la misma clave, reutiliza esa promesa
 */
async function ejecutarConDeduplicacion<T>(
    clave: string,
    ejecutar: () => Promise<T>
): Promise<T> {
    // Verificar si hay datos en cache válidos
    const cached = dataCache.get(clave)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
    }

    // Verificar si hay una solicitud en curso
    const enCurso = requestCache.get(clave)
    if (enCurso) {
        return enCurso
    }

    // Crear nueva solicitud
    const promesa = ejecutar()
        .then(data => {
            // Guardar en cache
            dataCache.set(clave, { data, timestamp: Date.now() })
            // Limpiar solicitud en curso
            requestCache.delete(clave)
            return data
        })
        .catch(error => {
            // Limpiar solicitud en curso en caso de error
            requestCache.delete(clave)
            throw error
        })

    // Guardar referencia a solicitud en curso
    requestCache.set(clave, promesa)
    return promesa
}

/**
 * Hook para obtener kilómetros con deduplicación y cache
 */
export function useKilometros(userCode: string, year?: number, month?: number) {
    const [data, setData] = useState<any>(null)
    const [estaCargando, setEstaCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const mountedRef = useRef(true)

    const cargar = useCallback(async () => {
        if (!userCode) return

        const clave = generarClave('km', userCode, year, month)

        try {
            setEstaCargando(true)
            setError(null)

            const resultado = await ejecutarConDeduplicacion(clave, () =>
                api.obtenerKilometros({ userCode, year, month })
            )

            if (mountedRef.current) {
                setData(resultado)
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err instanceof Error ? err.message : "Error desconocido")
            }
        } finally {
            if (mountedRef.current) {
                setEstaCargando(false)
            }
        }
    }, [userCode, year, month])

    useEffect(() => {
        mountedRef.current = true
        cargar()
        return () => {
            mountedRef.current = false
        }
    }, [cargar])

    return { data, estaCargando, error, recargar: cargar }
}

/**
 * Hook para obtener bonificaciones con deduplicación y cache
 */
export function useBonificaciones(userCode: string, year?: number, month?: number) {
    const [data, setData] = useState<any>(null)
    const [estaCargando, setEstaCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const mountedRef = useRef(true)

    const cargar = useCallback(async () => {
        if (!userCode) return

        const clave = generarClave('bonos', userCode, year, month)

        try {
            setEstaCargando(true)
            setError(null)

            const resultado = await ejecutarConDeduplicacion(clave, () =>
                api.obtenerBonificaciones({ userCode, year, month })
            )

            if (mountedRef.current) {
                setData(resultado)
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err instanceof Error ? err.message : "Error desconocido")
            }
        } finally {
            if (mountedRef.current) {
                setEstaCargando(false)
            }
        }
    }, [userCode, year, month])

    useEffect(() => {
        mountedRef.current = true
        cargar()
        return () => {
            mountedRef.current = false
        }
    }, [cargar])

    return { data, estaCargando, error, recargar: cargar }
}

/**
 * Hook combinado para obtener datos de años disponibles una sola vez
 */
export function useDatosDisponibles(userCode: string) {
    const [aniosDisponibles, setAniosDisponibles] = useState<number[]>([])
    const [mesesDisponibles, setMesesDisponibles] = useState<number[]>([])
    const [estaCargando, setEstaCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const mountedRef = useRef(true)

    useEffect(() => {
        if (!userCode) return

        mountedRef.current = true
        const clave = generarClave('km', userCode)

        const cargar = async () => {
            try {
                setEstaCargando(true)
                const resultado = await ejecutarConDeduplicacion(clave, () =>
                    api.obtenerKilometros({ userCode })
                )

                if (mountedRef.current) {
                    setAniosDisponibles(resultado.availableYears || [])
                    setMesesDisponibles(resultado.availableMonths || [])
                }
            } catch (err) {
                if (mountedRef.current) {
                    setError(err instanceof Error ? err.message : "Error desconocido")
                }
            } finally {
                if (mountedRef.current) {
                    setEstaCargando(false)
                }
            }
        }

        cargar()
        return () => {
            mountedRef.current = false
        }
    }, [userCode])

    return { aniosDisponibles, mesesDisponibles, estaCargando, error }
}

/**
 * Hook para animar un contador numérico
 */
export function useContadorAnimado(valorObjetivo: number, duracion = 1500, retraso = 0) {
    const [valor, setValor] = useState(0)
    const refTiempoInicio = useRef<number | null>(null)
    const refFrame = useRef<number | null>(null)

    useEffect(() => {
        if (refFrame.current) {
            cancelAnimationFrame(refFrame.current)
        }

        const iniciarAnimacion = () => {
            refTiempoInicio.current = Date.now() + retraso

            const actualizarValor = () => {
                const ahora = Date.now()
                if (refTiempoInicio.current && ahora < refTiempoInicio.current) {
                    refFrame.current = requestAnimationFrame(actualizarValor)
                    return
                }

                const transcurrido = refTiempoInicio.current ? ahora - refTiempoInicio.current : 0
                const progreso = Math.min(1, transcurrido / duracion)
                const progresoSuavizado = progreso === 1 ? 1 : 1 - Math.pow(2, -10 * progreso)

                if (progreso === 1) {
                    setValor(valorObjetivo)
                } else {
                    setValor(Math.floor(progresoSuavizado * valorObjetivo))
                    refFrame.current = requestAnimationFrame(actualizarValor)
                }
            }

            refFrame.current = requestAnimationFrame(actualizarValor)
        }

        iniciarAnimacion()

        return () => {
            if (refFrame.current) {
                cancelAnimationFrame(refFrame.current)
            }
        }
    }, [valorObjetivo, duracion, retraso])

    return valor
}

/**
 * Invalida el cache para un usuario específico
 */
export function invalidarCacheUsuario(userCode: string) {
    const keysToDelete: string[] = []
    dataCache.forEach((_, key) => {
        if (key.includes(`:${userCode}:`)) {
            keysToDelete.push(key)
        }
    })
    keysToDelete.forEach(key => dataCache.delete(key))
}

/**
 * Limpia todo el cache
 */
export function limpiarCache() {
    requestCache.clear()
    dataCache.clear()
}
