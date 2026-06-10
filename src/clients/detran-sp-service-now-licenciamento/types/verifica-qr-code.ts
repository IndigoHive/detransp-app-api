import type { QRCodeData } from './_common'

export type VerificaQRCodeResult =
  | { result?: QRCodeData }
  | null
  | undefined
