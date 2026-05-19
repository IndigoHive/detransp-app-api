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

export type ServiceNowCsmResponse = {
  result: {
    sys_id: string
    number: string
    parent_id: string | null
    record: string
    redirect_portal_url: string
    parent_table: string
    redirect_url: string
    table: string
    redirect_to: string
  }
}
