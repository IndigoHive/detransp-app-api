const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const HEX_32 = /^[0-9a-f]{32}$/i
const CONTAINS_DIGIT = /\d/
const MIN_ID_LENGTH = 4

/**
 *  Normalize an HTTP method and URL into a logical endpoint route, replacing segments that look like IDs with `:id`.
 *  Used for Sentry grouping, so a distinct ServiceNow sys_id/CPF/renavam per request doesn't explode issue counts.
 * @param method: The HTTP method (GET, POST, etc.)
 * @param url: The request URL, which may be relative or absolute.
 * @param baseURL: The base URL to resolve relative URLs against, if provided.
 * @returns: A string in the format "METHOD /normalized/path", where segments that look like IDs are replaced with `:id`.
 */
export function normalizeRoute (method: string, url?: string, baseURL?: string): string {
  const normalized = resolvePath(url, baseURL)
    .split('/')
    .map((segment) => (isIdSegment(segment) ? ':id' : segment))
    .join('/')

  return `${method.toUpperCase()} ${normalized || '/'}`
}

// ponytail: length+digit heuristic also collapses a literal segment like "tipo2" or "v2beta" —
// acceptable since this only affects Sentry issue grouping, not routing. Tighten to a stricter
// numeric-run check (e.g. 2+ consecutive digits) if a real route ever collides.
function isIdSegment (segment: string): boolean {
  if (UUID.test(segment) || HEX_32.test(segment)) {
    return true
  }

  return segment.length >= MIN_ID_LENGTH && CONTAINS_DIGIT.test(segment)
}

function pathnameOf (value: string): string {
  try {
    return new URL(value).pathname
  } catch {
    return value
  }
}

function resolvePath (url = '', baseURL = ''): string {
  const [rawUrl = ''] = url.split('?')

  if (/^https?:\/\//i.test(rawUrl)) {
    return pathnameOf(rawUrl)
  }

  const basePath = baseURL ? pathnameOf(baseURL).replace(/\/+$/, '') : ''
  const relative = rawUrl.replace(/^\/+/, '')

  return relative ? `${basePath}/${relative}` : basePath || '/'
}
