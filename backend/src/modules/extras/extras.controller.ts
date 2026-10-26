import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  ValidationPipe,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'
import type { AuthUser } from '../../common/types/auth-user'
import { ExtrasService } from './extras.service'

const raw = new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: true })

@ApiTags('extras')
@ApiBearerAuth()
@Controller()
export class ExtrasController {
  constructor(private readonly extrasService: ExtrasService) {}

  @Get('leaderboards')
  @RequirePermissions('team:read')
  @ApiOperation({ summary: 'Sales leaderboards from won deals' })
  leaderboards(@CurrentUser() user: AuthUser) {
    return this.extrasService.leaderboards(user)
  }

  @Get('live-chat/threads')
  @RequirePermissions('support:read')
  listChat(@CurrentUser() user: AuthUser) {
    return this.extrasService.listChatThreads(user)
  }

  @Post('live-chat/threads')
  @RequirePermissions('support:write')
  createChat(
    @CurrentUser() user: AuthUser,
    @Body(raw)
    body: { subject?: string; visitorName?: string; visitorEmail?: string; message: string },
  ) {
    return this.extrasService.createChatThread(user, body)
  }

  @Post('live-chat/threads/:id/reply')
  @RequirePermissions('support:write')
  replyChat(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(raw) body: { body: string },
  ) {
    return this.extrasService.replyChat(user, id, body.body)
  }

  @Post('enrichment')
  @RequirePermissions('ops:write')
  enrich(
    @CurrentUser() user: AuthUser,
    @Body(raw) body: { targetType: string; targetId: string },
  ) {
    return this.extrasService.enrich(user, body.targetType, body.targetId)
  }

  @Get('social/posts')
  @RequirePermissions('engage:read')
  listSocial(@CurrentUser() user: AuthUser) {
    return this.extrasService.listSocial(user)
  }

  @Post('social/posts')
  @RequirePermissions('engage:write')
  createSocial(
    @CurrentUser() user: AuthUser,
    @Body(raw) body: { platform: string; content: string; scheduledAt?: string },
  ) {
    return this.extrasService.createSocialPost(user, body)
  }

  @Get('messaging/threads')
  @RequirePermissions('engage:read')
  listMessaging(@CurrentUser() user: AuthUser) {
    return this.extrasService.listMessaging(user)
  }

  @Post('messaging/threads')
  @RequirePermissions('engage:write')
  createMessaging(
    @CurrentUser() user: AuthUser,
    @Body(raw) body: { channel: string; participant: string; lastMessage?: string },
  ) {
    return this.extrasService.createMessagingThread(user, body)
  }

  @Post('sandbox/run')
  @RequirePermissions('settings:write')
  sandbox(
    @CurrentUser() user: AuthUser,
    @Body(raw) body: { name: string; payload?: unknown },
  ) {
    return this.extrasService.runSandbox(user, body.name, body.payload)
  }

  @Get('marketplace')
  @RequirePermissions('settings:read')
  marketplace() {
    return this.extrasService.marketplace()
  }

  @Get('developer')
  @RequirePermissions('settings:read')
  developer(@CurrentUser() user: AuthUser) {
    return this.extrasService.developerInfo(user)
  }

  @Get('language-settings')
  @RequirePermissions('settings:read')
  language(@CurrentUser() user: AuthUser) {
    return this.extrasService.languageSettings(user)
  }

  @Get('customer-360/:contactId')
  @RequirePermissions('contacts:read')
  customer360(
    @CurrentUser() user: AuthUser,
    @Param('contactId', ParseUUIDPipe) contactId: string,
  ) {
    return this.extrasService.customer360(user, contactId)
  }

  @Get('support-settings')
  @RequirePermissions('support:read')
  getSupportSettings(@CurrentUser() user: AuthUser) {
    return this.extrasService.getSupportSettings(user)
  }

  @Patch('support-settings')
  @RequirePermissions('support:write')
  updateSupportSettings(
    @CurrentUser() user: AuthUser,
    @Body(raw) body: Record<string, unknown>,
  ) {
    return this.extrasService.updateSupportSettings(user, body)
  }

  @Get('customer-portal')
  @RequirePermissions('support:read')
  getCustomerPortal(@CurrentUser() user: AuthUser) {
    return this.extrasService.getCustomerPortal(user)
  }

  @Patch('customer-portal')
  @RequirePermissions('support:write')
  updateCustomerPortal(
    @CurrentUser() user: AuthUser,
    @Body(raw) body: Record<string, unknown>,
  ) {
    return this.extrasService.updateCustomerPortal(user, body)
  }

  @Get('quotes-invoices')
  @RequirePermissions('commerce:read')
  @ApiOperation({ summary: 'Combined quotes + invoices for Quotes & invoices view' })
  quotesInvoices(@CurrentUser() user: AuthUser) {
    return this.extrasService.quotesAndInvoices(user)
  }
}
