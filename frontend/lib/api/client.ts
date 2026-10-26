import { useAuthStore } from '@/stores/auth-store'

export type ApiEnvelope<T> = {
  success: boolean
  data: T
  message: string
  meta?: Record<string, unknown> | null
  error?: { code?: string; details?: unknown }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000/api/v1'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  /** Skip Authorization header (login/register/refresh). */
  skipAuth?: boolean
  /** Internal: avoid infinite refresh loops. */
  _retry?: boolean
}

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  const { refreshToken, setTokens, clearSession } = useAuthStore.getState()
  if (!refreshToken) {
    clearSession()
    return false
  }

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    const json = (await res.json()) as ApiEnvelope<{
      accessToken: string
      refreshToken: string
      expiresIn: string
    }>
    if (!res.ok || !json.success || !json.data?.accessToken) {
      clearSession()
      return false
    }
    setTokens({
      accessToken: json.data.accessToken,
      refreshToken: json.data.refreshToken,
    })
    return true
  } catch {
    clearSession()
    return false
  }
}

/** Central fetch with auth + 401 refresh interceptor. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const { body, skipAuth, _retry, headers: initHeaders, ...rest } = options
  const headers = new Headers(initHeaders)
  headers.set('Accept', 'application/json')
  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (!skipAuth) {
    const token = useAuthStore.getState().accessToken
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, {
    ...rest,
    headers,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  })

  if (res.status === 401 && !skipAuth && !_retry) {
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null
    })
    const ok = await refreshPromise
    if (ok) {
      return apiRequest<T>(path, { ...options, _retry: true })
    }
    throw new ApiError('Session expired. Please sign in again.', 401, 'UNAUTHORIZED')
  }

  let json: ApiEnvelope<T>
  try {
    json = (await res.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiError(res.statusText || 'Invalid response', res.status)
  }

  if (!res.ok || json.success === false) {
    throw new ApiError(
      json.message || res.statusText || 'Request failed',
      res.status,
      json.error?.code,
      json.error?.details,
    )
  }

  return json
}

export const api = {
  get: <T>(path: string, init?: RequestOptions) => apiRequest<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, body?: unknown, init?: RequestOptions) =>
    apiRequest<T>(path, { ...init, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, init?: RequestOptions) =>
    apiRequest<T>(path, { ...init, method: 'PATCH', body }),
  delete: <T>(path: string, init?: RequestOptions) =>
    apiRequest<T>(path, { ...init, method: 'DELETE' }),
}

export function getApiBaseUrl() {
  return API_BASE
}
