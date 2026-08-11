import type { Logger } from 'pino'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoQRCode, CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
  logger: Logger
}

export type ConsultaDebitosInput = {
  codigoTransferencia: string
}

export type ConsultaDebitosResult = {
  nomeComprador: string
  taxaTransferencia: string
  taxaLicenciamento: string
  totalDebitos: string
  // Named to match the flow runtime's generic pix_screen contract (see
  // CriaQRCodeLicenciamentoService, the other working pix flow) — the app reads
  // `qrCode`/`expiresAt` off the pix node's own response, not TDV-specific names.
  qrCode?: string | undefined
  expiresAt?: string | undefined
  // Numeric CodigoEstadoQRCode ('2' = pago) — polled by the app every 5s (useFlowRuntime.ts)
  // to detect when the PIX has been paid and advance the flow.
  estado?: number | undefined
  // Read by useFlowRuntime.ts's poll handler and by the "[Comprador] Pagamento concluído"
  // screen (@{node:...comprovante}/@{node:...confirmedDate}) once estado reaches PAGO.
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
  private readonly logger: Logger

  constructor ({ detranSpServiceNowTdv, logger }: Dependencies) {
    this.client = detranSpServiceNowTdv
    this.logger = logger
  }

  async run (authorizationHeader: string | undefined, input: ConsultaDebitosInput): Promise<ConsultaDebitosResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    // ServiceNow's forcarNovo is idempotent on its end — it only actually issues a new QR/PIX
    // charge if the existing one is expired, otherwise it just returns the current one. So this
    // is always safe to pass as true, whether this is the first fetch or a later poll.
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

    const debitos = debitosResult?.result?.debitos ?? []

    const taxaTransferencia = debitos.find(d =>
      d.descricao.toLowerCase().includes('transferência') || d.descricao.toLowerCase().includes('transferencia')
    )?.valor ?? 0

    const taxaLicenciamento = debitos.find(d =>
      d.descricao.toLowerCase().includes('licenciamento')
    )?.valor ?? 0

    const totalDebitos = debitosResult?.result?.valorTotal ?? 0
    const estadoQRCode = pixResult?.result?.estadoQRCode

    // The DETRAN cron eventually advances a paid TDV to estado 8 (taxa de serviço paga),
    // but it can be slow — since the app polls this endpoint, we accelerate the transition
    // here the moment the PIX is detected as paid. Guarded to estado 7 so repeated polls
    // don't re-issue the call; best-effort, as the cron still completes it if this fails.
    if (
      Number(estadoQRCode) === Number(CodigoEstadoQRCode.PAGO) &&
      tdvResult?.result?.estado === CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA
    ) {
      try {
        await this.client.atualizaTdv(auth, input.codigoTransferencia, {
          estado: CodigoEstadoTDV.TAXA_SERVICO_PAGA
        })
        this.logger.info(
          { codigoTransferencia: input.codigoTransferencia },
          'TDV acelerada para o estado TAXA_SERVICO_PAGA'
        )
      } catch (error) {
        this.logger.warn(
          { err: error, codigoTransferencia: input.codigoTransferencia },
          'Falha ao acelerar TDV para o estado TAXA_SERVICO_PAGA'
        )
      }
    }

    return {
      nomeComprador: tdvResult?.result?.nomeComprador ?? '',
      taxaTransferencia: formatCurrency(taxaTransferencia),
      taxaLicenciamento: formatCurrency(taxaLicenciamento),
      totalDebitos: formatCurrency(totalDebitos),
      qrCode: pixResult?.result?.qrCode,
      expiresAt: pixResult?.result?.dataExpiracaoQRCode,
      estado: estadoQRCode !== undefined ? Number(estadoQRCode) : undefined,
      comprovante: pixResult?.result?.idPagamentoQRCode || undefined,
      confirmedDate: pixResult?.result?.dataPagamentoQRCode || undefined
    }
  }
}
