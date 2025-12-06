import { Queue, Worker, QueueEvents } from 'bullmq'
import { Redis } from 'ioredis'
import { config } from './config'
import { logger } from './logging'
import { processSummarizationJob, SummarizationJobData } from './workers/summarizationWorker'
import { processEmbeddingJob, EmbeddingJobData } from './workers/embeddingWorker'
import { processTaggingJob, TaggingJobData } from './workers/taggingWorker'
import { processExtractionJob, ExtractionJobData } from './workers/extractionWorker'

export interface Queues {
  summarization: Queue<SummarizationJobData>
  embedding: Queue<EmbeddingJobData>
  tagging: Queue<TaggingJobData>
  extraction: Queue<ExtractionJobData>
}

export interface Workers {
  summarization: Worker<SummarizationJobData>
  embedding: Worker<EmbeddingJobData>
  tagging: Worker<TaggingJobData>
  extraction: Worker<ExtractionJobData>
}

export interface QueueEventsInstances {
  summarization: QueueEvents
  embedding: QueueEvents
  tagging: QueueEvents
  extraction: QueueEvents
}

let queues: Queues | null = null
let workers: Workers | null = null
let queueEvents: QueueEventsInstances | null = null

export async function initializeQueues(redis: Redis): Promise<Queues> {
  if (queues) {
    return queues
  }

  try {
    // Create queues
    queues = {
      summarization: new Queue('summarization', {
        connection: redis,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 1000, // Keep last 1000 failed jobs
        },
      }),
      embedding: new Queue('embedding', {
        connection: redis,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 1000,
        },
      }),
      tagging: new Queue('tagging', {
        connection: redis,
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 500,
          },
          removeOnComplete: 100,
          removeOnFail: 1000,
        },
      }),
      extraction: new Queue('extraction', {
        connection: redis,
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 500,
          },
          removeOnComplete: 100,
          removeOnFail: 1000,
        },
      }),
    }

    // Create queue events for monitoring
    queueEvents = {
      summarization: new QueueEvents('summarization', { connection: redis }),
      embedding: new QueueEvents('embedding', { connection: redis }),
      tagging: new QueueEvents('tagging', { connection: redis }),
      extraction: new QueueEvents('extraction', { connection: redis }),
    }

    // Setup event listeners
    setupQueueEventListeners()

    logger.info('Queues initialized')
    return queues
  } catch (error) {
    logger.error(error, 'Failed to initialize queues')
    throw error
  }
}

export async function initializeWorkers(redis: Redis): Promise<Workers> {
  if (workers) {
    return workers
  }

  try {
    workers = {
      summarization: new Worker(
        'summarization',
        processSummarizationJob,
        {
          connection: redis,
          concurrency: config.PROCESSING_WORKERS,
        }
      ),
      embedding: new Worker(
        'embedding',
        processEmbeddingJob,
        {
          connection: redis,
          concurrency: config.PROCESSING_WORKERS,
        }
      ),
      tagging: new Worker(
        'tagging',
        processTaggingJob,
        {
          connection: redis,
          concurrency: config.PROCESSING_WORKERS * 2, // Tagging is lighter
        }
      ),
      extraction: new Worker(
        'extraction',
        processExtractionJob,
        {
          connection: redis,
          concurrency: config.PROCESSING_WORKERS,
        }
      ),
    }

    // Setup worker event listeners
    setupWorkerEventListeners()

    logger.info('Workers initialized')
    return workers
  } catch (error) {
    logger.error(error, 'Failed to initialize workers')
    throw error
  }
}

function setupQueueEventListeners() {
  if (!queueEvents) return

  Object.entries(queueEvents).forEach(([queueName, events]) => {
    events.on('added', ({ jobId }: { jobId: string }) => {
      logger.debug(`Job ${jobId} added to ${queueName} queue`)
    })

    events.on('completed', ({ jobId, returnvalue: _returnvalue }: { jobId: string; returnvalue: any }) => {
      logger.info(`Job ${jobId} completed in ${queueName} queue`)
    })

    events.on('failed', ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
      logger.warn(`Job ${jobId} failed in ${queueName} queue: ${failedReason}`)
    })

    events.on('stalled', ({ jobId }: { jobId: string }) => {
      logger.warn(`Job ${jobId} stalled in ${queueName} queue`)
    })
  })
}

function setupWorkerEventListeners() {
  if (!workers) return

  Object.entries(workers).forEach(([workerName, worker]) => {
    worker.on('completed', (job: any) => {
      logger.info(`Worker ${workerName} completed job ${job.id}`)
    })

    worker.on('failed', (job: any, error: any) => {
      logger.error(error, `Worker ${workerName} failed job ${job?.id}`)
    })

    worker.on('stalled', (jobId: any) => {
      logger.warn(`Worker ${workerName} stalled job ${jobId}`)
    })

    worker.on('error', (error: any) => {
      logger.error(error, `Worker ${workerName} error`)
    })
  })
}

export function getQueues(): Queues {
  if (!queues) {
    throw new Error('Queues not initialized. Call initializeQueues() first.')
  }
  return queues
}

export function getWorkers(): Workers {
  if (!workers) {
    throw new Error('Workers not initialized. Call initializeWorkers() first.')
  }
  return workers
}

export async function closeQueues(): Promise<void> {
  if (workers) {
    await Promise.all(Object.values(workers).map(worker => worker.close()))
    workers = null
  }

  if (queues) {
    await Promise.all(Object.values(queues).map(queue => queue.close()))
    queues = null
  }

  if (queueEvents) {
    await Promise.all(Object.values(queueEvents).map(events => events.close()))
    queueEvents = null
  }

  logger.info('Queues and workers closed')
}