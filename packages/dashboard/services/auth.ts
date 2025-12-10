// Authentication service for dashboard
import { apiClient } from '@/lib/api-client'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface User {
  id: string
  email: string
  name?: string
  preferences: {
    autoCapture: boolean
    theme: 'light' | 'dark' | 'system'
    language: string
    notificationSettings: {
      email: boolean
      push: boolean
      digestFrequency: 'daily' | 'weekly' | 'monthly' | 'never'
    }
  }
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  success: boolean
  data: {
    user: User
    tokens: AuthTokens
  }
  message: string
}

export interface MeResponse {
  success: boolean
  data: {
    user: User
  }
}

export interface ValidateResponse {
  success: boolean
  data: {
    isValid: boolean
    user?: Pick<User, 'id' | 'email' | 'name'>
  }
  message: string
}

export class AuthService {
  private readonly tokenKey = 'knowman_auth_tokens'
  private readonly userKey = 'knowman_user'

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', data)
    if (response.success && response.data) {
      this.setTokens(response.data.tokens)
      this.setUser(response.data.user)
    }
    return response
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials)
    if (response.success && response.data) {
      this.setTokens(response.data.tokens)
      this.setUser(response.data.user)
    }
    return response
  }

  // Refresh tokens
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const response = await apiClient.post<{ success: boolean; data: { tokens: AuthTokens } }>(
      '/api/auth/refresh',
      { refreshToken }
    )
    if (response.success && response.data) {
      this.setTokens(response.data.tokens)
      return response.data.tokens
    }
    throw new Error('Failed to refresh tokens')
  }

  // Logout user
  async logout(refreshToken: string): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout', { refreshToken })
    } catch (error) {
      // Silently fail if logout API fails
      console.error('Logout failed:', error)
    } finally {
      this.clearAuth()
    }
  }

  // Get current user info
  async getCurrentUser(): Promise<User | null> {
    const tokens = this.getTokens()
    if (!tokens?.accessToken) {
      return null
    }

    try {
      const response = await apiClient.get<MeResponse>('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      })
      if (response.success && response.data) {
        this.setUser(response.data.user)
        return response.data.user
      }
    } catch (error) {
      console.error('Failed to get current user:', error)
    }
    return null
  }

  // Validate token
  async validateToken(token: string): Promise<ValidateResponse> {
    return apiClient.post<ValidateResponse>('/api/auth/validate', { token })
  }

  // Token management
  setTokens(tokens: AuthTokens): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.tokenKey, JSON.stringify(tokens))
    }
  }

  getTokens(): AuthTokens | null {
    if (typeof window !== 'undefined') {
      const tokens = localStorage.getItem(this.tokenKey)
      return tokens ? JSON.parse(tokens) : null
    }
    return null
  }

  clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey)
    }
  }

  // User management
  setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.userKey, JSON.stringify(user))
    }
  }

  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem(this.userKey)
      return user ? JSON.parse(user) : null
    }
    return null
  }

  clearUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.userKey)
    }
  }

  // Clear all auth data
  clearAuth(): void {
    this.clearTokens()
    this.clearUser()
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const tokens = this.getTokens()
    if (!tokens?.accessToken) {
      return false
    }

    // Check if token is expired (simple check - in production, decode JWT)
    // For now, we'll just check if we have a token
    return true
  }

  // Get auth headers for API requests
  getAuthHeaders(): Record<string, string> {
    const tokens = this.getTokens()
    if (tokens?.accessToken) {
      return {
        Authorization: `Bearer ${tokens.accessToken}`,
      }
    }
    return {}
  }
}

// Create singleton instance
export const authService = new AuthService()

export default authService