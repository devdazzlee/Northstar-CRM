import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { ConfigService } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino'
import { randomUUID } from 'crypto'
import type { AppConfig } from './config/configuration'
import { AppConfigModule } from './config/config.module'
import { GlobalExceptionFilter } from './common/filters/global-exception.filter'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { PermissionsGuard } from './common/guards/permissions.guard'
import { PlatformAdminGuard } from './common/guards/platform-admin.guard'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { PrismaModule } from './database/prisma.module'
import { JobsModule } from './jobs/jobs.module'
import { AuthModule } from './modules/auth/auth.module'
import { BillingModule } from './modules/billing/billing.module'
import { CatalogModule } from './modules/catalog/catalog.module'
import { CompaniesModule } from './modules/companies/companies.module'
import { ContactsModule } from './modules/contacts/contacts.module'
import { DealsModule } from './modules/deals/deals.module'
import { DocumentsModule } from './modules/documents/documents.module'
import { DuplicatesModule } from './modules/duplicates/duplicates.module'
import { EnginesModule } from './modules/engines/engines.module'
import { ExtrasModule } from './modules/extras/extras.module'
import { HealthModule } from './modules/health/health.module'
import { ImportsModule } from './modules/imports/imports.module'
import { PlatformModule } from './modules/platform/platform.module'
import { RecycleBinModule } from './modules/recycle-bin/recycle-bin.module'
import { ReportsModule } from './modules/reports/reports.module'
import { SettingsModule } from './modules/settings/settings.module'
import { UsersModule } from './modules/users/users.module'

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const isDev = config.get('nodeEnv', { infer: true }) !== 'production'
        return {
          pinoHttp: {
            level: config.get('logLevel', { infer: true }),
            genReqId: (req, res) => {
              const existing = req.headers['x-request-id']
              const id = typeof existing === 'string' && existing ? existing : randomUUID()
              res.setHeader('x-request-id', id)
              return id
            },
            transport: isDev
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
            redact: ['req.headers.authorization', 'req.headers.cookie'],
          },
        }
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => [
        {
          ttl: config.get('throttle.ttlMs', { infer: true }),
          limit: config.get('throttle.limit', { infer: true }),
        },
      ],
    }),
    PrismaModule,
    JobsModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ContactsModule,
    CompaniesModule,
    DealsModule,
    CatalogModule,
    ReportsModule,
    RecycleBinModule,
    SettingsModule,
    EnginesModule,
    ImportsModule,
    DuplicatesModule,
    DocumentsModule,
    PlatformModule,
    BillingModule,
    ExtrasModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: PlatformAdminGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
