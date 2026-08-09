import { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { loginApi, type User } from './api'
import { setupPushNotifications } from './push'

const TOKEN_KEY = 'scilab_token'

interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          setToken(parsed.token)
          setUser(parsed.user)
          setupPushNotifications(parsed.token)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const login = async (email: string, password: string) => {
    const { token, user } = await loginApi(email, password)
    setToken(token)
    setUser(user)
    await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify({ token, user }))
    setupPushNotifications(token)
  }

  const logout = async () => {
    setToken(null)
    setUser(null)
    await SecureStore.deleteItemAsync(TOKEN_KEY)
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth ต้องใช้ภายใน AuthProvider')
  }
  return ctx
}
