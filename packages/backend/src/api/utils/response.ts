/**
 * Standardized API response helpers for KnowMan backend
 * Ensures all API responses follow consistent format:
 * { success: boolean, data?: T, error?: string, timestamp: string }
 */

export const createSuccessResponse = <T>(data: T) => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
})

export const createErrorResponse = (error: string) => ({
  success: false,
  error,
  timestamp: new Date().toISOString(),
})

export const sendSuccessResponse = <T>(res: any, data: T, statusCode: number = 200) => {
  return res.status(statusCode).json(createSuccessResponse(data))
}

export const sendErrorResponse = (res: any, error: string, statusCode: number = 500) => {
  return res.status(statusCode).json(createErrorResponse(error))
}