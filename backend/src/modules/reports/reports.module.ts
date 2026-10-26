import { Module } from '@nestjs/common'
import { MemoryCacheService } from '../../common/cache/memory-cache.service'
import { ReportsController } from './reports.controller'
import { ReportsService } from './reports.service'

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, MemoryCacheService],
})
export class ReportsModule {}
