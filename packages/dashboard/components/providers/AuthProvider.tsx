'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authService } from '@/services/auth'
import { User } from '@/services/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; message: string }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = authService.getUser()
        const tokens = authService.getTokens()

        if (storedUser && tokens?.accessToken) {
          // Verify token is still valid
          const response = await authService.validateToken(tokens.accessToken)
          if (response.success && response.data?.isValid) {
            setUser(storedUser)
          } else {
            // Token invalid, clear auth
            authService.clearAuth()
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Redirect to login if not authenticated on protected pages
  useEffect(() => {
    if (!isLoading && !user) {
      // List of public pages that don't require authentication
      const publicPages = ['/login', '/register', '/forgot-password']

      // If current page is not public and user is not authenticated, redirect to login
      if (!publicPages.includes(pathname)) {
        router.push('/login')
      }
    }
  }, [user, isLoading, pathname, router])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await authService.login({ email, password })

      if (response.success && response.data) {
        setUser(response.data.user)
        return { success: true, message: 'Login successful' }
      } else {
        return { success: false, message: response.message || 'Login failed' }
      }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Login failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      const tokens = authService.getTokens()
      if (tokens?.refreshToken) {
        await authService.logout(tokens.refreshToken)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      authService.clearAuth()
      setUser(null)
      setIsLoading(false)
      router.push('/login')
      router.refresh()
    }
  }

  const register = async (email: string, password: string, name?: string) => {
    try {
      setIsLoading(true)
      const response = await authService.register({ email, password, name })

      if (response.success && response.data) {
        setUser(response.data.user)
        return { success: true, message: 'Registration successful' }
      } else {
        return { success: false, message: response.message || 'Registration failed' }
      }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Registration failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}