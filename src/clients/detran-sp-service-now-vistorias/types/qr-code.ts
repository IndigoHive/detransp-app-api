export type CriaQRCodeBody = {
  correlationID: string
}

export type CriaQRCodeResult =
  | {
      result?: {
        success: boolean
        message: string
        correlationID: string
        pevType: string
        data?: {
          process: string
          data?: {
            id: string
            emv: string
            txid: string
            qrCodePix: string
            valorTotal: number
            expiracao: number
            dtExpiracao: string
          }
        }
      }
    }
  | null
  | undefined

export type VerificaQRCodeResult =
  | {
      result?: {
        success: boolean
        message: string
        data?: {
          process: string
          body?: {
            id: string
            status: string
          }
        }
        correlationID: string | null
      }
    }
  | null
  | undefined
