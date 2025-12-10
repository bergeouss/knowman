import express from 'express'
import { config } from '../config'
import { logger } from '../logging'
import { authService } from '../auth/service'

// Authentication middleware for KnowMan
// Supports: JWT tokens, API keys, and development bypass

export const authMiddleware: express.RequestHandler = async (req, res, next) => {
  // Skip authentication for OPTIONS (preflight) requests
  if (req.method === 'OPTIONS') {
    return next()
  }

  // Skip authentication for health check and docs
  if (req.path === '/health' || req.path === '/docs') {
    return next()
  }

  // Skip authentication for auth routes (they're mounted before this middleware)
  if (req.path.startsWith('/auth')) {
    return next()
  }

  // Get authentication from header
  const authHeader = req.headers.authorization
  const apiKey = req.query.apiKey || req.body.apiKey
  const bypassAuth = req.headers['x-bypass-auth']

  // Development mode: allow bypass with special header
  if (config.NODE_ENV === 'development' && bypassAuth === 'true') {
    logger.debug('Bypassing authentication in development mode')
    // Set default user ID for development
    ;(req as any).userId = 'local-user'
    return next()
  }

  // Check JWT token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const validation = await authService.validateToken(token)

    if (validation.isValid && validation.user) {
      // Attach user ID to request
      ;(req as any).userId = validation.user.id
      ;(req as any).user = validation.user

      logger.debug(`Authenticated request from user ${validation.user.email} to ${req.path}`)
      return next()
    }
  }

  // Check API key (simplified - in production use proper API key validation)
  if (config.API_KEY && apiKey === config.API_KEY) {
    // For API key authentication, we need a user ID
    const userId = req.headers['x-user-id'] || req.query.userId || req.body.userId
    if (!userId) {
      logger.warn('API key used without user ID')
      return res.status(401).json({ error: 'User ID required with API key' })
    }

    // Attach user ID to request
    ;(req as any).userId = userId
    logger.debug(`API key authenticated request from user ${userId} to ${req.path}`)
    return next()
  }

  // No valid authentication found
  logger.warn(`Unauthorized request attempt: ${req.path}`)

  return res.status(401).json({
    success: false,
    error: 'Authentication required',
    message: 'Please provide a valid JWT token or API key'
  })
}

// Optional: Role-based middleware for future use
export const requireAdmin: express.RequestHandler = (_req, _res, next) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  // For now, all users are admins in local-first mode
  // In future, implement proper role checking
  next()
}