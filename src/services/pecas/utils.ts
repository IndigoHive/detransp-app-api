import { BadRequest } from 'http-errors'

// ponytail: formato real da URL do QR Code ainda não confirmado — assume que o
// código é o último segmento do path. Ajustar aqui se vier como query param.
export function extractNumeroFromQrUrl(scannedUrl: string): string {
  let parsed: URL
  try {
    parsed = new URL(scannedUrl)
  } catch {
    throw BadRequest('QR Code inválido.')
  }

  const numero = parsed.pathname.split('/').filter(Boolean).pop()
  if (!numero) throw BadRequest('QR Code inválido.')

  return numero
}
