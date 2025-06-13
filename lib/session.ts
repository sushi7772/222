"use client"

export function getSessionId(): string {
  if (typeof window === "undefined") return ""

  let sessionId = localStorage.getItem("notes-session-id")

  if (!sessionId) {
    // Generate a unique session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem("notes-session-id", sessionId)
  }

  return sessionId
}

export function clearSession(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem("notes-session-id")
  localStorage.removeItem("notes-playground-tasks")
  localStorage.removeItem("telegram-settings")

  // Clear all cookies
  document.cookie.split(";").forEach((c) => {
    const eqPos = c.indexOf("=")
    const name = eqPos > -1 ? c.substr(0, eqPos) : c
    document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
  })
}

export function generateNewSession(): string {
  clearSession()
  return getSessionId()
}
