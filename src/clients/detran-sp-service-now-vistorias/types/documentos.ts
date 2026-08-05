export type GeraDocumentoBody = {
  numeroPEV: string
  documento: string
}

export type GeraDocumentoResult =
  | {
      result?:
      | {
        success: true
        message: string
        file_name: string
        content_type: 'application/pdf'
        base64: string
        attachment_id: string
      }
      | {
        success: false
        message: string
      }
    }
  | null
  | undefined

export type BuscaDocumentoVistoriaResult =
  | {
      result?:
      | {
        success: true
        message: string
        correlationId: string
        data: {
          anexo_vistoria: string
        }
      }
      | {
        success: false
        message: string
        correlationId?: string
      }
    }
  | null
  | undefined
