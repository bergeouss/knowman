// Tags Service for KnowMan Dashboard
import { apiClient } from '@/lib/api-client'
import { APIResponse } from '@knowman/types'

export interface Tag {
  id: string
  name: string
  userId: string
  description?: string
  color?: string
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export interface TagStats {
  totalTags: number
  mostUsedTags: Array<{ tag: string; count: number }>
  tagCloud: Array<{ tag: string; count: number; importance: number }>
}

export class TagsService {
  // List all tags
  async listTags(): Promise<APIResponse<Tag[]>> {
    return apiClient.get<Tag[]>('/api/tags')
  }

  // Get tag by ID - Note: backend doesn't have GET /api/tags/:id, only PUT and DELETE
  // We'll get tags from list and filter
  async getTag(id: string): Promise<APIResponse<Tag>> {
    const response = await this.listTags()
    if (response.success && response.data) {
      const tag = response.data.find(t => t.id === id)
      if (tag) {
        return {
          success: true,
          data: tag,
          timestamp: response.timestamp
        }
      }
      return {
        success: false,
        error: 'Tag not found',
        timestamp: response.timestamp
      }
    }
    return response
  }

  // Create a new tag
  async createTag(data: { name: string; description?: string; color?: string }): Promise<APIResponse<Tag>> {
    return apiClient.post<Tag>('/api/tags', data)
  }

  // Update a tag
  async updateTag(id: string, data: Partial<Tag>): Promise<APIResponse<Tag>> {
    return apiClient.put<Tag>(`/api/tags/${id}`, data)
  }

  // Delete a tag
  async deleteTag(id: string): Promise<APIResponse<void>> {
    return apiClient.delete<void>(`/api/tags/${id}`)
  }

  // Get tag statistics
  async getTagStats(): Promise<APIResponse<TagStats>> {
    const response = await apiClient.get<Tag[]>('/api/tags')

    if (response.success && response.data) {
      const tags = response.data
      const totalTags = tags.length

      // Calculate most used tags
      const mostUsedTags = tags
        .sort((a: any, b: any) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, 10)
        .map((tag: any) => ({ tag: tag.name, count: tag.usageCount || 0 }))

      // Calculate tag cloud (simplified)
      const tagCloud = tags.map((tag: any) => ({
        tag: tag.name,
        count: tag.usageCount || 0,
        importance: Math.min((tag.usageCount || 0) / 10, 1) // Simple importance calculation
      }))

      return {
        success: true,
        data: {
          totalTags,
          mostUsedTags,
          tagCloud,
        },
        timestamp: response.timestamp,
      }
    }

    return response
  }

  // Get tag suggestions based on query string
  async suggestTags(query: string): Promise<APIResponse<string[]>> {
    return apiClient.get<string[]>(`/api/tags/suggestions/${encodeURIComponent(query)}`)
  }

  // Get popular tags
  async getPopularTags(limit: number = 10): Promise<APIResponse<Array<{ tag: string; count: number }>>> {
    const response = await apiClient.get<Tag[]>('/api/tags/popular', { limit })
    if (response.success && response.data) {
      const popularTags = response.data.map(tag => ({
        tag: tag.name,
        count: tag.usageCount || 0
      }))
      return {
        success: true,
        data: popularTags,
        timestamp: response.timestamp
      }
    }
    return response
  }

  // Get items with specific tag
  async getTagItems(tagName: string, limit: number = 20, offset: number = 0): Promise<APIResponse<any>> {
    return apiClient.get(`/api/tags/${encodeURIComponent(tagName)}/items`, { limit, offset })
  }
}

// Create a singleton instance
export const tagsService = new TagsService()

export default tagsService