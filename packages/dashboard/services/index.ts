// Export all services for KnowMan Dashboard
export { apiClient } from '@/lib/api-client'
export { itemsService } from './items.service'
export { searchService } from './search.service'
export { captureService } from './capture.service'
export { tagsService } from './tags.service'
export { processingService } from './processing.service'

// Re-export types
export type { CaptureRequest, FileUploadRequest } from './capture.service'
export type { Tag, TagStats } from './tags.service'
export type { ProcessingStats, ProcessingQueueStatus } from './processing.service'