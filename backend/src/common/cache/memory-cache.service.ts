import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { AppConfig } from '../../config/configuration'

type Entry = { value: unknown; expiresAt: number }

@Injectable()
export class MemoryCacheService {
  private readonly store = new Map<string, Entry>()

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value as T
  }

  set(key: string, value: unknown, ttlSeconds?: number) {
    const ttl = (ttlSeconds ?? this.config.get('cacheTtlSeconds', { infer: true })) * 1000
    this.store.set(key, { value, expiresAt: Date.now() + ttl })
  }

  del(key: string) {
    this.store.delete(key)
  }
}
