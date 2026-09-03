import * as Sentry from '@sentry/node'
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { normalizeRoute } from './normalize-route'

type TimedRequestConfig = InternalAxiosRequestConfig & { metricsStartedAt?: number }

function record (config: TimedRequestConfig | undefined, service: string, status: number | undefined): void {
  if (!config?.metricsStartedAt) return

  const endpoint = normalizeRoute(config.method ?? 'get', config.url, config.baseURL)
  const attributes = status === undefined ? { endpoint, service } : { endpoint, service, status }

  Sentry.metrics.distribution('endpoint.duration', performance.now() - config.metricsStartedAt, {
    attributes,
    unit: 'millisecond'
  })

  if (status !== undefined) {
    Sentry.metrics.gauge('endpoint.status', status, { attributes: { endpoint, service }, unit: 'none' })
  }
}

// Independent interceptor pair — measures duration/status alongside each client's own
// logging/error-handling interceptor (see setupInterceptors in each client) without touching it.
// Call once per axios instance, right after that client's own interceptor setup.
export function installHttpMetrics (instance: AxiosInstance, service: string): void {
  instance.interceptors.request.use((config: TimedRequestConfig) => {
    config.metricsStartedAt = performance.now()
    return config
  })

  instance.interceptors.response.use(
    (response) => {
      record(response.config, service, response.status)
      return response
    },
    (error: AxiosError) => {
      record(error.config, service, error.response?.status)
      return Promise.reject(error)
    }
  )
}
