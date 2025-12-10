'use client'

import { useState, useEffect } from 'react'
import { Link, Globe, FileText, Upload, Zap, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import { useTags, useCreateTag, useSuggestTags } from '@/hooks/useTags'
import { captureService } from '@/services/capture.service'

const captureTypes = [
  { id: 'webpage', label: 'Webpage', icon: Globe, description: 'Capture content from a URL' },
  { id: 'text', label: 'Text', icon: FileText, description: 'Paste or write text content' },
  { id: 'file', label: 'File', icon: Upload, description: 'Upload PDF, markdown, or text files' },
  { id: 'ai', label: 'AI Summary', icon: Zap, description: 'Generate summary from existing content' },
]

export default function CapturePage() {
  const [activeType, setActiveType] = useState('webpage')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Fetch existing tags
  const { data: existingTags, isLoading: isLoadingTags } = useTags()
  const createTagMutation = useCreateTag()
  const suggestTagsMutation = useSuggestTags()

  // Reset file when switching away from file type
  useEffect(() => {
    if (activeType !== 'file' && selectedFile) {
      setSelectedFile(null)
    }
  }, [activeType, selectedFile])

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')

      // Clear suggestions when tag is added
      setSuggestedTags([])
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      handleAddTag()
    }
  }

  // Get tag suggestions when tag input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tagInput.trim().length > 1) {
        suggestTagsMutation.mutate(tagInput.trim(), {
          onSuccess: (response) => {
            if (response.success && response.data) {
              // Filter out tags already selected
              const filteredSuggestions = response.data.filter(
                tag => !tags.includes(tag)
              )
              setSuggestedTags(filteredSuggestions)
            }
          }
        })
      } else {
        setSuggestedTags([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [tagInput, tags, suggestTagsMutation])

  const handleSelectSuggestedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
      setSuggestedTags([])
    }
  }

  const handleCreateNewTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag) {
      createTagMutation.mutate(
        { name: trimmedTag },
        {
          onSuccess: (response) => {
            if (response.success) {
              setTags([...tags, trimmedTag])
              setTagInput('')
              setSuggestedTags([])
            }
          }
        }
      )
    }
  }

  const handleSubmit = async () => {
    if (activeType === 'webpage' && !url.trim()) {
      toast.error('Please enter a URL')
      return
    }

    if (activeType !== 'webpage' && !title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (activeType === 'text' && !content.trim()) {
      toast.error('Please enter content')
      return
    }

    if (activeType === 'file' && !selectedFile) {
      toast.error('Please select a file to upload')
      return
    }

    setIsSubmitting(true)
    toast.info('Capturing content...')

    try {
      let response

      if (activeType === 'file' && selectedFile) {
        // Use file upload for file type
        const uploadRequest = {
          file: selectedFile,
          title: title.trim(),
          tags: tags,
          metadata: {
            captureType: activeType,
            timestamp: new Date().toISOString()
          }
        }
        response = await captureService.uploadFile(uploadRequest)
      } else if (activeType === 'webpage') {
        // Use captureFromUrl for webpage type (automatically fetches content)
        response = await captureService.captureFromUrl(url.trim(), title.trim() || undefined, tags)
      } else {
        // Use regular capture for other types
        // Map UI capture types to backend source types
        const sourceTypeMap: Record<string, any> = {
          'text': 'note',
          'file': 'document',
          'ai': 'note'
        }

        const captureRequest = {
          title: title.trim(),
          content: content.trim(), // Content is required for non-webpage types
          tags: tags,
          sourceType: sourceTypeMap[activeType] || 'note',
          metadata: {
            captureType: activeType,
            timestamp: new Date().toISOString()
          }
        }
        response = await captureService.capture(captureRequest)
      }

      if (response.success) {
        toast.success('Content captured successfully! Processing started.')

        // Reset form
        setUrl('')
        setTitle('')
        setContent('')
        setTags([])
        setSelectedFile(null)

        // Redirect to items page after a delay
        setTimeout(() => {
          window.location.href = '/items'
        }, 1000)
      } else {
        toast.error(response.error || 'Failed to capture content')
      }

    } catch (error) {
      toast.error('Failed to capture content. Please try again.')
      console.error('Capture error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderForm = () => {
    switch (activeType) {
      case 'webpage':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">URL</label>
              <Input
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Title (Optional)</label>
              <Input
                placeholder="Article title (will be extracted from webpage if not provided)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        )

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                placeholder="Enter a title for this content"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <Textarea
                placeholder="Paste or write your content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] w-full"
                required
              />
            </div>
          </div>
        )

      case 'file':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Upload File</label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Supports PDF, Markdown, Text, DOC, DOCX
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.pdf,.md,.txt,.doc,.docx,.html,.json,.xml'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        setSelectedFile(file)
                        setTitle(file.name.replace(/\.[^/.]+$/, '')) // Remove extension
                        toast.info(`Selected file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)
                      }
                    }
                    input.click()
                  }}
                >
                  Browse Files
                </Button>
                {selectedFile && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                placeholder="Enter a title for this file"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        )

      case 'ai':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Item to Summarize</label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select an existing item...</option>
                <option value="1">Test AI Knowledge</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">AI Instructions (Optional)</label>
              <Textarea
                placeholder="e.g., 'Focus on technical details', 'Make it suitable for beginners'"
                className="min-h-[100px] w-full"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Capture Content</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add new knowledge to your personal knowledge base
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => window.location.href = '/items'}>
            View All Items
          </Button>
          <Button onClick={() => window.location.href = '/'}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Capture Type */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Capture Type</CardTitle>
              <CardDescription>Choose how you want to add content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {captureTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => setActiveType(type.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        activeType === type.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          activeType === type.id
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{type.label}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Add tags to organize your content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button onClick={handleAddTag} variant="outline">
                    Add
                  </Button>
                </div>

                {/* Tag suggestions */}
                {suggestedTags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Suggestions:</p>
                    <div className="flex flex-wrap gap-2">
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
                )}

                {/* Create new tag option */}
                {tagInput.trim().length > 0 && !suggestedTags.includes(tagInput.trim()) && !tags.includes(tagInput.trim()) && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Create new tag:</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {tagInput.trim()}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCreateNewTag}
                        disabled={createTagMutation.isPending}
                      >
                        {createTagMutation.isPending ? 'Creating...' : 'Create'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Selected tags */}
                {tags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Selected tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
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

                {/* Existing tags (if no input) */}
                {!tagInput.trim() && existingTags && existingTags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Existing tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {existingTags.slice(0, 10).map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className={`cursor-pointer ${
                            tags.includes(tag.name)
                              ? 'bg-primary text-white'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                          onClick={() => {
                            if (!tags.includes(tag.name)) {
                              setTags([...tags, tag.name])
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Capture Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {captureTypes.find(t => t.id === activeType)?.label || 'Capture Content'}
              </CardTitle>
              <CardDescription>
                {captureTypes.find(t => t.id === activeType)?.description || 'Add new content to your knowledge base'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {renderForm()}

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Capturing...' : 'Capture Content'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Tips for Better Captures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>For webpages, include the full URL including https://</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Use descriptive titles that you&apos;ll recognize later</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Add relevant tags to make items easier to find</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>For text captures, include enough context for AI processing</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}