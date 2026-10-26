import { Global, Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'
import { buildConfiguration } from './configuration'
import { validateEnv } from './env.schema'

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [
        () => {
          const env = validateEnv(process.env as Record<string, unknown>)
          return buildConfiguration(env)
        },
      ],
    }),
  ],
})
export class AppConfigModule {}
