// React Query hooks for search
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { searchService } from '@/services/search.service'
import { SearchRequest, SearchResponse, SearchResult } from '@knowman/types'
import { toast } from 'sonner'

// Query keys
export const searchKeys = {
  all: ['search'] as const,
  lists: () => [...searchKeys.all, 'list'] as const,
  list: (params?: SearchRequest) => [...searchKeys.lists(), params] as const,
  suggestions: (query: string) => [...searchKeys.all, 'suggestions', query] as const,
  filters: () => [...searchKeys.all, 'filters'] as const,
  semantic: (query: string, limit: number) => [...searchKeys.all, 'semantic', query, limit] as const,
  related: (itemId: string, limit: number) => [...searchKeys.all, 'related', itemId, limit] as const,
}

// Hooks
export function useSearch(params: SearchRequest) {
  return useQuery({
    queryKey: searchKeys.list(params),
    queryFn: () => searchService.search(params),
    select: (response) => response.data,
    enabled: !!params.query || Object.keys(params.filters || {}).length > 0,
  })
}

export function useSearchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: SearchRequest) => searchService.search(params),
    onSuccess: (response) => {
      if (!response.success) {
        toast.error(response.error || 'Search failed')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Search failed')
    },
  })
}

export function useSemanticSearch(query: string, limit: number = 10) {
  return useQuery({
    queryKey: searchKeys.semantic(query, limit),
    queryFn: () => searchService.semanticSearch(query, limit),
    select: (response) => response.data,
    enabled: !!query,
  })
}

export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: searchKeys.suggestions(query),
    queryFn: () => searchService.getSuggestions(query),
    select: (response) => response.data,
    enabled: !!query && query.length > 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useSearchFilters() {
  return useQuery({
    queryKey: searchKeys.filters(),
    queryFn: () => searchService.getFilters(),
    select: (response) => response.data,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useRelatedItems(itemId: string, limit: number = 5) {
  return useQuery({
    queryKey: searchKeys.related(itemId, limit),
    queryFn: () => searchService.getRelatedItems(itemId, limit),
    select: (response) => response.data,
    enabled: !!itemId,
  })
}

// Hook for debounced search
export function useDebouncedSearch(params: SearchRequest, delay: number = 500) {
  return useQuery({
    queryKey: searchKeys.list(params),
    queryFn: () => searchService.search(params),
    select: (response) => response.data,
    enabled: !!params.query || Object.keys(params.filters || {}).length > 0,
    staleTime: 0, // Always fresh
    gcTime: 0, // Don't cache
  })
}