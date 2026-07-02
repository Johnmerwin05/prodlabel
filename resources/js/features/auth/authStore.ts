import { create } from "zustand"

export const AUTH_INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000
export const AUTH_LAST_ACTIVITY_KEY = "auth.lastActivityAt"
export const AUTH_TOKEN_KEY = "auth.token"

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

function getStoredToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? window.sessionStorage.getItem(AUTH_TOKEN_KEY)
}

function getStoredLastActivityAt() {
  const value = window.localStorage.getItem(AUTH_LAST_ACTIVITY_KEY) ?? window.sessionStorage.getItem(AUTH_LAST_ACTIVITY_KEY)
  return value ? Number(value) : null
}

function clearStoredSession() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem(AUTH_LAST_ACTIVITY_KEY)
  window.sessionStorage.removeItem(AUTH_LAST_ACTIVITY_KEY)
}

function getInitialToken() {
  const token = getStoredToken()
  const lastActivityAt = getStoredLastActivityAt()

  if (token && lastActivityAt && Date.now() - lastActivityAt > AUTH_INACTIVITY_TIMEOUT_MS) {
    clearStoredSession()
    return null
  }

  return token
}

const initialToken = getInitialToken()

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: initialToken,
  isAuthenticated: Boolean(initialToken),
  setSession: ({ user, token, remember = true }) => {
    const storage = remember ? window.localStorage : window.sessionStorage
    clearStoredSession()
    storage.setItem(AUTH_TOKEN_KEY, token)
    storage.setItem(AUTH_LAST_ACTIVITY_KEY, String(Date.now()))
    set({ user, token, isAuthenticated: true })
  },
  setUser: (user) => set({ user, isAuthenticated: true }),
  clearSession: () => {
    clearStoredSession()
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
