import pino from 'pino'
import { config } from './config'

const transport = config.LOG_PRETTY
  ? pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    })
  : undefined

export const logger = pino(
  {
    level: config.LOG_LEVEL,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label.toUpperCase() }),
    },
    serializers: {
      error: pino.stdSerializers.err,
    },
    base: {
      service: 'knowman-backend',
      version: config.VERSION,
      env: config.NODE_ENV,
    },
  },
  transport
)

// Export child logger creator
export function createLogger(context: string) {
  return logger.child({ context })
}

// Export types
export type Logger = typeof logger