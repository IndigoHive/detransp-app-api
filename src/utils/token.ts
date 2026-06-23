import { Unauthorized } from 'http-errors'

export function sanitizeResponseData(data: unknown): unknown {
  if (typeof data === 'string' && /<(!DOCTYPE|html)/i.test(data)) {
    return '[HTML response — likely maintenance or gateway page]'
  }
  return data
}

export function extractBearerToken(authHeader: string | undefined): string {
  if (!authHeader) throw Unauthorized('Token de autorização inválido ou expirado.')
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) throw Unauthorized('Token de autorização inválido ou expirado.')
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

export function extractNameFromToken(token: string): string {
  try {
    const payload = token.split('.')[1] ?? ''
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>
    return typeof decoded.name === 'string' ? decoded.name : ''
  } catch {
    return ''
  }
}

export function extractEmailFromToken(token: string): string {
  try {
    const payload = token.split('.')[1] ?? ''
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>
    return typeof decoded.email === 'string' ? decoded.email : ''
  } catch {
    return ''
  }
}
