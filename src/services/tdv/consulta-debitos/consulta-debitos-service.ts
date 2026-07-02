import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ConsultaDebitosInput = {
  codigoTransferencia: string
}

export type ConsultaDebitosResult = {
  nomeComprador: string
  taxaTransferencia: string
  taxaLicenciamento: string
  totalDebitos: string
  pixQrCode?: string | undefined
  pixExpiracao?: string | undefined
}

function formatCurrency (value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

export class ConsultaDebitosService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (accessToken: string, input: ConsultaDebitosInput): Promise<ConsultaDebitosResult> {
    const [tdvResult, debitosResult, pixResult] = await Promise.all([
      this.client.buscaTdv(accessToken, input.codigoTransferencia),
      this.client.buscaDebitosTdv(accessToken, input.codigoTransferencia),
      this.client.buscaPixQrCodeTdv(accessToken, input.codigoTransferencia)
    ])

    const debitos = debitosResult?.result?.debitos ?? []

    const taxaTransferencia = debitos.find(d =>
      d.descricao.toLowerCase().includes('transferência') || d.descricao.toLowerCase().includes('transferencia')
    )?.valor ?? 0

    const taxaLicenciamento = debitos.find(d =>
      d.descricao.toLowerCase().includes('licenciamento')
    )?.valor ?? 0

    const totalDebitos = debitosResult?.result?.valorTotal ?? 0

    return {
      nomeComprador: tdvResult?.result?.nomeComprador ?? '',
      taxaTransferencia: formatCurrency(taxaTransferencia),
      taxaLicenciamento: formatCurrency(taxaLicenciamento),
      totalDebitos: formatCurrency(totalDebitos),
      pixQrCode: pixResult?.result?.qrCode,
      pixExpiracao: pixResult?.result?.dataExpiracaoQRCode
    }
  }
}
