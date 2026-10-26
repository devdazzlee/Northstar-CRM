import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { NestExpressApplication } from '@nestjs/platform-express'
import helmet from 'helmet'
import { Logger } from 'nestjs-pino'
import { join } from 'path'
import * as Sentry from '@sentry/node'
import type { AppConfig } from './config/configuration'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  })
  const logger = app.get(Logger)
  app.useLogger(logger)

  const config = app.get(ConfigService<AppConfig, true>)
  const apiPrefix = config.get('apiPrefix', { infer: true })
  const port = config.get('port', { infer: true })
  const corsOrigins = config.get('corsOrigins', { infer: true })
  const sentryDsn = config.get('sentryDsn', { infer: true })
  const uploadDir = config.get('uploadDir', { infer: true })

  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: config.get('nodeEnv', { infer: true }),
      tracesSampleRate: 0.1,
    })
  }

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  })
  app.useStaticAssets(join(process.cwd(), uploadDir), { prefix: '/uploads' })
  app.setGlobalPrefix(apiPrefix)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Northstar CRM API')
    .setDescription(
      'Multi-tenant SaaS CRM REST API. Auth via Bearer JWT. Tenant comes from the token, never from the client body.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  })

  await app.listen(port)
  logger.log(`API listening on http://localhost:${port}/${apiPrefix}`)
  logger.log(`Swagger docs at http://localhost:${port}/docs`)
}

void bootstrap()
