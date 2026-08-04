export type SolicitaRestituicaoBody = {
  token: string
  documento: string
}

export type SolicitaRestituicaoResult =
  | {
      result?:
      | {
          success: true
          message: string
          correlationId: string
          data: {
            id: string
            token: string
            statusAnterior: string
            statusAtual: string
            message: string
            registro_sys_id: string
            registro_number: string
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

export type ConsultaComprovanteRestituicaoResult =
  | {
      result?:
      | {
          success: true
          message: string
          correlationId: string
          data: {
            servico: Record<string, string>
            destino: Record<string, string>
            veiculo: Record<string, string>
            origem: Record<string, string>
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

export type BuscaDocumentoRestituicaoResult =
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
