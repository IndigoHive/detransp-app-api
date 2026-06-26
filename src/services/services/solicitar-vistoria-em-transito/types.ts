export type SolicitarVistoriaEmTransitoAnexo = {
  name: string
  mimeType: string
  size: number
}

export type SolicitarVistoriaEmTransitoInput = {
  nome: string
  cpfOuCnpj: string
  telefone: string
  email: string
  municipioDestino: string
  numeroProcessoSei?: string
  placa: string
  documentoContratoSocial?: boolean
  documentoComprovantePagemento?: boolean
  documentoComprovanteResidencia?: boolean
  documentoComprovanteRepresentacao?: boolean
  declaracaoLgpd: boolean
  declaracaoRespuestavelSuspensao: boolean
  anexos?: SolicitarVistoriaEmTransitoAnexo[]
}

export type SolicitarVistoriaEmTransitoResponse =
  | {
      protocol: string
    }
  | {
      showSnackbar: {
        variant: 'error'
        title: string
        description: string
      }
    }

