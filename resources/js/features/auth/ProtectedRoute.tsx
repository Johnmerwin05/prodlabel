import * as React from "react"
import { Loader2Icon } from "lucide-react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuthStore } from "@/features/auth/authStore"
import { api } from "@/shared/services/api"

export function ProtectedRoute() {
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const clearSession = useAuthStore((state) => state.clearSession)
  const [isLoadingUser, setIsLoadingUser] = React.useState(
    isAuthenticated && !user,
  )

  React.useEffect(() => {
    if (!isAuthenticated || user) {
      setIsLoadingUser(false)
      return
    }

    let cancelled = false
    setIsLoadingUser(true)

    api.get("/auth/me")
      .then((response) => {
        if (!cancelled) setUser(response.data)
      })
      .catch(() => {
        if (!cancelled) clearSession()
      })
      .finally(() => {
        if (!cancelled) setIsLoadingUser(false)
      })

    return () => {
      cancelled = true
    }
  }, [clearSession, isAuthenticated, setUser, user])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (isLoadingUser || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading account</span>
      </div>
    )
  }

  return <Outlet />
}
