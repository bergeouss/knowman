import express from 'express'
import { config } from '../config'
import { logger } from '../logging'

// Simple authentication middleware for local-first application
// In production, this should be replaced with proper authentication

export const authMiddleware: express.RequestHandler = (req, res, next) => {
  // Skip authentication for health check and docs
  if (req.path === '/health' || req.path === '/api/docs') {
    return next()
  }

  // Get authentication from header, query param, or body
  const authHeader = req.headers.authorization
  const apiKey = req.query.apiKey || req.body.apiKey
  const userId = req.headers['x-user-id'] || req.query.userId || req.body.userId

  // Development mode: allow bypass with special header
  if (config.NODE_ENV === 'development' && req.headers['x-bypass-auth'] === 'true') {
    logger.debug('Bypassing authentication in development mode')
    // Set default user ID for development
    ;(req as any).userId = userId || 'local-user'
    return next()
  }

  // Check API key (simplified - in production use proper API key validation)
  if (config.API_KEY && apiKey !== config.API_KEY && authHeader !== `Bearer ${config.API_KEY}`) {
    logger.warn('Invalid API key attempt')
    return res.status(401).json({ error: 'Invalid API key' })
  }

  // Require user ID for all requests
  if (!userId) {
    logger.warn('Missing user ID')
    return res.status(401).json({ error: 'User ID required' })
  }

  // Attach user ID to request
  ;(req as any).userId = userId

  // Log request for debugging
  logger.debug(`Authenticated request from user ${userId} to ${req.path}`)

  next()
}

// Optional: Role-based middleware for future use
export const requireAdmin: express.RequestHandler = (_req, _res, next) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  // For now, all users are admins in local-first mode
  // In future, implement proper role checking
  next()
}