import type { DateString } from './_common'

export type TaxaCertidaoAttributes = {
  descricao?: string
  vencimento?: DateString
  valor: number
}

export type TaxaCertidaoResponse = {
  data: {
    id: string
    type: string
    attributes: TaxaCertidaoAttributes
  }
}

export type TaxaCertidaoResult = TaxaCertidaoResponse | null | undefined

export type QRCodeCertidaoAttributes = {
  dados: string
  dataExpiracao: DateString
  endToEndId?: string | null
  dataPagamento?: DateString | null
}

export type QRCodeCertidaoEstadoLinksData = {
  type: string
  id: string
}

export type QRCodeCertidaoRelationships = {
  estado: {
    links: {
      self: string
      data: QRCodeCertidaoEstadoLinksData
    }
  }
}

export type QRCodeCertidaoResponse = {
  data: {
    id: string
    type: string
    attributes: QRCodeCertidaoAttributes
    relationships: QRCodeCertidaoRelationships
  }
}

export type QRCodeCertidaoResult = QRCodeCertidaoResponse | null | undefined

export type CertidaoAttributes = {
  renavam: string
  placa: string
  criadoPor?: string
  dataHoraEmissao: DateString
  validade?: string
}

export type CertidaoResponse = {
  data: Array<{
    id: string
    type: string
    attributes: CertidaoAttributes
  }>
}

export type CertidaoResult = CertidaoResponse | null | undefined

export type DocumentoCertidaoAttributes = {
  conteudo: string
}

export type DocumentoCertidaoResponse = {
  data: {
    id: string
    type: string
    attributes: DocumentoCertidaoAttributes
  }
}

export type DocumentoCertidaoResult = DocumentoCertidaoResponse | null | undefined
