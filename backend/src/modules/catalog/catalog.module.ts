import { Module } from '@nestjs/common'
import { createCatalogController } from './catalog.controller'
import { CATALOG_RESOURCES } from './catalog.registry'
import { CatalogRepository } from './catalog.repository'
import { CatalogService } from './catalog.service'

const catalogControllers = CATALOG_RESOURCES.map((resource) =>
  createCatalogController(resource),
)

@Module({
  controllers: catalogControllers,
  providers: [CatalogService, CatalogRepository],
  exports: [CatalogService, CatalogRepository],
})
export class CatalogModule {}
