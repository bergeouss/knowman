import { z } from 'zod'
import { AIProviderType } from './types'

// Environment variable schema for AI configuration
export const aiConfigSchema = z.object({
  // Provider selection
  AI_PROVIDER: z.enum(['openai', 'anthropic', 'gemini', 'llamacpp', 'mock']).default('mock'),

  // Embedding provider (can be different from main provider)
  EMBEDDING_PROVIDER: z.enum(['openai', 'anthropic', 'gemini', 'llamacpp', 'mock']).optional(),

  // OpenAI configuration
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional().default('https://api.openai.com/v1'),
  OPENAI_MODEL: z.string().optional().default('gpt-4o-mini'),
  OPENAI_TEMPERATURE: z.coerce.number().min(0).max(2).optional().default(0.7),
  OPENAI_MAX_TOKENS: z.coerce.number().min(1).max(4000).optional().default(1000),
  OPENAI_EMBEDDING_MODEL: z.string().optional().default('text-embedding-ada-002'),

  // Anthropic configuration
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().optional().default('claude-3-haiku-20240307'),
  ANTHROPIC_TEMPERATURE: z.coerce.number().min(0).max(1).optional().default(0.7),
  ANTHROPIC_MAX_TOKENS: z.coerce.number().min(1).max(4096).optional().default(1000),

  // Gemini configuration
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional().default('gemini-1.5-flash'),
  GEMINI_TEMPERATURE: z.coerce.number().min(0).max(1).optional().default(0.7),
  GEMINI_MAX_OUTPUT_TOKENS: z.coerce.number().min(1).max(8192).optional().default(1000),
  GEMINI_EMBEDDING_MODEL: z.string().optional().default('text-embedding-004'),

  // Llama.cpp configuration
  LLAMACPP_BASE_URL: z.string().url().optional().default('http://localhost:8080'),
  LLAMACPP_MODEL: z.string().optional().default('llama2'),
  LLAMACPP_TEMPERATURE: z.coerce.number().min(0).max(2).optional().default(0.8),
  LLAMACPP_MAX_TOKENS: z.coerce.number().min(1).max(4000).optional().default(1000),
  LLAMACPP_EMBEDDING_MODEL: z.string().optional(),

  // Common settings
  AI_REQUEST_TIMEOUT: z.coerce.number().min(1000).max(60000).optional().default(30000),
  AI_MAX_RETRIES: z.coerce.number().min(0).max(5).optional().default(3),
  AI_ENABLE_LOGGING: z.enum(['true', 'false']).transform(val => val === 'true').optional().default('true'),
})

export type AIConfig = z.infer<typeof aiConfigSchema>

export function getAIConfig(): AIConfig {
  const env = process.env

  const config = {
    AI_PROVIDER: env.AI_PROVIDER,
    EMBEDDING_PROVIDER: env.EMBEDDING_PROVIDER,
    OPENAI_API_KEY: env.OPENAI_API_KEY,
    OPENAI_BASE_URL: env.OPENAI_BASE_URL,
    OPENAI_MODEL: env.OPENAI_MODEL,
    OPENAI_TEMPERATURE: env.OPENAI_TEMPERATURE,
    OPENAI_MAX_TOKENS: env.OPENAI_MAX_TOKENS,
    OPENAI_EMBEDDING_MODEL: env.OPENAI_EMBEDDING_MODEL,
    ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: env.ANTHROPIC_MODEL,
    ANTHROPIC_TEMPERATURE: env.ANTHROPIC_TEMPERATURE,
    ANTHROPIC_MAX_TOKENS: env.ANTHROPIC_MAX_TOKENS,
    GEMINI_API_KEY: env.GEMINI_API_KEY,
    GEMINI_MODEL: env.GEMINI_MODEL,
    GEMINI_TEMPERATURE: env.GEMINI_TEMPERATURE,
    GEMINI_MAX_OUTPUT_TOKENS: env.GEMINI_MAX_OUTPUT_TOKENS,
    GEMINI_EMBEDDING_MODEL: env.GEMINI_EMBEDDING_MODEL,
    LLAMACPP_BASE_URL: env.LLAMACPP_BASE_URL,
    LLAMACPP_MODEL: env.LLAMACPP_MODEL,
    LLAMACPP_TEMPERATURE: env.LLAMACPP_TEMPERATURE,
    LLAMACPP_MAX_TOKENS: env.LLAMACPP_MAX_TOKENS,
    LLAMACPP_EMBEDDING_MODEL: env.LLAMACPP_EMBEDDING_MODEL,
    AI_REQUEST_TIMEOUT: env.AI_REQUEST_TIMEOUT,
    AI_MAX_RETRIES: env.AI_MAX_RETRIES,
    AI_ENABLE_LOGGING: env.AI_ENABLE_LOGGING,
  }

  return aiConfigSchema.parse(config)
}

export function validateAIConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const config = getAIConfig()

  // Validate provider-specific requirements
  switch (config.AI_PROVIDER) {
    case 'openai':
      if (!config.OPENAI_API_KEY) {
        errors.push('OPENAI_API_KEY is required when AI_PROVIDER=openai')
      }
      break
    case 'anthropic':
      if (!config.ANTHROPIC_API_KEY) {
        errors.push('ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic')
      }
      break
    case 'gemini':
      if (!config.GEMINI_API_KEY) {
        errors.push('GEMINI_API_KEY is required when AI_PROVIDER=gemini')
      }
      break
    case 'llamacpp':
      // Llama.cpp doesn't require API key, but base URL should be reachable
      if (!config.LLAMACPP_BASE_URL) {
        errors.push('LLAMACPP_BASE_URL is required when AI_PROVIDER=llamacpp')
      }
      break
    case 'mock':
      // Mock provider doesn't require any configuration
      break
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function getProviderConfig(provider: AIProviderType, forEmbeddings: boolean = false): Partial<AIConfig> {
  const config = getAIConfig()

  const providerConfigs: Record<AIProviderType, Partial<AIConfig>> = {
    openai: {
      OPENAI_API_KEY: config.OPENAI_API_KEY,
      OPENAI_BASE_URL: config.OPENAI_BASE_URL,
      OPENAI_MODEL: forEmbeddings ? config.OPENAI_EMBEDDING_MODEL : config.OPENAI_MODEL,
      OPENAI_TEMPERATURE: config.OPENAI_TEMPERATURE,
      OPENAI_MAX_TOKENS: config.OPENAI_MAX_TOKENS,
      OPENAI_EMBEDDING_MODEL: config.OPENAI_EMBEDDING_MODEL,
    },
    anthropic: {
      ANTHROPIC_API_KEY: config.ANTHROPIC_API_KEY,
      ANTHROPIC_MODEL: config.ANTHROPIC_MODEL,
      ANTHROPIC_TEMPERATURE: config.ANTHROPIC_TEMPERATURE,
      ANTHROPIC_MAX_TOKENS: config.ANTHROPIC_MAX_TOKENS,
    },
    gemini: {
      GEMINI_API_KEY: config.GEMINI_API_KEY,
      GEMINI_MODEL: forEmbeddings ? config.GEMINI_EMBEDDING_MODEL : config.GEMINI_MODEL,
      GEMINI_TEMPERATURE: config.GEMINI_TEMPERATURE,
      GEMINI_MAX_OUTPUT_TOKENS: config.GEMINI_MAX_OUTPUT_TOKENS,
      GEMINI_EMBEDDING_MODEL: config.GEMINI_EMBEDDING_MODEL,
    },
    llamacpp: {
      LLAMACPP_BASE_URL: config.LLAMACPP_BASE_URL,
      LLAMACPP_MODEL: forEmbeddings ? (config.LLAMACPP_EMBEDDING_MODEL || config.LLAMACPP_MODEL) : config.LLAMACPP_MODEL,
      LLAMACPP_TEMPERATURE: config.LLAMACPP_TEMPERATURE,
      LLAMACPP_MAX_TOKENS: config.LLAMACPP_MAX_TOKENS,
      LLAMACPP_EMBEDDING_MODEL: config.LLAMACPP_EMBEDDING_MODEL,
    },
    mock: {},
  }

  return {
    ...providerConfigs[provider],
    AI_REQUEST_TIMEOUT: config.AI_REQUEST_TIMEOUT,
    AI_MAX_RETRIES: config.AI_MAX_RETRIES,
    AI_ENABLE_LOGGING: config.AI_ENABLE_LOGGING,
  }
}