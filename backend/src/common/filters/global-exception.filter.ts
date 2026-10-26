import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { AppError } from '../errors/app.error'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request & { id?: string; user?: { userId?: string } }>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let code = 'INTERNAL'
    let message = 'Internal server error'
    let details: unknown

    if (exception instanceof AppError) {
      status = exception.statusCode
      code = exception.code
      message = exception.message
      details = exception.details
    } else if (exception instanceof HttpException) {
      status = exception.getStatus()
      const body = exception.getResponse()
      if (typeof body === 'string') {
        message = body
      } else if (typeof body === 'object' && body !== null) {
        const payload = body as Record<string, unknown>
        message =
          typeof payload.message === 'string'
            ? payload.message
            : Array.isArray(payload.message)
              ? payload.message.join(', ')
              : exception.message
        details = payload.message
        code = status === 422 || status === 400 ? 'VALIDATION' : 'BAD_REQUEST'
      }
    }

    const isProd = process.env.NODE_ENV === 'production'
    const logPayload = {
      requestId: request.id,
      userId: request.user?.userId,
      path: request.url,
      method: request.method,
      code,
    }

    if (status >= 500) {
      this.logger.error(
        { ...logPayload, err: exception instanceof Error ? exception.stack : exception },
        message,
      )
    } else {
      this.logger.warn(logPayload, message)
    }

    response.status(status).json({
      success: false,
      data: null,
      message,
      error: {
        code,
        details: isProd && status >= 500 ? undefined : details,
      },
      meta: null,
    })
  }
}
