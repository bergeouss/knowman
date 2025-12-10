// Search Service for KnowMan Dashboard
import { apiClient } from '@/lib/api-client'
import { SearchResult, SearchRequest, SearchResponse, APIResponse } from '@knowman/types'

export class SearchService {
  // Search knowledge base - POST request matching backend API
  async search(params: SearchRequest): Promise<APIResponse<SearchResponse>> {
    return apiClient.post<SearchResponse>('/api/search', params)
  }

  // Semantic search using embeddings (placeholder - backend doesn't have this endpoint yet)
  async semanticSearch(query: string, limit: number = 10): Promise<APIResponse<SearchResult[]>> {
    // For now, use regular search since semantic search endpoint doesn't exist
    return this.search({
      query,
      limit,
      filters: {},
    }).then(response => {
      if (response.success && response.data) {
        return {
          ...response,
          data: response.data.results
        }
      }
      return response as APIResponse<SearchResult[]>
    })
  }

  // Get search suggestions (placeholder - backend doesn't have this endpoint yet)
  async getSuggestions(query: string): Promise<APIResponse<string[]>> {
    // For now, return empty array since suggestions endpoint doesn't exist
    return Promise.resolve({
      success: true,
      data: [],
      timestamp: new Date()
    })
  }

  // Get search filters (placeholder - backend doesn't have this endpoint yet)
  async getFilters(): Promise<APIResponse<{
    tags: string[]
    sourceTypes: string[]
    dateRange: { min: string; max: string }
  }>> {
    // For now, return empty filters
    return Promise.resolve({
      success: true,
      data: {
        tags: [],
        sourceTypes: [],
        dateRange: { min: '', max: '' }
      },
      timestamp: new Date()
    })
  }

  // Get related items (placeholder - backend doesn't have this endpoint yet)
  async getRelatedItems(itemId: string, limit: number = 5): Promise<APIResponse<SearchResult[]>> {
    // For now, return empty array
    return Promise.resolve({
      success: true,
      data: [],
      timestamp: new Date()
    })
  }
}

// Create a singleton instance
export const searchService = new SearchService()

export default searchService