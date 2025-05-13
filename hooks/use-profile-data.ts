"use client"

import { useState, useEffect } from "react"

interface ProfileData {
  cedula: string
  zona: string
  cargo: string
}

export function useProfileData(cedula?: string) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!cedula) return

    const fetchProfileData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Asegurarnos de que la cédula sea una cadena
        const cedulaStr = String(cedula).trim()
        console.log("Solicitando datos de perfil para cédula:", cedulaStr)

        // Usar un timestamp para evitar caché del navegador
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/user/profile-data?cedulas=${cedulaStr}&_t=${timestamp}`)

        if (!response.ok) {
          throw new Error(`Error al obtener datos del perfil: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Datos recibidos de la API:", data)

        if (!data.profileData || !Array.isArray(data.profileData) || data.profileData.length === 0) {
          console.warn("La API no devolvió datos de perfil válidos")
          setProfileData({
            cedula: cedulaStr,
            zona: "Zona no disponible",
            cargo: "Cargo no disponible",
          })
          return
        }

        // La API devuelve un array de profileData, encontramos el que corresponde a esta cédula
        // Convertimos ambas cédulas a string para comparar
        const userProfile = data.profileData.find((p: ProfileData) => String(p.cedula).trim() === cedulaStr)

        if (userProfile) {
          console.log("Perfil de usuario encontrado:", userProfile)
          setProfileData(userProfile)
        } else {
          console.warn("No se encontró perfil para la cédula:", cedulaStr)
          // Crear un perfil con valores predeterminados si no se encuentra
          setProfileData({
            cedula: cedulaStr,
            zona: "Zona no disponible",
            cargo: "Cargo no disponible",
          })
        }
      } catch (err) {
        console.error("Error fetching profile data:", err)
        setError("No se pudieron cargar los datos del perfil")
        // Establecer valores predeterminados en caso de error
        setProfileData({
          cedula: String(cedula),
          zona: "Zona no disponible",
          cargo: "Cargo no disponible",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileData()
  }, [cedula])

  // Añadir un log para depuración
  useEffect(() => {
    console.log("useProfileData - Estado actual:", { profileData, isLoading, error, cedula })
  }, [profileData, isLoading, error, cedula])

  return { profileData, isLoading, error }
}
