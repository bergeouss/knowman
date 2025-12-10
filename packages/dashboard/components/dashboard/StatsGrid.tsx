'use client'

import { BookOpen, FileText, Search, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useItems } from '@/hooks/useItems'
import { useProcessingStats } from '@/hooks/useProcessing'
import { useTagsStats } from '@/hooks/useTags'
import { Skeleton } from '@/components/ui/Skeleton'

export function StatsGrid() {
  const { data: itemsData, isLoading: itemsLoading } = useItems({ limit: 1 })
  const { data: processingData, isLoading: processingLoading } = useProcessingStats()
  const { data: tagsData, isLoading: tagsLoading } = useTagsStats()

  const totalItems = itemsData?.total || 0
  const processedItems = processingData?.completedJobs || 0
  const totalTags = tagsData?.totalTags || 0

  const stats = [
    {
      title: 'Total Items',
      value: totalItems.toLocaleString(),
      change: '+0%', // TODO: Calculate actual change
      icon: BookOpen,
      color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
      isLoading: itemsLoading,
    },
    {
      title: 'Processed',
      value: processedItems.toLocaleString(),
      change: '+0%', // TODO: Calculate actual change
      icon: FileText,
      color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
      isLoading: processingLoading,
    },
    {
      title: 'Searches',
      value: '0', // TODO: Add search tracking
      change: '+0%',
      icon: Search,
      color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
      isLoading: false,
    },
    {
      title: 'Tags',
      value: totalTags.toLocaleString(),
      change: '+0%', // TODO: Calculate actual change
      icon: Users,
      color: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
      isLoading: tagsLoading,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-full p-2 ${stat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {stat.isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="text-green-600 dark:text-green-400">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}