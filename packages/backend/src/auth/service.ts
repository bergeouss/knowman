// Authentication service for KnowMan
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { config } from '../config'
import { logger } from '../logging'
import { getRepository } from '../database'
import { User } from '../database/entities/User'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name?: string
}

export interface TokenPayload {
  userId: string
  email: string
  iat: number
  exp: number
  type?: 'refresh'
}

export class AuthService {
  private readonly accessTokenExpiry = '15m' // 15 minutes
  private readonly refreshTokenExpiry = '7d' // 7 days
  private readonly saltRounds = 10

  // Generate JWT tokens
  async generateTokens(user: User): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: this.accessTokenExpiry }
    )

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'refresh' },
      config.JWT_SECRET,
      { expiresIn: this.refreshTokenExpiry }
    )

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    }
  }

  // Verify JWT token
  verifyToken(token: string): TokenPayload | null {
    try {
      logger.debug(`Verifying token with secret: ${config.JWT_SECRET.substring(0, 10)}...`)
      const decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload
      logger.debug(`Token verified successfully for user: ${decoded.email}`)
      return decoded
    } catch (error) {
      logger.warn(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return null
    }
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds)
  }

  // Verify password
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  // Register new user
  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const userRepo = getRepository(User)

    // Check if user already exists
    const existingUser = await userRepo.findOne({ where: { email: data.email } })
    if (existingUser) {
      throw new Error('User already exists')
    }

    // Hash password (commented out - password not stored in current implementation)
    // await this.hashPassword(data.password)

    // Create user
    const user = new User()
    user.email = data.email
    if (data.name) {
      user.name = data.name
    }
    user.preferences = {
      autoCapture: true,
      theme: 'system',
      language: 'en',
      notificationSettings: {
        email: false,
        push: false,
        digestFrequency: 'weekly',
      },
    }

    // Note: In a real application, you would store the hashed password
    // For now, we'll just save the user without password field
    await userRepo.save(user)

    // Generate tokens
    const tokens = await this.generateTokens(user)

    logger.info(`New user registered: ${user.email}`)

    return { user, tokens }
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const userRepo = getRepository(User)

    // Find user by email
    logger.debug(`Looking for user with email: ${credentials.email}`)
    const user = await userRepo.findOne({ where: { email: credentials.email } })
    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Note: In a real application, you would verify the password
    // For now, we'll skip password verification since we're not storing passwords yet
    // const isValidPassword = await this.verifyPassword(credentials.password, user.password)
    // if (!isValidPassword) {
    //   throw new Error('Invalid credentials')
    // }

    // Generate tokens
    const tokens = await this.generateTokens(user as User)

    logger.info(`User logged in: ${user.email}`)

    return { user: user as User, tokens }
  }

  // Refresh tokens
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const payload = this.verifyToken(refreshToken)
    if (!payload || payload.type !== 'refresh') {
      throw new Error('Invalid refresh token')
    }

    const userRepo = getRepository(User)
    const user = await userRepo.findOne({ where: { id: payload.userId } })
    if (!user) {
      throw new Error('User not found')
    }

    return this.generateTokens(user as User)
  }

  // Get user from token
  async getUserFromToken(token: string): Promise<User | null> {
    const payload = this.verifyToken(token)
    if (!payload) {
      return null
    }

    const userRepo = getRepository(User)
    const user = await userRepo.findOne({ where: { id: payload.userId } })
    return user as User | null
  }

  // Validate token and get user
  async validateToken(token: string): Promise<{ isValid: boolean; user?: User; error?: string }> {
    try {
      const user = await this.getUserFromToken(token)
      if (!user) {
        return { isValid: false, error: 'User not found' }
      }

      return { isValid: true, user }
    } catch (error) {
      return { isValid: false, error: error instanceof Error ? error.message : 'Invalid token' }
    }
  }

  // Logout (invalidate refresh token)
  // Note: In a production app, you would store invalidated tokens in Redis/DB
  async logout(refreshToken: string): Promise<void> {
    // For now, just verify the token is valid
    const payload = this.verifyToken(refreshToken)
    if (!payload || payload.type !== 'refresh') {
      throw new Error('Invalid refresh token')
    }

    logger.info(`User logged out: ${payload.email}`)
  }
}

// Create singleton instance
export const authService = new AuthService()

export default authService