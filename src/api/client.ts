import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiEnvelope } from './types'

const ACCESS_TOKEN_KEY = 'nutrilens.accessToken'
const REFRESH_TOKEN_KEY = 'nutrilens.refreshToken'

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  get refresh() {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  },
  setAccess(access: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

export class ApiError extends Error {
  status: number
  errors: Record<string, unknown> | null

  constructor(message: string, status: number, errors: Record<string, unknown> | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken() {
  if (!tokenStore.refresh) return null
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ access: string }>(
        `${api.defaults.baseURL}/accounts/token/refresh/`,
        { refresh: tokenStore.refresh },
        { headers: { 'Content-Type': 'application/json' } },
      )
      .then((response) => {
        tokenStore.setAccess(response.data.access)
        return response.data.access
      })
      .catch(() => {
        tokenStore.clear()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

api.interceptors.request.use((config) => {
  const token = tokenStore.access
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      const access = await refreshAccessToken()
      if (access) {
        original.headers.Authorization = `Bearer ${access}`
        return api(original)
      }
    }
    const envelope = error.response?.data
    throw new ApiError(
      envelope?.message || error.message || 'Request failed.',
      error.response?.status || 0,
      envelope?.errors || null,
    )
  },
)

export async function request<T>(config: InternalAxiosRequestConfig | Parameters<typeof api.request>[0]) {
  const response = await api.request<ApiEnvelope<T>>(config)
  const envelope = response.data
  if (envelope.errors) {
    throw new ApiError(envelope.message, envelope.status_code, envelope.errors)
  }
  return envelope.data
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Unexpected error.'
}
