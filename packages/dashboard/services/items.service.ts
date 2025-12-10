// Items Service for KnowMan Dashboard
import { apiClient } from '@/lib/api-client'
import { KnowledgeItem, PaginatedResponse, ListItemsParams, APIResponse } from '@knowman/types'

export class ItemsService {
  // List knowledge items with pagination and filters
  async listItems(params?: ListItemsParams): Promise<APIResponse<PaginatedResponse<KnowledgeItem>>> {
    return apiClient.get<PaginatedResponse<KnowledgeItem>>('/api/items', params)
  }

  // Get a single knowledge item by ID
  async getItem(id: string): Promise<APIResponse<KnowledgeItem>> {
    return apiClient.get<KnowledgeItem>(`/api/items/${id}`)
  }

  // Update a knowledge item
  async updateItem(id: string, data: Partial<KnowledgeItem>): Promise<APIResponse<KnowledgeItem>> {
    return apiClient.put<KnowledgeItem>(`/api/items/${id}`, data)
  }

  // Soft delete a knowledge item
  async deleteItem(id: string): Promise<APIResponse<void>> {
    return apiClient.delete<void>(`/api/items/${id}`)
  }

  // Mark item as reviewed
  async markAsReviewed(id: string): Promise<APIResponse<KnowledgeItem>> {
    return apiClient.post<KnowledgeItem>(`/api/items/${id}/review`)
  }

  // Get item statistics
  async getStats(): Promise<APIResponse<{
    total: number
    processed: number
    pending: number
    archived: number
    bySourceType: Record<string, number>
    byStatus: Record<string, number>
  }>> {
    return apiClient.get('/api/items/stats')
  }

  // Get recent items (last 5)
  async getRecentItems(limit: number = 5): Promise<APIResponse<KnowledgeItem[]>> {
    return apiClient.get<KnowledgeItem[]>('/api/items', {
      limit,
      sortBy: 'captureDate',
      sortOrder: 'desc',
    })
  }
}

// Create a singleton instance
export const itemsService = new ItemsService()

export default itemsService