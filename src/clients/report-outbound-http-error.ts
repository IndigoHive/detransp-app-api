import * as Sentry from '@sentry/node'
import type { AxiosError } from 'axios'
import { normalizeRoute } from './normalize-route'

// 4xx = the downstream API understood the request and rejected it for a business reason (CPF
// not found, invalid state, etc) — expected friction. 5xx, or no response at all (timeout, DNS,
// connection reset), means the downstream API itself is unstable — a real infra problem.
function classify (status: number | undefined): 'business' | 'instability' {
  return status !== undefined && status >= 400 && status < 500 ? 'business' : 'instability'
}

// Reports the real outbound failure (real stack, real endpoint/status) to Sentry — called from
// each client's existing response-error interceptor, right where it already logs via pino.
export function reportOutboundHttpError (error: AxiosError, service: string): void {
  const status = error.response?.status
  const category = classify(status)
  // e.g. "PATCH /api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veiculos/:id" — the sys_id is
  // templated out so every distinct TDV that fails the same way groups into one issue instead
  // of exploding into one issue per ID.
  const endpoint = normalizeRoute(error.config?.method ?? 'get', error.config?.url, error.config?.baseURL)

  // error.name defaulting to axios's generic 'AxiosError' made every client's failures look
  // identical in Sentry's issue list. The category goes in the name (visible in the title,
  // same idea as BusinessSnackbarError), and service + endpoint go in the message, so which
  // API — and which specific operation on it — failed is readable without opening tags. No
  // "Outbound" prefix on the name: the "[service]:" in the message already makes the origin
  // unambiguous.
  const sentryError = new Error(`[${service}]: ${endpoint} — ${error.message}`)
  if (error.stack) sentryError.stack = error.stack

  Sentry.captureException(sentryError, {
    tags: {
      source: 'outbound-http',
      service,
      category,
      status,
      endpoint
    },
    // service+endpoint+category+status: a 404 and a 422 on the same endpoint stay separate
    // issues, and updating a TDV stays separate from listing or creating one, even though all
    // three share the same "service" tag.
    fingerprint: [service, endpoint, category, String(status ?? 'no-response')],
    extra: {
      method: error.config?.method,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    }
  })
}
