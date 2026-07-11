export type DateString = string
export type Renavam = string
export type Placa = string

// GET /pix returns estadoQRCode as a number-string ("1" | "2" | "3");
// POST /pix returns it as text ("Ativo"). Normalize before comparing.
export const enum EstadoQRCodePix {
  Ativo = 1,
  Pago = 2,
  Expirado = 3
}

export function normalizeEstadoQRCode (estado: string | undefined | null): EstadoQRCodePix | null {
  if (!estado) return null
  const numeric = Number(estado)
  if (Number.isFinite(numeric) && numeric >= 1 && numeric <= 3) return numeric
  const lowered = estado.toLowerCase()
  if (lowered === 'ativo') return EstadoQRCodePix.Ativo
  if (lowered === 'pago') return EstadoQRCodePix.Pago
  if (lowered === 'expirado') return EstadoQRCodePix.Expirado
  return null
}
