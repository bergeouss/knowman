// Capture Service for KnowMan Dashboard
import { apiClient } from '@/lib/api-client'
import { KnowledgeItem, APIResponse } from '@knowman/types'

export interface CaptureRequest {
  url?: string
  content: string // Made required to match backend validation
  title: string
  sourceType: 'webpage' | 'pdf' | 'document' | 'video' | 'audio' | 'image' | 'note'
  tags?: string[]
  metadata?: Record<string, any>
}

export interface FileUploadRequest {
  file: File
  title?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export class CaptureService {
  // Capture content from URL or direct content
  async capture(request: CaptureRequest): Promise<APIResponse<KnowledgeItem>> {
    return apiClient.post<KnowledgeItem>('/api/capture', request)
  }

  // Upload and process a file
  async uploadFile(request: FileUploadRequest): Promise<APIResponse<KnowledgeItem>> {
    const formData = new FormData()
    formData.append('file', request.file)

    if (request.title) {
      formData.append('title', request.title)
    }

    if (request.tags && request.tags.length > 0) {
      formData.append('tags', JSON.stringify(request.tags))
    }

    if (request.metadata) {
      formData.append('metadata', JSON.stringify(request.metadata))
    }

    // Create a temporary API client with different headers for file upload
    const tempClient = new (apiClient.constructor as any)({
      headers: {
        // Let browser set Content-Type for FormData
      },
    })

    return (tempClient as any).post<KnowledgeItem>('/api/capture/upload', formData)
  }

  // Get capture history
  async getCaptureHistory(limit: number = 10): Promise<APIResponse<KnowledgeItem[]>> {
    return apiClient.get<KnowledgeItem[]>('/api/capture/history', { limit })
  }

  // Get capture statistics
  async getCaptureStats(): Promise<APIResponse<{
    totalCaptures: number
    capturesToday: number
    capturesThisWeek: number
    bySourceType: Record<string, number>
    successRate: number
  }>> {
    return apiClient.get('/api/capture/stats')
  }

  // Validate URL for capture
  async validateUrl(url: string): Promise<APIResponse<{
    valid: boolean
    title?: string
    contentType?: string
    contentLength?: number
    error?: string
  }>> {
    return apiClient.post('/api/capture/validate', { url })
  }

  // Fetch content from URL
  async fetchContent(url: string): Promise<string> {
    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
      }

      const html = await response.text()
      return html
    } catch (error) {
      throw new Error(`Failed to fetch content: ${error.message}`)
    }
  }

  // Capture content from URL (with automatic content extraction)
  async captureFromUrl(url: string, title?: string, tags?: string[]): Promise<APIResponse<KnowledgeItem>> {
    try {
      // Fetch content from URL
      const content = await this.fetchContent(url)

      // Extract title from URL if not provided
      if (!title) {
        const urlObj = new URL(url)
        title = urlObj.hostname || url
      }

      return this.capture({
        url,
        content,
        title: title.trim(),
        tags: tags || [],
        sourceType: 'webpage'
      })
    } catch (error) {
      throw new Error(`Failed to capture from URL: ${error.message}`)
    }
  }

  // Test capture configuration
  async testCapture(): Promise<APIResponse<{ success: boolean; message: string }>> {
    return apiClient.get('/api/capture/test')
  }
}

// Create a singleton instance
export const captureService = new CaptureService()

export default captureService