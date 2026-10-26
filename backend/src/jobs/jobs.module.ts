import { Global, Module } from '@nestjs/common'
import { JobProcessors } from './job.processors'
import { JobsService } from './jobs.service'

@Global()
@Module({
  providers: [JobsService, JobProcessors],
  exports: [JobsService],
})
export class JobsModule {}
