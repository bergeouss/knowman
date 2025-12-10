'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, Tag, FileText, Globe, Video, Zap, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useSearch, useSearchSuggestions, useSearchFilters } from '@/hooks/useSearch'
import { useTags } from '@/hooks/useTags'
import { Skeleton } from '@/components/ui/Skeleton'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
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

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'date', label: 'Date' },
  { value: 'importance', label: 'Importance' },
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

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string[]>([])
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [sortBy, setSortBy] = useState('relevance')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])

  // Fetch existing tags
  const { data: existingTags, isLoading: isLoadingTags } = useTags()
  const { data: searchSuggestions } = useSearchSuggestions(debouncedSearch)
  const { data: searchFilters } = useSearchFilters()

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Build search params
  const searchParams = {
    query: debouncedSearch,
    filters: {
      tags: tagFilter.length > 0 ? tagFilter : undefined,
      sourceTypes: sourceTypeFilter.length > 0 ? sourceTypeFilter : undefined,
      status: statusFilter.length > 0 ? statusFilter : undefined,
    },
    limit,
    offset,
    sortBy: sortBy as 'relevance' | 'date' | 'importance',
    sortOrder,
  }

  // Execute search
  const { data: searchData, isLoading, refetch } = useSearch(searchParams)

  const results = searchData?.results || []
  const total = searchData?.total || 0
  const suggestedTagsFromSearch = searchData?.suggestedTags || []
  const suggestedQueries = searchData?.suggestedQueries || []

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tagFilter.includes(trimmedTag)) {
      setTagFilter([...tagFilter, trimmedTag])
      setTagInput('')
      setSuggestedTags([])
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTagFilter(tagFilter.filter(tag => tag !== tagToRemove))
  }

  const handleRemoveStatus = (statusToRemove: string) => {
    setStatusFilter(statusFilter.filter(status => status !== statusToRemove))
  }

  const handleRemoveSourceType = (typeToRemove: string) => {
    setSourceTypeFilter(sourceTypeFilter.filter(type => type !== typeToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSelectSuggestedTag = (tag: string) => {
    if (!tagFilter.includes(tag)) {
      setTagFilter([...tagFilter, tag])
      setTagInput('')
      setSuggestedTags([])
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter([])
    setSourceTypeFilter([])
    setTagFilter([])
    setTagInput('')
    setSuggestedTags([])
    setSortBy('relevance')
    setSortOrder('desc')
    toast.info('Filters cleared')
  }

  const handleLoadMore = () => {
    setOffset(prev => prev + limit)
  }

  const handleResetPagination = () => {
    setOffset(0)
    refetch()
  }

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Search</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Search across all your knowledge items with advanced filters
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
          <Button onClick={() => window.location.href = '/'}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search</CardTitle>
          <CardDescription>Enter your search query</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search across titles, content, and summaries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg"
              />
            </div>

            {/* Search suggestions */}
            {searchSuggestions && searchSuggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {searchSuggestions.map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setSearchQuery(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Query suggestions from search results */}
            {suggestedQueries.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Try these related searches:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQueries.map((query) => (
                    <Badge
                      key={query}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => setSearchQuery(query)}
                    >
                      {query}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowAdvanced(!showAdvanced)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Filters</CardTitle>
              <CardDescription>Filter your search results</CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showAdvanced && (
          <CardContent>
            <div className="space-y-6">
              {/* Active filters */}
              {(statusFilter.length > 0 || sourceTypeFilter.length > 0 || tagFilter.length > 0) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Active Filters:</p>
                  <div className="flex flex-wrap gap-2">
                    {statusFilter.map((status) => (
                      <Badge key={status} variant="secondary" className="flex items-center gap-1">
                        Status: {status}
                        <button
                          onClick={() => handleRemoveStatus(status)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {sourceTypeFilter.map((type) => (
                      <Badge key={type} variant="secondary" className="flex items-center gap-1">
                        Type: {type}
                        <button
                          onClick={() => handleRemoveSourceType(type)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {tagFilter.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Status filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Status</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant={statusFilter.includes(option.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (statusFilter.includes(option.value)) {
                          handleRemoveStatus(option.value)
                        } else {
                          setStatusFilter([...statusFilter, option.value])
                        }
                      }}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Source type filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Source Type</label>
                <div className="flex flex-wrap gap-2">
                  {sourceTypeOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant={sourceTypeFilter.includes(option.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (sourceTypeFilter.includes(option.value)) {
                          handleRemoveSourceType(option.value)
                        } else {
                          setSourceTypeFilter([...sourceTypeFilter, option.value])
                        }
                      }}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tag filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Tags</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag filter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button onClick={handleAddTag} variant="outline">
                    Add
                  </Button>
                </div>

                {/* Tag suggestions from search */}
                {suggestedTagsFromSearch.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Suggested tags for your search:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTagsFromSearch.map((tag) => (
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
                )}

                {/* Existing tags */}
                {existingTags && existingTags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Popular tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {existingTags.slice(0, 12).map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={tagFilter.includes(tag.name) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (tagFilter.includes(tag.name)) {
                              handleRemoveTag(tag.name)
                            } else {
                              setTagFilter([...tagFilter, tag.name])
                            }
                          }}
                        >
                          {tag.name} ({tag.usageCount})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Sort Order</label>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={toggleSortOrder}
                  >
                    {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Filter className="h-4 w-4" />
                  <span>
                    {total > 0 ? `Found ${total} items` : 'No items found'}
                    {debouncedSearch && ` for "${debouncedSearch}"`}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    Clear All
                  </Button>
                  <Button size="sm" onClick={handleResetPagination}>
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Search Results */}
      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
          <CardDescription>
            {total > 0 ? `Showing ${results.length} of ${total} results` : 'No results found'}
          </CardDescription>
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
          ) : results.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Search className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No results found</h3>
              <p className="mb-6 text-gray-500 dark:text-gray-400">
                {debouncedSearch || statusFilter.length > 0 || sourceTypeFilter.length > 0 || tagFilter.length > 0
                  ? 'Try adjusting your search query or filters'
                  : 'Enter a search query to find knowledge items'}
              </p>
              <Button onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => {
                const item = result.knowledgeItem
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
                          {result.relevanceScore > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {Math.round(result.relevanceScore * 100)}% match
                            </Badge>
                          )}
                        </div>
                        {/* Highlights */}
                        {result.highlights && (result.highlights.title.length > 0 || result.highlights.content.length > 0) && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {result.highlights.title.map((highlight, idx) => (
                              <div key={idx} dangerouslySetInnerHTML={{ __html: highlight }} />
                            ))}
                            {result.highlights.content.map((highlight, idx) => (
                              <div key={idx} dangerouslySetInnerHTML={{ __html: highlight }} />
                            ))}
                          </div>
                        )}
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
                  </div>
                )
              })}

              {/* Pagination */}
              {total > limit && (
                <div className="flex items-center justify-between pt-6 border-t">
                  <div className="text-sm text-gray-500">
                    Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} results
                  </div>
                  <div className="flex gap-2">
                    {offset > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => setOffset(prev => Math.max(0, prev - limit))}
                      >
                        Previous
                      </Button>
                    )}
                    {offset + limit < total && (
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                      >
                        Load More
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </ProtectedRoute>
  )
}