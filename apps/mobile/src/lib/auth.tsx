import { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import * as Google from 'expo-auth-session/providers/google'
import { loginApi, loginGoogleApi, type User } from './api'
import { setupPushNotifications } from './push'

const TOKEN_KEY = 'scilab_token'

const GOOGLE_NOT_CONFIGURED_MSG =
  'ยังไม่ได้ตั้งค่า Google Sign-in กรุณาเพิ่ม EXPO_PUBLIC_GOOGLE_*_CLIENT_ID ใน .env'

const googleConfig = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
}

const hasGoogleClientId = Boolean(
  googleConfig.webClientId || googleConfig.iosClientId || googleConfig.androidClientId
)

interface GoogleAuthState {
  ready: boolean
  getIdToken: () => Promise<string>
}

const GoogleAuthContext = createContext<GoogleAuthState>({
  ready: false,
  getIdToken: async () => {
    throw new Error(GOOGLE_NOT_CONFIGURED_MSG)
  },
})

function GoogleAuthConnected({ children }: { children: React.ReactNode }) {
  const [googleRequest, , promptGoogleAsync] =
    Google.useIdTokenAuthRequest(googleConfig)

  const getIdToken = async (): Promise<string> => {
    if (!googleRequest) {
      throw new Error('Google Sign-in ยังไม่พร้อมใช้งาน กรุณาลองใหม่')
    }
    const result = await promptGoogleAsync()
    if (result?.type === 'success') {
      const idToken = result.params?.id_token ?? result.authentication?.idToken
      if (idToken) {
        return idToken
      }
    }
    if (result?.type === 'cancel' || result?.type === 'dismiss') {
      throw new Error('ยกเลิกการเข้าสู่ระบบด้วย Google')
    }
    throw new Error('เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่')
  }

  return (
    <GoogleAuthContext.Provider value={{ ready: googleRequest !== null, getIdToken }}>
      {children}
    </GoogleAuthContext.Provider>
  )
}

function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  if (!hasGoogleClientId) {
    return <>{children}</>
  }
  return <GoogleAuthConnected>{children}</GoogleAuthConnected>
}

interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
  googleReady: boolean
  login: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const googleAuth = useContext(GoogleAuthContext)

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

  const finishLogin = async (nextToken: string, nextUser: User) => {
    setToken(nextToken)
    setUser(nextUser)
    await SecureStore.setItemAsync(
      TOKEN_KEY,
      JSON.stringify({ token: nextToken, user: nextUser })
    )
    setupPushNotifications(nextToken)
  }

  const login = async (email: string, password: string) => {
    const { token: nextToken, user: nextUser } = await loginApi(email, password)
    await finishLogin(nextToken, nextUser)
  }

  const signInWithGoogle = async () => {
    const idToken = await googleAuth.getIdToken()
    const { token: nextToken, user: nextUser } = await loginGoogleApi(idToken)
    await finishLogin(nextToken, nextUser)
  }

  const logout = async () => {
    setToken(null)
    setUser(null)
    await SecureStore.deleteItemAsync(TOKEN_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        googleReady: googleAuth.ready,
        login,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <GoogleAuthProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
    </GoogleAuthProvider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth ต้องใช้ภายใน AuthProvider')
  }
  return ctx
}
