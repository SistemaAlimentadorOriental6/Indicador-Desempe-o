"\"use client"

import { useState, useEffect } from "react"

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Check initial window size
    const checkSize = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Set initial value
    checkSize()

    // Add event listener for window resize
    window.addEventListener("resize", checkSize)

    // Clean up event listener
    return () => {
      window.removeEventListener("resize", checkSize)
    }
  }, [breakpoint])

  return isMobile
}
