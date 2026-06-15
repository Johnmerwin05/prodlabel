import { create } from "zustand"

type AuthUser = {
  id: number
  name: string
  username: string
  email: string
  permissions: string[]
}

type AuthState = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  setSession: (session: { user: AuthUser; token: string; remember?: boolean }) => void
  setUser: (user: AuthUser) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: window.localStorage.getItem("auth.token") ?? window.sessionStorage.getItem("auth.token"),
  isAuthenticated: Boolean(window.localStorage.getItem("auth.token") ?? window.sessionStorage.getItem("auth.token")),
  setSession: ({ user, token, remember = true }) => {
    const storage = remember ? window.localStorage : window.sessionStorage
    window.localStorage.removeItem("auth.token")
    window.sessionStorage.removeItem("auth.token")
    storage.setItem("auth.token", token)
    set({ user, token, isAuthenticated: true })
  },
  setUser: (user) => set({ user, isAuthenticated: true }),
  clearSession: () => {
    window.localStorage.removeItem("auth.token")
    window.sessionStorage.removeItem("auth.token")
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
