import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Job, Queue, Worker } from 'bullmq'
import type { AppConfig } from '../config/configuration'
import {
  JOB_QUEUES,
  type AutomationRunPayload,
  type EmailJobPayload,
  type EnrichmentJobPayload,
  type ImportJobPayload,
  type NotificationJobPayload,
  type SequenceTickPayload,
} from './job.types'
import { JobProcessors } from './job.processors'

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name)
  private readonly queues = new Map<string, Queue>()
  private readonly workers: Worker[] = []
  private redisEnabled = false

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly processors: JobProcessors,
  ) {}

  async onModuleInit() {
    const redisUrl = this.config.get('redisUrl', { infer: true })
    this.redisEnabled = Boolean(redisUrl)

    if (!this.redisEnabled) {
      this.logger.warn('REDIS_URL not set — jobs run inline (no BullMQ workers)')
      return
    }

    const connection = { url: redisUrl }
    for (const name of Object.values(JOB_QUEUES)) {
      this.queues.set(name, new Queue(name, { connection }))
      const worker = new Worker(
        name,
        async (job: Job) => this.dispatch(name, job.data),
        { connection },
      )
      worker.on('failed', (job, err) => {
        this.logger.error(`Job ${name}/${job?.id} failed: ${err.message}`)
      })
      this.workers.push(worker)
    }
    this.logger.log('BullMQ workers started')
  }

  async onModuleDestroy() {
    await Promise.all(this.workers.map((w) => w.close()))
    await Promise.all([...this.queues.values()].map((q) => q.close()))
  }

  async enqueueEmail(payload: EmailJobPayload) {
    return this.enqueue(JOB_QUEUES.email, payload)
  }

  async enqueueSequenceTick(payload: SequenceTickPayload) {
    return this.enqueue(JOB_QUEUES.sequences, payload)
  }

  async enqueueImport(payload: ImportJobPayload) {
    return this.enqueue(JOB_QUEUES.imports, payload)
  }

  async enqueueNotification(payload: NotificationJobPayload) {
    return this.enqueue(JOB_QUEUES.notifications, payload)
  }

  async enqueueEnrichment(payload: EnrichmentJobPayload) {
    return this.enqueue(JOB_QUEUES.enrichment, payload)
  }

  async enqueueAutomation(payload: AutomationRunPayload) {
    return this.enqueue(JOB_QUEUES.automation, payload)
  }

  private async enqueue(queue: string, payload: unknown) {
    if (!this.redisEnabled) {
      await this.dispatch(queue, payload)
      return { mode: 'inline' as const }
    }
    const q = this.queues.get(queue)
    if (!q) throw new Error(`Unknown queue ${queue}`)
    const job = await q.add(queue, payload, {
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    })
    return { mode: 'queued' as const, jobId: job.id }
  }

  private async dispatch(queue: string, payload: unknown) {
    switch (queue) {
      case JOB_QUEUES.email:
        return this.processors.processEmail(payload as EmailJobPayload)
      case JOB_QUEUES.sequences:
        return this.processors.processSequenceTick(payload as SequenceTickPayload)
      case JOB_QUEUES.imports:
        return this.processors.processImport(payload as ImportJobPayload)
      case JOB_QUEUES.notifications:
        return this.processors.processNotification(payload as NotificationJobPayload)
      case JOB_QUEUES.enrichment:
        return this.processors.processEnrichment(payload as EnrichmentJobPayload)
      case JOB_QUEUES.automation:
        return this.processors.processAutomation(payload as AutomationRunPayload)
      default:
        this.logger.warn(`No processor for queue ${queue}`)
    }
  }

  status() {
    return {
      mode: this.redisEnabled ? 'bullmq' : 'inline',
      queues: Object.values(JOB_QUEUES),
    }
  }
}
