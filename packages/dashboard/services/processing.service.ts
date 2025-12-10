// Processing Service for KnowMan Dashboard
import { apiClient } from '@/lib/api-client'
import { ProcessingJob, APIResponse } from '@knowman/types'

export interface ProcessingStats {
  totalJobs: number
  pendingJobs: number
  processingJobs: number
  completedJobs: number
  failedJobs: number
  averageProcessingTime: number
  successRate: number
  byType: Record<string, number>
}

export interface ProcessingQueueStatus {
  queueSize: number
  activeWorkers: number
  processingRate: number
  estimatedWaitTime: number
  health: 'healthy' | 'degraded' | 'unhealthy'
}

export class ProcessingService {
  // List processing jobs
  async listJobs(params?: {
    status?: string
    type?: string
    limit?: number
    offset?: number
  }): Promise<APIResponse<ProcessingJob[]>> {
    return apiClient.get<ProcessingJob[]>('/api/processing/jobs', params)
  }

  // Get processing job by ID
  async getJob(id: string): Promise<APIResponse<ProcessingJob>> {
    return apiClient.get<ProcessingJob>(`/api/processing/jobs/${id}`)
  }

  // Retry a failed job
  async retryJob(id: string): Promise<APIResponse<ProcessingJob>> {
    return apiClient.post<ProcessingJob>(`/api/processing/jobs/${id}/retry`)
  }

  // Cancel a pending job
  async cancelJob(id: string): Promise<APIResponse<void>> {
    return apiClient.delete<void>(`/api/processing/jobs/${id}`)
  }

  // Get processing statistics
  async getStats(): Promise<APIResponse<ProcessingStats>> {
    const response = await apiClient.get<any>('/api/processing/status')

    if (response.success && response.data) {
      // Transform the API response to match ProcessingStats interface
      const summary = response.data.summary || {}
      const queueStats = response.data.queueStats || []

      const completedJobs = queueStats.reduce((sum: number, queue: any) => sum + (queue.completed || 0), 0)
      const failedJobs = queueStats.reduce((sum: number, queue: any) => sum + (queue.failed || 0), 0)
      const totalJobs = queueStats.reduce((sum: number, queue: any) =>
        sum + (queue.waiting || 0) + (queue.active || 0) + (queue.completed || 0) + (queue.failed || 0) + (queue.delayed || 0), 0)

      const byType: Record<string, number> = {}
      queueStats.forEach((queue: any) => {
        byType[queue.name] = (queue.waiting || 0) + (queue.active || 0) + (queue.completed || 0) + (queue.failed || 0) + (queue.delayed || 0)
      })

      return {
        success: true,
        data: {
          totalJobs,
          pendingJobs: summary.pending || 0,
          processingJobs: summary.processing || 0,
          completedJobs,
          failedJobs,
          averageProcessingTime: 0, // Not available in current API
          successRate: completedJobs > 0 ? (completedJobs / (completedJobs + failedJobs)) * 100 : 0,
          byType,
        },
        timestamp: response.timestamp,
      }
    }

    return response
  }

  // Get queue status
  async getQueueStatus(): Promise<APIResponse<ProcessingQueueStatus>> {
    return apiClient.get<ProcessingQueueStatus>('/api/processing/queue-status')
  }

  // Trigger processing for a knowledge item
  async triggerProcessing(itemId: string, types?: string[]): Promise<APIResponse<ProcessingJob[]>> {
    return apiClient.post<ProcessingJob[]>('/api/processing/trigger', { itemId, types })
  }

  // Get processing configuration
  async getConfig(): Promise<APIResponse<{
    workers: number
    timeout: number
    maxRetries: number
    enabledTypes: string[]
    aiProvider: string
    embeddingProvider: string
  }>> {
    return apiClient.get('/api/processing/config')
  }

  // Update processing configuration
  async updateConfig(config: Partial<{
    workers: number
    timeout: number
    maxRetries: number
    enabledTypes: string[]
  }>): Promise<APIResponse<void>> {
    return apiClient.put<void>('/api/processing/config', config)
  }

  // Test processing system
  async testProcessing(): Promise<APIResponse<{ success: boolean; message: string }>> {
    return apiClient.get('/api/processing/test')
  }

  // Get processing logs
  async getLogs(limit: number = 50): Promise<APIResponse<Array<{
    timestamp: Date
    level: string
    message: string
    jobId?: string
    itemId?: string
  }>>> {
    return apiClient.get('/api/processing/logs', { limit })
  }

  // Clear completed jobs
  async clearCompletedJobs(): Promise<APIResponse<{ deletedCount: number }>> {
    return apiClient.delete<{ deletedCount: number }>('/api/processing/jobs/completed')
  }
}

// Create a singleton instance
export const processingService = new ProcessingService()

export default processingService