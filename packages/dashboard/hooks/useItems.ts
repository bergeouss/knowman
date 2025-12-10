// React Query hooks for items
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { itemsService } from '@/services/items.service'
import { KnowledgeItem, ListItemsParams } from '@knowman/types'
import { toast } from 'sonner'

// Query keys
export const itemsKeys = {
  all: ['items'] as const,
  lists: () => [...itemsKeys.all, 'list'] as const,
  list: (params: ListItemsParams) => [...itemsKeys.lists(), params] as const,
  details: () => [...itemsKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemsKeys.details(), id] as const,
  stats: () => [...itemsKeys.all, 'stats'] as const,
  recent: (limit: number) => [...itemsKeys.all, 'recent', limit] as const,
}

// Hooks
export function useItems(params?: ListItemsParams) {
  return useQuery({
    queryKey: itemsKeys.list(params || {}),
    queryFn: () => itemsService.listItems(params),
    select: (response) => response.data,
  })
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemsKeys.detail(id),
    queryFn: () => itemsService.getItem(id),
    enabled: !!id,
    select: (response) => response.data,
  })
}

export function useItemsStats() {
  return useQuery({
    queryKey: itemsKeys.stats(),
    queryFn: () => itemsService.getStats(),
    select: (response) => response.data,
  })
}

export function useRecentItems(limit: number = 5) {
  return useQuery({
    queryKey: itemsKeys.recent(limit),
    queryFn: () => itemsService.getRecentItems(limit),
    select: (response) => response.data,
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<KnowledgeItem> }) =>
      itemsService.updateItem(id, data),
    onSuccess: (response, { id }) => {
      if (response.success) {
        toast.success('Item updated successfully')
        queryClient.invalidateQueries({ queryKey: itemsKeys.detail(id) })
        queryClient.invalidateQueries({ queryKey: itemsKeys.lists() })
      } else {
        toast.error(response.error || 'Failed to update item')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update item')
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => itemsService.deleteItem(id),
    onSuccess: (response, id) => {
      if (response.success) {
        toast.success('Item deleted successfully')
        queryClient.invalidateQueries({ queryKey: itemsKeys.lists() })
        queryClient.removeQueries({ queryKey: itemsKeys.detail(id) })
      } else {
        toast.error(response.error || 'Failed to delete item')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete item')
    },
  })
}

export function useMarkAsReviewed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => itemsService.markAsReviewed(id),
    onSuccess: (response, id) => {
      if (response.success) {
        toast.success('Item marked as reviewed')
        queryClient.invalidateQueries({ queryKey: itemsKeys.detail(id) })
        queryClient.invalidateQueries({ queryKey: itemsKeys.lists() })
      } else {
        toast.error(response.error || 'Failed to mark item as reviewed')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to mark item as reviewed')
    },
  })
}