import type { DateString } from './_common'

export type CriaPixBody = {
  included: Array<
    | { type: 'condutor'; id: string; attributes: { cpf: string; cnpj: string } }
    | {
      type: 'tipos-servico'
      id: string
      attributes: { codigoservico: string; ipvaParcelado: boolean; ipvaAnterior: boolean }
    }
    | { type: 'veiculos'; id: string; attributes: { renavam: string; placa: string } }
  >
  data: {
    type: 'servicos'
    id: string
    relationships: {
      condutor: { type: 'condutor'; id: string }
      'tipo-servico': { type: 'tipos-servico'; id: string }
      veiculos: { type: 'veiculos'; id: string }
    }
  }
}

export type PixQRCodeAttributes = {
  idSolServico?: string
  idQRCode?: string
  qrCode?: string
  // POST: "YYYY-MM-DD HH:MM:SS" (UTC); GET: "DD-MM-YYYY HH:MM:SS" (BRT)
  dataExpiracaoQRCode?: DateString
  // POST: "Ativo" (text); GET: "1" | "2" | "3" (number-string)
  estadoQRCode?: string
  idPagamentoQRCode?: string
  dataPagamentoQRCode?: DateString
}

export type PixDebitoAttributes = {
  descricao?: string
  valor?: number
  vencimento?: DateString
  autoInfracao?: string
  municipio?: string
  nomeOrgao?: string
}

export type PixIncluded =
  | { type: 'qr-code'; id: string; attributes?: PixQRCodeAttributes }
  | { type: 'debitos'; id: string; attributes?: PixDebitoAttributes }
  | { type: 'veiculos'; id: string; attributes?: { renavam?: string; placa?: string } }
  | { type: 'registro'; id: string; attributes?: { id?: string; status?: string; estado?: string; expiracao?: string } }

export type PixResponse = {
  data?: {
    type?: string
    id?: string
  }
  included?: PixIncluded[]
  meta?: {
    qtdDebitos?: number
    valorDebitos?: number
  }
}

export type PixResult = PixResponse | null | undefined
