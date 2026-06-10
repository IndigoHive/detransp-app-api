import type { HrefLink } from './_common'

export type CRLVeData = {
  self: HrefLink
  base64: string
}

export type BuscaCRLVeResult =
  | { result?: CRLVeData }
  | null
  | undefined
