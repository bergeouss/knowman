import { AIProvider, AIProviderType } from './types'
import { getAIConfig, validateAIConfig, getProviderConfig } from './config'
import { MockAIProvider } from './providers/mock'
import { logger } from '../logging'

// Provider imports
import { OpenAIProvider } from './providers/openai'
import { GeminiProvider } from './providers/gemini'
// import { AnthropicProvider } from './providers/anthropic'
// import { LlamaCppProvider } from './providers/llamacpp'

export class AIProviderFactory {
  private static mainInstance: AIProvider | null = null
  private static embeddingInstance: AIProvider | null = null

  static getInstance(forEmbeddings: boolean = false): AIProvider {
    if (forEmbeddings) {
      if (!this.embeddingInstance) {
        this.embeddingInstance = this.createProvider(true)
      }
      return this.embeddingInstance
    } else {
      if (!this.mainInstance) {
        this.mainInstance = this.createProvider(false)
      }
      return this.mainInstance
    }
  }

  static createProvider(forEmbeddings: boolean = false): AIProvider {
    const config = getAIConfig()
    const validation = validateAIConfig()

    if (!validation.isValid) {
      logger.warn(`AI configuration validation failed: ${validation.errors.join(', ')}`)
      logger.warn('Falling back to mock provider')
      return new MockAIProvider()
    }

    // Determine which provider to use
    let providerType: AIProviderType = config.AI_PROVIDER
    if (forEmbeddings && config.EMBEDDING_PROVIDER) {
      providerType = config.EMBEDDING_PROVIDER
    }

    const providerConfig = getProviderConfig(providerType, forEmbeddings)

    switch (providerType) {
      case 'openai':
        return new OpenAIProvider(providerConfig)

      case 'anthropic':
        // return new AnthropicProvider(providerConfig)
        logger.info('Anthropic provider selected but not implemented, using mock')
        return new MockAIProvider()

      case 'gemini':
        return new GeminiProvider(providerConfig)

      case 'llamacpp':
        // return new LlamaCppProvider(providerConfig)
        logger.info('Llama.cpp provider selected but not implemented, using mock')
        return new MockAIProvider()

      case 'mock':
        logger.info('Using mock AI provider (no actual AI calls)')
        return new MockAIProvider()

      default:
        logger.warn(`Unknown provider: ${providerType}, using mock`)
        return new MockAIProvider()
    }
  }

  static async testProvider(forEmbeddings: boolean = false): Promise<{
    provider: string
    health: boolean
    config: any
  }> {
    const provider = this.getInstance(forEmbeddings)
    const health = await provider.healthCheck()
    const config = getAIConfig()

    return {
      provider: provider.getProviderType(),
      health,
      config: {
        mainProvider: config.AI_PROVIDER,
        embeddingProvider: config.EMBEDDING_PROVIDER || config.AI_PROVIDER,
        model: provider.getModelInfo(),
        testing: forEmbeddings ? 'embedding' : 'main'
      }
    }
  }

  static resetInstances(): void {
    this.mainInstance = null
    this.embeddingInstance = null
  }
}