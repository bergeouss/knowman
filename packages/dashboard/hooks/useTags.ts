// React Query hooks for tags
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tagsService } from '@/services/tags.service'
import { toast } from 'sonner'

// Query keys
export const tagsKeys = {
  all: ['tags'] as const,
  lists: () => [...tagsKeys.all, 'list'] as const,
  list: (params?: any) => [...tagsKeys.lists(), params] as const,
  details: () => [...tagsKeys.all, 'detail'] as const,
  detail: (id: string) => [...tagsKeys.details(), id] as const,
  stats: () => [...tagsKeys.all, 'stats'] as const,
  popular: (limit: number) => [...tagsKeys.all, 'popular', limit] as const,
}

// Hooks
export function useTags() {
  return useQuery({
    queryKey: tagsKeys.list(),
    queryFn: () => tagsService.listTags(),
    select: (response) => response.data,
  })
}

export function useTag(id: string) {
  return useQuery({
    queryKey: tagsKeys.detail(id),
    queryFn: () => tagsService.getTag(id),
    enabled: !!id,
    select: (response) => response.data,
  })
}

export function useTagsStats() {
  return useQuery({
    queryKey: tagsKeys.stats(),
    queryFn: () => tagsService.getTagStats(),
    select: (response) => response.data,
  })
}

export function usePopularTags(limit: number = 10) {
  return useQuery({
    queryKey: tagsKeys.popular(limit),
    queryFn: () => tagsService.getPopularTags(limit),
    select: (response) => response.data,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; description?: string; color?: string }) =>
      tagsService.createTag(data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Tag created successfully')
        queryClient.invalidateQueries({ queryKey: tagsKeys.lists() })
        queryClient.invalidateQueries({ queryKey: tagsKeys.stats() })
      } else {
        toast.error(response.error || 'Failed to create tag')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create tag')
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      tagsService.updateTag(id, data),
    onSuccess: (response, { id }) => {
      if (response.success) {
        toast.success('Tag updated successfully')
        queryClient.invalidateQueries({ queryKey: tagsKeys.detail(id) })
        queryClient.invalidateQueries({ queryKey: tagsKeys.lists() })
      } else {
        toast.error(response.error || 'Failed to update tag')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update tag')
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tagsService.deleteTag(id),
    onSuccess: (response, id) => {
      if (response.success) {
        toast.success('Tag deleted successfully')
        queryClient.invalidateQueries({ queryKey: tagsKeys.lists() })
        queryClient.invalidateQueries({ queryKey: tagsKeys.stats() })
        queryClient.removeQueries({ queryKey: tagsKeys.detail(id) })
      } else {
        toast.error(response.error || 'Failed to delete tag')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete tag')
    },
  })
}

export function useSuggestTags() {
  return useMutation({
    mutationFn: (query: string) => tagsService.suggestTags(query),
    onSuccess: (response) => {
      if (!response.success) {
        toast.error(response.error || 'Failed to suggest tags')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to suggest tags')
    },
  })
}

// Get items with specific tag
export function useTagItems(tagName: string, limit: number = 20, offset: number = 0) {
  return useQuery({
    queryKey: ['tags', 'items', tagName, limit, offset],
    queryFn: () => tagsService.getTagItems(tagName, limit, offset),
    enabled: !!tagName,
    select: (response) => response.data,
  })
}