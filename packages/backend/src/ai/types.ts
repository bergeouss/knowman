export type AIProviderType = 'openai' | 'anthropic' | 'gemini' | 'llamacpp' | 'mock'

export interface AIProviderConfig {
  provider: AIProviderType
  apiKey?: string
  baseURL?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface SummarizationRequest {
  content: string
  title?: string
  language?: string
  maxLength?: number
}

export interface SummarizationResponse {
  summary: string
  tokensUsed?: number | undefined
  model?: string
}

export interface TaggingRequest {
  content: string
  title?: string
  existingTags?: string[]
  maxTags?: number
}

export interface TaggingResponse {
  tags: string[]
  confidence?: number
  model?: string
}

export interface EmbeddingRequest {
  content: string
  title?: string
}

export interface EmbeddingResponse {
  embeddings: number[]
  model?: string
}

export interface AIProvider {
  // Summarization
  summarize(request: SummarizationRequest): Promise<SummarizationResponse>

  // Tagging
  generateTags(request: TaggingRequest): Promise<TaggingResponse>

  // Embeddings
  generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse>

  // Health check
  healthCheck(): Promise<boolean>

  // Provider info
  getProviderType(): AIProviderType
  getModelInfo(): string
}