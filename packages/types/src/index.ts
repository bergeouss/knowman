// Shared types for KnowMan project

export interface User {
  id: string
  email?: string
  name?: string
  createdAt: Date
  updatedAt: Date
  preferences?: UserPreferences
}

export interface UserPreferences {
  autoCapture: boolean
  theme: 'light' | 'dark' | 'system'
  language: string
  notificationSettings: NotificationSettings
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  digestFrequency: 'daily' | 'weekly' | 'monthly' | 'never'
}

export interface KnowledgeItem {
  id: string
  userId: string
  sourceType: 'webpage' | 'pdf' | 'document' | 'video' | 'audio' | 'image' | 'note'
  sourceUrl?: string
  sourceFile?: string
  title: string
  content: string
  summary?: string
  tags: string[]
  metadata: Record<string, any>
  rawContent?: string
  processedContent?: string
  embeddings?: number[]
  importanceScore: number
  readabilityScore: number
  captureDate: Date
  processedDate?: Date
  lastReviewed?: Date
  reviewCount: number
  nextReviewDate?: Date
  status: 'captured' | 'processing' | 'processed' | 'archived' | 'deleted'
}

export interface KnowledgeGraphNode {
  id: string
  label: string
  type: 'concept' | 'topic' | 'entity' | 'document'
  properties: Record<string, any>
  embeddings?: number[]
  importance: number
}

export interface KnowledgeGraphEdge {
  id: string
  sourceId: string
  targetId: string
  type: string
  weight: number
  properties: Record<string, any>
}

export interface ProcessingJob {
  id: string
  knowledgeItemId: string
  userId: string
  type: 'summarization' | 'embedding' | 'tagging' | 'extraction'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority: number
  attempts: number
  input: Record<string, any>
  output?: Record<string, any>
  error?: string
  createdAt: Date
  updatedAt: Date
  startedAt?: Date
  completedAt?: Date
}

export interface Tag {
  id: string
  name: string
  userId: string
  color?: string
  description?: string
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export interface SearchQuery {
  query: string
  filters?: SearchFilters
  limit?: number
  offset?: number
  sortBy?: 'relevance' | 'date' | 'importance'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchFilters {
  tags?: string[]
  sourceTypes?: string[]
  dateRange?: {
    from?: Date
    to?: Date
  }
  minImportance?: number
  status?: string[]
}

export interface SearchResult {
  knowledgeItem: KnowledgeItem
  relevanceScore: number
  highlights: Record<string, string[]>
}

export interface LLMConfig {
  model: string
  temperature: number
  maxTokens: number
  systemPrompt?: string
}

export interface ExtensionSettings {
  enabled: boolean
  autoCapture: boolean
  apiUrl: string
  userId?: string
  hotkeys?: Record<string, string>
  captureOptions: CaptureOptions
}

export interface CaptureOptions {
  includeImages: boolean
  includeLinks: boolean
  maxContentLength: number
  preserveFormatting: boolean
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: Date
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// API request/response types
export interface ListItemsParams {
  limit?: number
  offset?: number
  status?: string
  sourceType?: string
  tag?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CaptureRequest {
  url: string
  content: string
  title: string
  userId: string
  metadata?: Record<string, any>
}

export interface CaptureResponse {
  knowledgeItem: KnowledgeItem
  processingJobs: ProcessingJob[]
}

export interface SearchRequest {
  query: string
  filters?: SearchFilters
  limit?: number
  offset?: number
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  suggestedTags?: string[]
  suggestedQueries?: string[]
}

// WebSocket/real-time events
export interface ProcessingEvent {
  type: 'job_created' | 'job_started' | 'job_completed' | 'job_failed'
  jobId: string
  knowledgeItemId: string
  userId: string
  timestamp: Date
  data?: Record<string, any>
}

export interface ReviewEvent {
  type: 'review_scheduled' | 'review_completed' | 'review_skipped'
  knowledgeItemId: string
  userId: string
  timestamp: Date
  nextReviewDate?: Date
}

// Database schema types for TypeORM
export interface DatabaseSchema {
  users: User[]
  knowledgeItems: KnowledgeItem[]
  tags: Tag[]
  processingJobs: ProcessingJob[]
  knowledgeGraphNodes: KnowledgeGraphNode[]
  knowledgeGraphEdges: KnowledgeGraphEdge[]
}