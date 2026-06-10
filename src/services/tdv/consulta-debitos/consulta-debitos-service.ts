import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { extractBearerToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ConsultaDebitosInput = {
  codigoTransferencia: string
}

export type ConsultaDebitosResult = {
  valorTotal: number
  debitos: Array<{
    descricao: string
    valor: number
  }>
  pixQrCode?: string | undefined
  pixExpiracao?: string | undefined
}

export class ConsultaDebitosService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: ConsultaDebitosInput): Promise<ConsultaDebitosResult> {
    const token = extractBearerToken(authorizationHeader)

    const [debitosResult, pixResult] = await Promise.all([
      this.client.buscaDebitosTdv(token, input.codigoTransferencia),
      this.client.buscaPixQrCodeTdv(token, input.codigoTransferencia)
    ])

    return {
      valorTotal: debitosResult?.result?.valorTotal ?? 0,
      debitos: debitosResult?.result?.debitos ?? [],
      pixQrCode: pixResult?.result?.qrCode,
      pixExpiracao: pixResult?.result?.dataExpiracaoQRCode
    }
  }
}
