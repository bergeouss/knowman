'use client'

import { Clock, ExternalLink, FileText, Globe, Video, Brain, Sparkles, Hash } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useRecentItems } from '@/hooks/useItems'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDistanceToNow } from 'date-fns'

const typeIcons = {
  webpage: Globe,
  document: FileText,
  video: Video,
}

const statusColors = {
  processed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  captured: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
}

const statusIcons = {
  processed: Sparkles,
  processing: Brain,
  captured: Clock,
  archived: FileText,
}

export function RecentItems() {
  const { data: recentItemsData, isLoading } = useRecentItems(5)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Items</CardTitle>
              <CardDescription>Recently captured knowledge items</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-start space-x-4">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const items = recentItemsData?.items || []

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Items</CardTitle>
              <CardDescription>Recently captured knowledge items</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No items yet. Capture your first knowledge item!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Items</CardTitle>
            <CardDescription>Recently captured knowledge items</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => {
            const Icon = typeIcons[item.sourceType as keyof typeof typeIcons] || FileText
            const StatusIcon = statusIcons[item.status as keyof typeof statusIcons] || FileText
            const captureDate = new Date(item.captureDate)
            const timeAgo = formatDistanceToNow(captureDate, { addSuffix: true })

            return (
              <div
                key={item.id}
                className="flex items-start justify-between rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer"
                onClick={() => window.location.href = `/items/${item.id}`}
              >
                <div className="flex items-start space-x-4 flex-1">
                  <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.title}</h4>
                      <Badge className={`flex items-center gap-1 ${statusColors[item.status as keyof typeof statusColors]}`}>
                        <StatusIcon className="h-3 w-3" />
                        {item.status}
                      </Badge>
                    </div>

                    {/* AI Summary */}
                    {item.summary && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center gap-2 mb-1">
                          <Brain className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">AI Summary</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {item.summary}
                        </p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {timeAgo}
                      </span>
                      {item.sourceUrl && (
                        <span className="truncate max-w-[200px]">{item.sourceUrl}</span>
                      )}
                      {item.embeddings && (
                        <span className="flex items-center">
                          <Hash className="mr-1 h-3 w-3" />
                          {item.embeddings.length}D
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {(item.tags && item.tags.length > 0) && (
                      <div className="flex flex-wrap gap-2">
                        {item.tags.slice(0, 5).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.tags.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (item.sourceUrl) {
                      window.open(item.sourceUrl, '_blank')
                    }
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}