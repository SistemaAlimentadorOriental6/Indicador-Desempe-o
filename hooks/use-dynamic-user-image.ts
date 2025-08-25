"use client"

import { useState, useEffect } from "react"

export function useDynamicUserImage(cedula?: string) {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!cedula) {
      setIsLoading(false)
      return
    }

    const findImage = async () => {
      setIsLoading(true)
      const extensions = ["jpg", "jpeg", "png"]
      const baseUrl = `https://admon.sao6.com.co/web/uploads/empleados/${cedula}`
      let foundUrl: string | null = null

      for (const ext of extensions) {
        const url = `${baseUrl}.${ext}`
        try {
          await new Promise((resolve, reject) => {
            const img = new Image()
            img.src = url
            img.onload = resolve
            img.onerror = reject
          })
          foundUrl = url
          break // Image found, exit loop
        } catch (error) {
          // Image not found with this extension, try next
        }
      }

      setImgSrc(foundUrl)
      setIsLoading(false)
    }

    findImage()
  }, [cedula])

  return { imgSrc, isLoading }
}
