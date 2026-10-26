import { Module } from '@nestjs/common'
import { MemoryCacheService } from '../../common/cache/memory-cache.service'
import { ExtrasController } from './extras.controller'
import { ExtrasService } from './extras.service'

@Module({
  controllers: [ExtrasController],
  providers: [ExtrasService, MemoryCacheService],
})
export class ExtrasModule {}
