// Authentication routes for KnowMan
import express from 'express'
import { authService } from '../../auth/service'
import { logger } from '../../logging'

const router: express.Router = express.Router()

// POST /api/auth/register - Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      })
    }

    const result = await authService.register({ email, password, name })

    return res.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          preferences: result.user.preferences,
          createdAt: result.user.createdAt,
          updatedAt: result.user.updatedAt,
        },
        tokens: result.tokens,
      },
      message: 'User registered successfully',
    })
  } catch (error) {
    logger.error(error, 'Registration failed')

    // Handle specific errors with appropriate status codes
    if (error instanceof Error) {
      if (error.message === 'User already exists') {
        return res.status(400).json({
          success: false,
          error: 'User already exists',
          message: 'A user with this email already exists'
        })
      }
    }

    return next(error)
  }
})

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      })
    }

    logger.debug(`Login attempt for email: ${email}`)
    const result = await authService.login({ email, password })

    return res.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          preferences: result.user.preferences,
          createdAt: result.user.createdAt,
          updatedAt: result.user.updatedAt,
        },
        tokens: result.tokens,
      },
      message: 'Login successful',
    })
  } catch (error) {
    logger.error(error, 'Login failed')
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    })
  }
})

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      })
    }

    const tokens = await authService.refreshTokens(refreshToken)

    return res.json({
      success: true,
      data: { tokens },
      message: 'Token refreshed successfully',
    })
  } catch (error) {
    logger.error(error, 'Token refresh failed')
    return res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
    })
  }
})

// POST /api/auth/logout - Logout user
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      })
    }

    await authService.logout(refreshToken)

    return res.json({
      success: true,
      message: 'Logout successful',
    })
  } catch (error) {
    logger.error(error, 'Logout failed')
    return next(error)
  }
})

// GET /api/auth/me - Get current user info
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      })
    }

    const token = authHeader.substring(7)
    const validation = await authService.validateToken(token)

    if (!validation.isValid || !validation.user) {
      return res.status(401).json({
        success: false,
        error: validation.error || 'Invalid token',
      })
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: validation.user.id,
          email: validation.user.email,
          name: validation.user.name,
          preferences: validation.user.preferences,
          createdAt: validation.user.createdAt,
          updatedAt: validation.user.updatedAt,
        },
      },
    })
  } catch (error) {
    logger.error(error, 'Get user info failed')
    return next(error)
  }
})

// POST /api/auth/validate - Validate token
router.post('/validate', async (req, res, next) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      })
    }

    const validation = await authService.validateToken(token)

    return res.json({
      success: true,
      data: {
        isValid: validation.isValid,
        user: validation.user ? {
          id: validation.user.id,
          email: validation.user.email,
          name: validation.user.name,
        } : undefined,
      },
      message: validation.isValid ? 'Token is valid' : 'Token is invalid',
    })
  } catch (error) {
    logger.error(error, 'Token validation failed')
    return next(error)
  }
})

export default router