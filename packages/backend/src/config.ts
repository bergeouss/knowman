import { z } from 'zod'

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  HOST: z.string().default('localhost'),
  VERSION: z.string().default('0.1.0'),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173').transform(val => val.split(',')),

  // Database
  DATABASE_URL: z.string().default('sqlite:./data/knowman.db'),
  DATABASE_LOGGING: z.string().default('false').transform(val => val === 'true'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0').transform(Number),
  REDIS_FAMILY: z.string().optional().transform(val => val ? parseInt(val) : undefined),

  // Security
  JWT_SECRET: z.string().default('change-me-in-production'),
  API_KEY: z.string().optional(),

  // LLM Configuration (local or remote)
  LLM_PROVIDER: z.enum(['local', 'openai', 'anthropic', 'groq']).default('local'),
  LLM_MODEL: z.string().default('llama3.2:3b'),
  LLM_BASE_URL: z.string().optional(),
  LLM_API_KEY: z.string().optional(),
  LLM_TEMPERATURE: z.string().default('0.7').transform(Number),
  LLM_MAX_TOKENS: z.string().default('2048').transform(Number),

  // Processing
  MAX_CONTENT_LENGTH: z.string().default('100000').transform(Number),
  PROCESSING_WORKERS: z.string().default('2').transform(Number),
  PROCESSING_TIMEOUT: z.string().default('30000').transform(Number),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z.string().default('true').transform(val => val === 'true'),
})

export type Config = z.infer<typeof envSchema>

let cachedConfig: Config | null = null

export function loadConfig(): Config {
  if (cachedConfig) {
    return cachedConfig
  }

  // Load environment variables
  const env = process.env

  // Parse and validate
  const config = envSchema.parse(env)

  // Cache
  cachedConfig = config

  return config
}

export const config = loadConfig()