export function sanitizeResponseData(data: unknown): unknown {
  if (typeof data === 'string' && /<(!DOCTYPE|html)/i.test(data)) {
    return '[HTML response — likely maintenance or gateway page]'
  }
  return data
}

export class UnauthorizedError extends Error {
  readonly status = 401
  constructor(message = 'Authorization token required') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export function extractBearerToken(authHeader: string | undefined): string {
  if (!authHeader) throw new UnauthorizedError()
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) throw new UnauthorizedError()
  return token
}

export function extractCpfFromToken(token: string): string {
  try {
    const payload = token.split('.')[1] ?? ''
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>
    return typeof decoded.preferred_username === 'string' ? decoded.preferred_username : ''
  } catch {
    return ''
  }
}
