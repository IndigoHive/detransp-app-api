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

// criaCertidao (POST, create) returns data as a single object, unlike
// buscaCertidao (GET, list) — confirmed via live log 2026-08-06: `data` came
// back as {type, id, attributes}, not an array.
export type CriaCertidaoResponse = {
  data: {
    id: string | null
    type: string
    attributes: CertidaoAttributes
  }
}

export type CriaCertidaoResult = CriaCertidaoResponse | null | undefined

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

export type CertidaoListagemVeiculoIncluded = {
  type: string
  id: string
  attributes: {
    placa: string
    renavam: string
    criadoPor?: string
    dataHoraEmissao: DateString
    nomeDoc: string
    sysId_cnm: string
  }
}

export type CertidaoListagemResponse = {
  data: {
    type: string
    id: string
    attributes: { cpf: string; nome?: string }
    relationships: {
      veiculos: {
        data: { type: string; id: string } | Array<{ type: string; id: string }>
      }
    }
  }
  included?: CertidaoListagemVeiculoIncluded[]
}

export type CertidaoListagemResult = CertidaoListagemResponse | null | undefined

export type DocumentoCertidaoPorIdResponse = {
  data: {
    id: string
    type: string
    attributes: {
      conteudo?: string
      attributes?: DocumentoCertidaoAttributes
    }
  }
}

export type DocumentoCertidaoPorIdResult = DocumentoCertidaoPorIdResponse | null | undefined
