import { Module } from '@nestjs/common'
import { CatalogModule } from '../catalog/catalog.module'
import { RecycleBinController } from './recycle-bin.controller'
import { RecycleBinService } from './recycle-bin.service'

@Module({
  imports: [CatalogModule],
  controllers: [RecycleBinController],
  providers: [RecycleBinService],
})
export class RecycleBinModule {}
