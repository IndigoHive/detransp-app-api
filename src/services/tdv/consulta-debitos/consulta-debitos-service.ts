import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ConsultaDebitosInput = {
  codigoTransferencia: string
}

export type DebitoItem = {
  descricao: string
  valor: number
  valorFormatado: string
}

export type ConsultaDebitosResult = {
  nomeComprador: string
  debitos: DebitoItem[]
  valorTotal: number
  taxaTransferencia: string
  taxaLicenciamento: string
  totalDebitos: string
  qrCode?: string | undefined
  expiresAt?: string | undefined
  estado?: number | undefined
  comprovante?: string | undefined
  confirmedDate?: string | undefined
}

function formatCurrency (value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

function sleep (ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const MAX_POLL_ATTEMPTS = 8
const POLL_INTERVAL_MS = 1000

export class ConsultaDebitosService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: ConsultaDebitosInput): Promise<ConsultaDebitosResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const [tdvResult, initialDebitosResult, initialPixResult] = await Promise.all([
      this.client.buscaTdv(auth, input.codigoTransferencia),
      this.client.buscaDebitosTdv(auth, input.codigoTransferencia),
      this.client.buscaPixQrCodeTdv(auth, input.codigoTransferencia, true)
    ])

    let debitosResult = initialDebitosResult
    let pixResult = initialPixResult

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS && (!debitosResult || !pixResult); attempt++) {
      await sleep(POLL_INTERVAL_MS)
      const [polledDebitos, polledPix] = await Promise.all([
        debitosResult ?? this.client.buscaDebitosTdv(auth, input.codigoTransferencia),
        pixResult ?? this.client.buscaPixQrCodeTdv(auth, input.codigoTransferencia, true)
      ])
      debitosResult = polledDebitos
      pixResult = polledPix
    }

    const rawDebitos = debitosResult?.result?.debitos ?? []

    const debitos = rawDebitos.map((d) => ({
      descricao: d.descricao,
      valor: d.valor,
      valorFormatado: formatCurrency(d.valor)
    }))

    const taxaTransferencia = rawDebitos.find(d =>
      d.descricao.toLowerCase().includes('transferência') || d.descricao.toLowerCase().includes('transferencia')
    )?.valor ?? 0

    const taxaLicenciamento = rawDebitos.find(d =>
      d.descricao.toLowerCase().includes('licenciamento')
    )?.valor ?? 0

    const valorTotal = debitosResult?.result?.valorTotal ?? 0
    const estadoQRCode = pixResult?.result?.estadoQRCode

    return {
      nomeComprador: tdvResult?.result?.nomeComprador ?? '',
      debitos,
      valorTotal,
      taxaTransferencia: formatCurrency(taxaTransferencia),
      taxaLicenciamento: formatCurrency(taxaLicenciamento),
      totalDebitos: formatCurrency(valorTotal),
      qrCode: pixResult?.result?.qrCode,
      expiresAt: pixResult?.result?.dataExpiracaoQRCode,
      estado: estadoQRCode !== undefined ? Number(estadoQRCode) : undefined,
      comprovante: pixResult?.result?.idPagamentoQRCode || undefined,
      confirmedDate: pixResult?.result?.dataPagamentoQRCode || undefined
    }
  }
}
