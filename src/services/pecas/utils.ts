import { BadRequest } from 'http-errors'

// ponytail: formato real da URL do QR Code ainda não confirmado — assume que o
// código é o último segmento do path. Ajustar aqui se vier como query param.
export function extractNumeroFromQrUrl(scannedUrl: string): string {
  const numero = scannedUrl.split('/').filter(Boolean).pop()
  if (!numero) throw BadRequest('QR Code inválido não foi possível reconhecer o número da etiqueta.')

  return numero
}
