import type { Env } from './env.schema'

export type AppConfig = {
  nodeEnv: Env['NODE_ENV']
  port: number
  apiPrefix: string
  databaseUrl: string
  jwt: {
    accessSecret: string
    refreshSecret: string
    accessExpiresIn: string
    refreshExpiresIn: string
  }
  corsOrigins: string[]
  throttle: {
    ttlMs: number
    limit: number
  }
  logLevel: string
  redisUrl: string
  uploadDir: string
  publicUploadBaseUrl: string
  sentryDsn: string
  cacheTtlSeconds: number
}

export function buildConfiguration(env: Env): AppConfig {
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    apiPrefix: env.API_PREFIX,
    databaseUrl: env.DATABASE_URL,
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    corsOrigins: env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
    throttle: {
      ttlMs: env.THROTTLE_TTL_MS,
      limit: env.THROTTLE_LIMIT,
    },
    logLevel: env.LOG_LEVEL,
    redisUrl: env.REDIS_URL ?? '',
    uploadDir: env.UPLOAD_DIR,
    publicUploadBaseUrl: env.PUBLIC_UPLOAD_BASE_URL,
    sentryDsn: env.SENTRY_DSN ?? '',
    cacheTtlSeconds: env.CACHE_TTL_SECONDS,
  }
}
