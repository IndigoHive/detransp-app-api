import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

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
  // Numeric CodigoEstadoQRCode ('2' = pago) — polled by the app every 5s (useFlowRuntime.ts)
  // to detect when the PIX has been paid and advance the flow.
  estado?: number | undefined
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

    const tdvResult = await this.client.buscaTdv(auth, input.codigoTransferencia)

    // Only force a new QR code the first time (no qrCode on the TDV yet). The app polls this
    // same endpoint every 5s (useFlowRuntime.ts) to check payment status — forcing again on
    // every poll would generate a brand new QR/PIX charge each time, invalidating the one the
    // buyer already scanned. See detran-app-kotlin's PagamentoPixTdvScreen.kt, which forces
    // once via getQrCode then only checks status via getQrCodeStatus(forcarNovo=false).
    const forcarNovo = !tdvResult?.result?.qrCode

    const [initialDebitosResult, initialPixResult] = await Promise.all([
      this.client.buscaDebitosTdv(auth, input.codigoTransferencia),
      this.client.buscaPixQrCodeTdv(auth, input.codigoTransferencia, forcarNovo)
    ])

    let debitosResult = initialDebitosResult
    let pixResult = initialPixResult

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS && (!debitosResult || !pixResult); attempt++) {
      await sleep(POLL_INTERVAL_MS)
      const [polledDebitos, polledPix] = await Promise.all([
        debitosResult ?? this.client.buscaDebitosTdv(auth, input.codigoTransferencia),
        pixResult ?? this.client.buscaPixQrCodeTdv(auth, input.codigoTransferencia, false)
      ])
      debitosResult = polledDebitos
      pixResult = polledPix
    }

    const debitos = debitosResult?.result?.debitos ?? []

    const taxaTransferencia = debitos.find(d =>
      d.descricao.toLowerCase().includes('transferência') || d.descricao.toLowerCase().includes('transferencia')
    )?.valor ?? 0

    const taxaLicenciamento = debitos.find(d =>
      d.descricao.toLowerCase().includes('licenciamento')
    )?.valor ?? 0

    const totalDebitos = debitosResult?.result?.valorTotal ?? 0
    const estadoQRCode = pixResult?.result?.estadoQRCode

    return {
      nomeComprador: tdvResult?.result?.nomeComprador ?? '',
      taxaTransferencia: formatCurrency(taxaTransferencia),
      taxaLicenciamento: formatCurrency(taxaLicenciamento),
      totalDebitos: formatCurrency(totalDebitos),
      pixQrCode: pixResult?.result?.qrCode,
      pixExpiracao: pixResult?.result?.dataExpiracaoQRCode,
      estado: estadoQRCode !== undefined ? Number(estadoQRCode) : undefined
    }
  }
}
