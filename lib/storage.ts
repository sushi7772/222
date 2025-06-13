"use client"

import { getSessionId } from "@/lib/session"

export function saveToStorage<T>(key: string, data: T): void {
  try {
    if (typeof window !== "undefined") {
      const sessionId = getSessionId()
      const sessionKey = `${key}-${sessionId}`

      localStorage.setItem(sessionKey, JSON.stringify(data))

      // Also save to cookies as backup
      const expires = new Date()
      expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
      document.cookie = `${sessionKey}=${encodeURIComponent(JSON.stringify(data))}; expires=${expires.toUTCString()}; path=/`
    }
  } catch (error) {
    console.error("Failed to save to storage:", error)
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window !== "undefined") {
      const sessionId = getSessionId()
      const sessionKey = `${key}-${sessionId}`

      // Try localStorage first
      const item = localStorage.getItem(sessionKey)
      if (item) {
        return JSON.parse(item)
      }

      // Fallback to cookies
      const cookies = document.cookie.split(";")
      const cookie = cookies.find((c) => c.trim().startsWith(`${sessionKey}=`))
      if (cookie) {
        const value = cookie.split("=")[1]
        return JSON.parse(decodeURIComponent(value))
      }
    }
  } catch (error) {
    console.error("Failed to load from storage:", error)
  }
  return defaultValue
}

export function removeFromStorage(key: string): void {
  try {
    if (typeof window !== "undefined") {
      const sessionId = getSessionId()
      const sessionKey = `${key}-${sessionId}`

      localStorage.removeItem(sessionKey)
      document.cookie = `${sessionKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    }
  } catch (error) {
    console.error("Failed to remove from storage:", error)
  }
}
