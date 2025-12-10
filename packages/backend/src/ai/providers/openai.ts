import OpenAI from 'openai'
import { AIProvider, AIProviderType, SummarizationRequest, SummarizationResponse, TaggingRequest, TaggingResponse, EmbeddingRequest, EmbeddingResponse } from '../types'
import { AIConfig } from '../config'
import { logger } from '../../logging'

export class OpenAIProvider implements AIProvider {
  private client: OpenAI
  private config: AIConfig

  constructor(config: Partial<AIConfig>) {
    this.config = config as AIConfig

    if (!this.config.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for OpenAI provider')
    }

    this.client = new OpenAI({
      apiKey: this.config.OPENAI_API_KEY,
      baseURL: this.config.OPENAI_BASE_URL,
      timeout: this.config.AI_REQUEST_TIMEOUT,
      maxRetries: this.config.AI_MAX_RETRIES,
    })
  }

  getProviderType(): AIProviderType {
    return 'openai'
  }

  getModelInfo(): string {
    return `${this.config.OPENAI_MODEL} (OpenAI)`
  }

  async summarize(request: SummarizationRequest): Promise<SummarizationResponse> {
    try {
      const prompt = `Please summarize the following content in a concise way. Focus on the main points and key insights.

Title: ${request.title || 'Untitled'}

Content:
${request.content.substring(0, 8000)}  // Limit content length

Provide a summary that captures the essence of the content in ${request.maxLength || 500} characters or less.`

      const response = await this.client.chat.completions.create({
        model: this.config.OPENAI_MODEL!,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates concise, accurate summaries of text content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.OPENAI_TEMPERATURE,
        max_tokens: this.config.OPENAI_MAX_TOKENS,
      })

      const summary = response.choices[0]?.message?.content?.trim() || ''

      if (this.config.AI_ENABLE_LOGGING) {
        logger.info(`OpenAI summarization completed: ${summary.substring(0, 100)}...`)
      }

      return {
        summary,
        tokensUsed: response.usage?.total_tokens,
        model: this.config.OPENAI_MODEL!,
      }
    } catch (error) {
      logger.error(error, 'OpenAI summarization failed')
      throw error
    }
  }

  async generateTags(request: TaggingRequest): Promise<TaggingResponse> {
    try {
      const prompt = `Analyze the following content and generate relevant tags. Consider the main topics, themes, and key concepts.

Title: ${request.title || 'Untitled'}

Content:
${request.content.substring(0, 4000)}  // Limit content length

Existing tags (if any): ${request.existingTags?.join(', ') || 'None'}

Generate ${request.maxTags || 5} relevant tags. Return only a comma-separated list of tags, no explanations.`

      const response = await this.client.chat.completions.create({
        model: this.config.OPENAI_MODEL!,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes text content and generates relevant, concise tags.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.OPENAI_TEMPERATURE,
        max_tokens: 200,
      })

      const tagsText = response.choices[0]?.message?.content?.trim() || ''
      const tags = tagsText.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0)

      if (this.config.AI_ENABLE_LOGGING) {
        logger.info(`OpenAI tagging completed: ${tags.join(', ')}`)
      }

      return {
        tags: tags.slice(0, request.maxTags || 5),
        confidence: 0.9,
        model: this.config.OPENAI_MODEL,
      }
    } catch (error) {
      logger.error(error, 'OpenAI tagging failed')
      throw error
    }
  }

  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      // Use configured embedding model or default
      const embeddingModel = this.config.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002'

      const text = request.title ? `${request.title}\n\n${request.content}` : request.content
      const truncatedText = text.substring(0, 8000)  // OpenAI embedding limit

      const response = await this.client.embeddings.create({
        model: embeddingModel,
        input: truncatedText,
      })

      const embeddings = response.data[0]?.embedding || []

      if (this.config.AI_ENABLE_LOGGING) {
        logger.info(`OpenAI embeddings generated: ${embeddings.length} dimensions using ${embeddingModel}`)
      }

      return {
        embeddings,
        model: embeddingModel,
      }
    } catch (error) {
      logger.error(error, 'OpenAI embedding generation failed')
      throw error
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check by making a small completion request
      await this.client.chat.completions.create({
        model: this.config.OPENAI_MODEL!,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      })
      return true
    } catch (error) {
      logger.warn(error, 'OpenAI health check failed')
      return false
    }
  }
}