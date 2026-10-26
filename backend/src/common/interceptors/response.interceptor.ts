import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable, map } from 'rxjs'

export type ApiSuccessResponse<T> = {
  success: true
  data: T
  message: string
  meta: Record<string, unknown> | null
}

export type PaginatedResult<T> = {
  items: T
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<unknown>> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<unknown>> {
    return next.handle().pipe(
      map((payload) => {
        if (
          payload &&
          typeof payload === 'object' &&
          'items' in payload &&
          'meta' in payload
        ) {
          const page = payload as PaginatedResult<unknown>
          return {
            success: true as const,
            data: page.items,
            message: '',
            meta: page.meta,
          }
        }

        if (
          payload &&
          typeof payload === 'object' &&
          'data' in payload &&
          'message' in payload
        ) {
          const shaped = payload as {
            data: unknown
            message?: string
            meta?: Record<string, unknown> | null
          }
          return {
            success: true as const,
            data: shaped.data,
            message: shaped.message ?? '',
            meta: shaped.meta ?? null,
          }
        }

        return {
          success: true as const,
          data: payload,
          message: '',
          meta: null,
        }
      }),
    )
  }
}
