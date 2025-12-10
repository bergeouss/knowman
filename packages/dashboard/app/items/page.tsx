'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, Tag, FileText, Globe, Video, Download, MoreVertical, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useItems } from '@/hooks/useItems'
import { useTags, useSuggestTags } from '@/hooks/useTags'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'processed', label: 'Processed' },
  { value: 'processing', label: 'Processing' },
  { value: 'captured', label: 'Captured' },
  { value: 'archived', label: 'Archived' },
]

const sourceTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'webpage', label: 'Webpage' },
  { value: 'document', label: 'Document' },
  { value: 'pdf', label: 'PDF' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'image', label: 'Image' },
  { value: 'note', label: 'Note' },
]

const typeIcons = {
  webpage: Globe,
  document: FileText,
  pdf: FileText,
  video: Video,
  audio: FileText,
  image: FileText,
  note: FileText,
}

const statusColors = {
  processed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  captured: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
}

export default function ItemsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceTypeFilter, setSourceTypeFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Fetch existing tags
  const { data: existingTags, isLoading: isLoadingTags } = useTags()
  const suggestTagsMutation = useSuggestTags()

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Get tag suggestions when tag input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tagInput.trim().length > 1) {
        suggestTagsMutation.mutate(tagInput.trim(), {
          onSuccess: (response) => {
            if (response.success && response.data) {
              setSuggestedTags(response.data)
            }
          }
        })
      } else {
        setSuggestedTags([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [tagInput, suggestTagsMutation])

  const handleSelectSuggestedTag = (tag: string) => {
    setTagFilter(tag)
    setTagInput('')
    setSuggestedTags([])
  }

  const handleClearTagFilter = () => {
    setTagFilter('')
    setTagInput('')
    setSuggestedTags([])
  }

  const { data: itemsData, isLoading, refetch } = useItems({
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    sourceType: sourceTypeFilter !== 'all' ? sourceTypeFilter : undefined,
    tag: tagFilter || undefined,
    limit: 50,
    sortBy: 'captureDate',
    sortOrder: 'desc',
  })

  const items = itemsData?.items || []
  const totalItems = itemsData?.total || 0

  const handleExport = () => {
    toast.info('Preparing export...')
    // In a real implementation, this would trigger a download
    setTimeout(() => {
      toast.success('Export completed!')
    }, 1500)
  }

  const handleRefresh = () => {
    refetch()
    toast.success('Items refreshed')
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setSourceTypeFilter('all')
    setTagFilter('')
    setTagInput('')
    setSuggestedTags([])
    toast.info('Filters cleared')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Items</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and manage all your captured knowledge items
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => window.location.href = '/'}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Filter your knowledge items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Search items by title or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={sourceTypeFilter}
                  onChange={(e) => setSourceTypeFilter(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {sourceTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear
                </Button>
              </div>
            </div>

            {/* Tag Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Filter by Tag</label>
              <div className="flex flex-col gap-2">
                {tagFilter ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {tagFilter}
                      <button
                        onClick={handleClearTagFilter}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder="Type to filter by tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="w-full"
                    />
                    {/* Tag suggestions */}
                    {suggestedTags.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border bg-white dark:bg-gray-900 shadow-lg">
                        <div className="p-2">
                          <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Suggestions:</p>
                          <div className="flex flex-wrap gap-1">
                            {suggestedTags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => handleSelectSuggestedTag(tag)}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Existing tags (if no input) */}
                {!tagInput.trim() && !tagFilter && existingTags && existingTags.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Popular tags:</p>
                    <div className="flex flex-wrap gap-1">
                      {existingTags.slice(0, 8).map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => setTagFilter(tag.name)}
                        >
                          {tag.name} ({tag.usageCount})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="h-4 w-4" />
              <span>
                Showing {items.length} of {totalItems} items
                {debouncedSearch && ` matching "${debouncedSearch}"`}
                {statusFilter !== 'all' && ` with status "${statusFilter}"`}
                {sourceTypeFilter !== 'all' && ` of type "${sourceTypeFilter}"`}
                {tagFilter && ` with tag "${tagFilter}"`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>Your captured knowledge items</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-3 w-48" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <FileText className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No items found</h3>
              <p className="mb-6 text-gray-500 dark:text-gray-400">
                {debouncedSearch || statusFilter !== 'all' || sourceTypeFilter !== 'all' || tagFilter
                  ? 'Try adjusting your filters or search query'
                  : 'Start by capturing your first knowledge item'}
              </p>
              <Button onClick={() => window.location.href = '/'}>
                {debouncedSearch || statusFilter !== 'all' || sourceTypeFilter !== 'all' || tagFilter
                  ? 'Clear Filters'
                  : 'Capture First Item'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const Icon = typeIcons[item.sourceType as keyof typeof typeIcons] || FileText
                const captureDate = new Date(item.captureDate)
                const timeAgo = formatDistanceToNow(captureDate, { addSuffix: true })

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer"
                    onClick={() => window.location.href = `/items/${item.id}`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {timeAgo}
                          </span>
                          {item.sourceUrl && (
                            <span className="truncate max-w-[200px]">{item.sourceUrl}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.tags?.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {tag}
                            </Badge>
                          ))}
                          {item.tags && item.tags.length > 3 && (
                            <Badge variant="secondary">+{item.tags.length - 3}</Badge>
                          )}
                          <Badge className={statusColors[item.status as keyof typeof statusColors]}>
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Show item actions menu
                        toast.info(`Actions for: ${item.title}`)
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}