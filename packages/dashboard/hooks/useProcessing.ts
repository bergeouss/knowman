// React Query hooks for processing
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { processingService } from '@/services/processing.service'
import { ProcessingJob } from '@knowman/types'
import { toast } from 'sonner'

// Query keys
export const processingKeys = {
  all: ['processing'] as const,
  stats: () => [...processingKeys.all, 'stats'] as const,
  queueStatus: () => [...processingKeys.all, 'queue-status'] as const,
  jobs: () => [...processingKeys.all, 'jobs'] as const,
  job: (id: string) => [...processingKeys.jobs(), id] as const,
  config: () => [...processingKeys.all, 'config'] as const,
  logs: (limit: number) => [...processingKeys.all, 'logs', limit] as const,
}

// Hooks
export function useProcessingStats() {
  return useQuery({
    queryKey: processingKeys.stats(),
    queryFn: () => processingService.getStats(),
    select: (response) => response.data,
  })
}

export function useQueueStatus() {
  return useQuery({
    queryKey: processingKeys.queueStatus(),
    queryFn: () => processingService.getQueueStatus(),
    select: (response) => response.data,
    refetchInterval: 10000, // Refresh every 10 seconds
  })
}

export function useProcessingJobs(params?: {
  status?: string
  type?: string
  limit?: number
}) {
  return useQuery({
    queryKey: [...processingKeys.jobs(), params],
    queryFn: () => processingService.listJobs(params),
    select: (response) => response.data,
  })
}

export function useProcessingJob(id: string) {
  return useQuery({
    queryKey: processingKeys.job(id),
    queryFn: () => processingService.getJob(id),
    enabled: !!id,
    select: (response) => response.data,
  })
}

export function useProcessingConfig() {
  return useQuery({
    queryKey: processingKeys.config(),
    queryFn: () => processingService.getConfig(),
    select: (response) => response.data,
  })
}

export function useProcessingLogs(limit: number = 50) {
  return useQuery({
    queryKey: processingKeys.logs(limit),
    queryFn: () => processingService.getLogs(limit),
    select: (response) => response.data,
  })
}

export function useRetryJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => processingService.retryJob(id),
    onSuccess: (response, id) => {
      if (response.success) {
        toast.success('Job retried successfully')
        queryClient.invalidateQueries({ queryKey: processingKeys.job(id) })
        queryClient.invalidateQueries({ queryKey: processingKeys.jobs() })
        queryClient.invalidateQueries({ queryKey: processingKeys.stats() })
      } else {
        toast.error(response.error || 'Failed to retry job')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to retry job')
    },
  })
}

export function useCancelJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => processingService.cancelJob(id),
    onSuccess: (response, id) => {
      if (response.success) {
        toast.success('Job cancelled successfully')
        queryClient.invalidateQueries({ queryKey: processingKeys.jobs() })
        queryClient.invalidateQueries({ queryKey: processingKeys.stats() })
        queryClient.removeQueries({ queryKey: processingKeys.job(id) })
      } else {
        toast.error(response.error || 'Failed to cancel job')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel job')
    },
  })
}

export function useTriggerProcessing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, types }: { itemId: string; types?: string[] }) =>
      processingService.triggerProcessing(itemId, types),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Processing triggered successfully')
        queryClient.invalidateQueries({ queryKey: processingKeys.jobs() })
        queryClient.invalidateQueries({ queryKey: processingKeys.stats() })
      } else {
        toast.error(response.error || 'Failed to trigger processing')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to trigger processing')
    },
  })
}

export function useUpdateProcessingConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (config: any) => processingService.updateConfig(config),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Processing configuration updated')
        queryClient.invalidateQueries({ queryKey: processingKeys.config() })
      } else {
        toast.error(response.error || 'Failed to update configuration')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update configuration')
    },
  })
}

export function useClearCompletedJobs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => processingService.clearCompletedJobs(),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(`Cleared ${response.data?.deletedCount || 0} completed jobs`)
        queryClient.invalidateQueries({ queryKey: processingKeys.jobs() })
        queryClient.invalidateQueries({ queryKey: processingKeys.stats() })
      } else {
        toast.error(response.error || 'Failed to clear completed jobs')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to clear completed jobs')
    },
  })
}