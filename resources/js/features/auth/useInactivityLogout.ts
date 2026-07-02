import * as React from "react"
import { useNavigate } from "react-router-dom"

import {
  AUTH_INACTIVITY_TIMEOUT_MS,
  AUTH_LAST_ACTIVITY_KEY,
  AUTH_TOKEN_KEY,
  useAuthStore,
} from "@/features/auth/authStore"
import { api } from "@/shared/services/api"

const ACTIVITY_EVENTS = [
  "click",
  "keydown",
  "mousemove",
  "scroll",
  "touchstart",
  "visibilitychange",
] as const

function getAuthStorage() {
  if (window.localStorage.getItem(AUTH_TOKEN_KEY)) return window.localStorage
  if (window.sessionStorage.getItem(AUTH_TOKEN_KEY)) return window.sessionStorage

  return null
}

function getLastActivityAt() {
  const value =
    window.localStorage.getItem(AUTH_LAST_ACTIVITY_KEY) ??
    window.sessionStorage.getItem(AUTH_LAST_ACTIVITY_KEY)

  return value ? Number(value) : null
}

function recordActivity() {
  const storage = getAuthStorage()
  storage?.setItem(AUTH_LAST_ACTIVITY_KEY, String(Date.now()))
}

export function useInactivityLogout() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const clearSession = useAuthStore((state) => state.clearSession)

  React.useEffect(() => {
    if (!isAuthenticated) return

    let logoutStarted = false

    const logoutForInactivity = () => {
      if (logoutStarted) return

      logoutStarted = true
      void api.post("/auth/logout").catch(() => undefined)
      clearSession()
      navigate("/login", { replace: true })
    }

    const checkActivity = () => {
      const lastActivityAt = getLastActivityAt()
      if (!lastActivityAt) {
        recordActivity()
        return
      }

      if (Date.now() - lastActivityAt >= AUTH_INACTIVITY_TIMEOUT_MS) {
        logoutForInactivity()
      }
    }

    const handleActivity = () => {
      checkActivity()
      if (!logoutStarted) recordActivity()
    }

    recordActivity()
    const interval = window.setInterval(checkActivity, 60 * 1000)

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true })
    })

    return () => {
      window.clearInterval(interval)
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity)
      })
    }
  }, [clearSession, isAuthenticated, navigate])
}
