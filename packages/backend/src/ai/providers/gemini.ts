import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIProvider, AIProviderType, SummarizationRequest, SummarizationResponse, TaggingRequest, TaggingResponse, EmbeddingRequest, EmbeddingResponse } from '../types'
import { AIConfig } from '../config'
import { logger } from '../../logging'

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI
  private config: AIConfig

  constructor(config: Partial<AIConfig>) {
    this.config = config as AIConfig

    if (!this.config.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required for Gemini provider')
    }

    this.client = new GoogleGenerativeAI(this.config.GEMINI_API_KEY)
  }

  getProviderType(): AIProviderType {
    return 'gemini'
  }

  getModelInfo(): string {
    return `${this.config.GEMINI_MODEL} (Gemini)`
  }

  async summarize(request: SummarizationRequest): Promise<SummarizationResponse> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.GEMINI_MODEL!,
        generationConfig: {
          temperature: this.config.GEMINI_TEMPERATURE,
          maxOutputTokens: this.config.GEMINI_MAX_OUTPUT_TOKENS,
        }
      })

      const prompt = `Please summarize the following content in a concise way. Focus on the main points and key insights.

Title: ${request.title || 'Untitled'}

Content:
${request.content.substring(0, 8000)}

Provide a summary that captures the essence of the content in ${request.maxLength || 500} characters or less.`

      const result = await model.generateContent(prompt)
      const summary = result.response.text().trim()

      if (this.config.AI_ENABLE_LOGGING) {
        logger.info(`Gemini summarization completed: ${summary.substring(0, 100)}...`)
      }

      return {
        summary,
        tokensUsed: undefined, // Gemini doesn't provide token count
        model: this.config.GEMINI_MODEL!,
      }
    } catch (error) {
      logger.error(error, 'Gemini summarization failed')
      throw error
    }
  }

  async generateTags(request: TaggingRequest): Promise<TaggingResponse> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.GEMINI_MODEL!,
        generationConfig: {
          temperature: this.config.GEMINI_TEMPERATURE,
          maxOutputTokens: 200,
        }
      })

      const prompt = `Analyze the following content and generate relevant tags. Consider the main topics, themes, and key concepts.

Title: ${request.title || 'Untitled'}

Content:
${request.content.substring(0, 4000)}

Existing tags (if any): ${request.existingTags?.join(', ') || 'None'}

Generate ${request.maxTags || 5} relevant tags. Return only a comma-separated list of tags, no explanations.`

      const result = await model.generateContent(prompt)
      const tagsText = result.response.text().trim()
      const tags = tagsText.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0)

      if (this.config.AI_ENABLE_LOGGING) {
        logger.info(`Gemini tagging completed: ${tags.join(', ')}`)
      }

      return {
        tags: tags.slice(0, request.maxTags || 5),
        confidence: 0.9,
        model: this.config.GEMINI_MODEL,
      }
    } catch (error) {
      logger.error(error, 'Gemini tagging failed')
      throw error
    }
  }

  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      // Use configured embedding model
      const embeddingModel = this.client.getGenerativeModel({
        model: this.config.GEMINI_EMBEDDING_MODEL || 'text-embedding-004'
      })

      const text = request.title ? `${request.title}\n\n${request.content}` : request.content
      const truncatedText = text.substring(0, 8000)

      const result = await embeddingModel.embedContent(truncatedText)
      const embeddings = result.embedding.values || []

      if (this.config.AI_ENABLE_LOGGING) {
        logger.info(`Gemini embeddings generated: ${embeddings.length} dimensions using ${this.config.GEMINI_EMBEDDING_MODEL || 'text-embedding-004'}`)
      }

      return {
        embeddings,
        model: this.config.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
      }
    } catch (error) {
      logger.error(error, 'Gemini embedding generation failed')
      throw error
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.GEMINI_MODEL!,
        generationConfig: {
          maxOutputTokens: 5,
        }
      })

      await model.generateContent('Hello')
      return true
    } catch (error) {
      logger.warn(error, 'Gemini health check failed')
      return false
    }
  }
}