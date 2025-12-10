// API Client for KnowMan Dashboard
import { APIResponse } from '@knowman/types'
import { authService } from '@/services/auth'

// Environment configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || 'development-user'
const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10)
const API_LOGGING = process.env.NEXT_PUBLIC_API_LOGGING === 'true' || process.env.NODE_ENV === 'development'

// API Client configuration
interface APIConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
}

// Create a custom fetch wrapper with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

// API Client class
export class APIClient {
  private config: APIConfig
  private customHeaders: Record<string, string>

  constructor(config?: Partial<APIConfig>) {
    this.customHeaders = config?.headers || {}
    this.config = {
      baseURL: config?.baseURL || API_BASE_URL,
      timeout: config?.timeout || API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.customHeaders,
      },
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...this.customHeaders,
    }

    // Always check for real auth tokens first
    const authHeaders = authService.getAuthHeaders()
    if (authHeaders.Authorization) {
      headers['Authorization'] = authHeaders.Authorization
    } else if (BYPASS_AUTH) {
      // Only use bypass if no auth tokens available
      headers['x-bypass-auth'] = 'true'
    } else {
      // Fallback to default user ID
      headers['userId'] = DEFAULT_USER_ID
    }

    return headers
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    }

    if (API_LOGGING) {
      console.log(`[API] ${options.method || 'GET'} ${url}`)
      console.log('[API Headers]', { ...requestOptions.headers })
    }

    try {
      const response = await fetchWithTimeout(url, requestOptions, this.config.timeout)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data: APIResponse<T> = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'API request failed')
      }

      return data
    } catch (error) {
      if (API_LOGGING) {
        console.error('[API Error]', error)
      }

      // Return a standardized error response
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      }
    }
  }

  // HTTP method helpers
  async get<T = any>(endpoint: string, queryParams?: Record<string, any>): Promise<APIResponse<T>> {
    let url = endpoint
    if (queryParams) {
      const params = new URLSearchParams(queryParams).toString()
      url += `?${params}`
    }
    return this.request<T>(url, { method: 'GET' })
  }

  async post<T = any>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
    })
  }

  async put<T = any>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
    })
  }

  async delete<T = any>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
    })
  }

  // Update headers (useful for authentication)
  updateHeaders(headers: Record<string, string>): void {
    this.customHeaders = {
      ...this.customHeaders,
      ...headers,
    }
  }

  // Get current configuration
  getConfig(): APIConfig {
    return {
      ...this.config,
      headers: this.getHeaders()
    }
  }
}

// Create a singleton instance
export const apiClient = new APIClient()

// Export for convenience
export default apiClient