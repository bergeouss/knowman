'use client'

import { Brain, Sparkles, Hash, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useProcessingStats } from '@/hooks/useProcessing'
import { Skeleton } from '@/components/ui/Skeleton'

export function ProcessingStatus() {
  const { data: stats, isLoading } = useProcessingStats()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-yellow-500" />
            Processing Queue
          </CardTitle>
          <CardDescription>AI processing jobs in progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const queueStats = stats?.queueStats || []
  const summary = stats?.summary || {}

  // Calculate queue counts
  const getQueueCount = (queueName: string) => {
    const queue = queueStats.find(q => q.name === queueName)
    return queue ? queue.waiting + queue.active : 0
  }

  const getQueueCompleted = (queueName: string) => {
    const queue = queueStats.find(q => q.name === queueName)
    return queue ? queue.completed : 0
  }

  const summarizationQueue = getQueueCount('summarization')
  const taggingQueue = getQueueCount('tagging')
  const embeddingQueue = getQueueCount('embedding')
  const extractionQueue = getQueueCount('extraction')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-yellow-500" />
          AI Processing
        </CardTitle>
        <CardDescription>
          {summary.pending > 0 ? `${summary.pending} jobs in progress` : 'All caught up'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summarization */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Summarization</span>
              {summarizationQueue > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {summarizationQueue}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {getQueueCompleted('summarization') > 0 && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {summarizationQueue > 0 && (
                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
              )}
            </div>
          </div>

          {/* Tagging */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Smart Tagging</span>
              {taggingQueue > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {taggingQueue}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {getQueueCompleted('tagging') > 0 && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {taggingQueue > 0 && (
                <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              )}
            </div>
          </div>

          {/* Embeddings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Embeddings</span>
              {embeddingQueue > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {embeddingQueue}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {getQueueCompleted('embedding') > 0 && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {embeddingQueue > 0 && (
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>
          </div>

          {/* Extraction */}
          {extractionQueue > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Extraction</span>
                <Badge variant="secondary" className="text-xs">
                  {extractionQueue}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Completed Today</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {summary.completed || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Success Rate</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {summary.completed && summary.completed > 0
                    ? `${Math.round((summary.completed / (summary.completed + summary.failed || 1)) * 100)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}