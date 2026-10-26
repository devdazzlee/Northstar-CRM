import { Module } from '@nestjs/common'
import { DocumentsUploadController } from './documents.controller'
import { DocumentsService } from './documents.service'

@Module({
  controllers: [DocumentsUploadController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
