export type CriaQRCodeBody = {
  correlationID: string
}

export type CriaQRCodeResult =
  | {
      result?:
      | {
        success: true
        message: string
        correlationID: string
        pevType: string
        data: {
          process: 'success'
          data: {
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
      | {
        success: false
        message: string
        correlationID?: string | null
      }
    }
  | null
  | undefined

export type VerificaQRCodeResult =
  | {
      result?:
      | {
        success: true
        message: string
        data: {
          process: 'success'
          body: {
            id: string
            status: string
          }
        }
        correlationID: string | null
      }
      | {
        success: false
        message: string
        correlationID?: string | null
      }
    }
  | null
  | undefined
