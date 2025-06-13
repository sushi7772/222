"use client"

import { useState, useEffect } from "react"

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      setScreenSize({ width, height })
      setIsMobile(width < 768) // Mobile: < 768px
      setIsTablet(width >= 768 && width < 1024) // Tablet: 768px - 1024px
    }

    // Check on mount
    checkScreenSize()

    // Add event listener
    window.addEventListener("resize", checkScreenSize)
    window.addEventListener("orientationchange", checkScreenSize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkScreenSize)
      window.removeEventListener("orientationchange", checkScreenSize)
    }
  }, [])

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    screenSize,
    breakpoint: isMobile ? "mobile" : isTablet ? "tablet" : "desktop",
  }
}
