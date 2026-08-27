import type { Logger } from 'pino'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoQRCode, CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'
import { normalizeUtcDateTime } from '../../../utils/normalize-utc-datetime'
import { formatDateTimeBr } from '../../deb-restr/utils'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
  logger: Logger
}

export type ConsultaDebitosInput = {
  codigoTransferencia: string
  // Only true for the "Pagamento PIX" node (the screen that actually shows the QR code).
  // The débitos-list screen calls this same endpoint first, with this false, so it must
  // only read an existing charge — never mint one — or the PIX's short expiration window
  // starts ticking before the buyer ever sees the QR.
  gerarQrCode: boolean
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
  estadoTdv?: string | undefined
  comprovante?: string | undefined
  confirmedDate?: string | undefined
}

function formatCurrency (value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
    // is always safe to pass as true, whether this is the first fetch or a later poll — but it
    // must only be true for the PIX screen (gerarQrCode), never for the débitos-list screen.
    const fetchPix = () => {
      if (input.gerarQrCode) {
        this.logger.info(
          { codigoTransferencia: input.codigoTransferencia },
          'Solicitando geração/renovação do QR code PIX da TDV'
        )
      }
      return this.client.buscaPixQrCodeTdv(auth, input.codigoTransferencia, input.gerarQrCode)
    }

    const [tdvResult, initialDebitosResult, initialPixResult] = await Promise.all([
      this.client.buscaTdv(auth, input.codigoTransferencia),
      this.client.buscaDebitosTdv(auth, input.codigoTransferencia),
      fetchPix()
    ])

    let debitosResult = initialDebitosResult
    let pixResult = initialPixResult

    // Only keep polling for the PIX side when one is actually expected to appear — if
    // gerarQrCode is false and none exists yet, an undefined pixResult is the correct,
    // final answer, not something to retry away (that would just stall the débitos
    // screen for MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS for no reason).
    for (
      let attempt = 0;
      attempt < MAX_POLL_ATTEMPTS && (!debitosResult || (input.gerarQrCode && !pixResult));
      attempt++
    ) {
      await sleep(POLL_INTERVAL_MS)
      const [polledDebitos, polledPix] = await Promise.all([
        debitosResult ?? this.client.buscaDebitosTdv(auth, input.codigoTransferencia),
        input.gerarQrCode && !pixResult ? fetchPix() : pixResult
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

    // Temporary (do not ship): txid for mock-paying via the SEFAZ homolog
    // webhook — warn level on purpose, just to stand out in the log list. Only
    // logged when a charge actually exists — with gerarQrCode false (débitos-list
    // screen) and no prior charge, pixResult is legitimately undefined.
    if (pixResult?.result?.idQRCode) {
      this.logger.warn(
        { action: 'mock-pay-txid', codigoTransferencia: input.codigoTransferencia, txid: pixResult.result.idQRCode, valor: valorTotal },
        'QR TDV débitos criado — txid para pagamento mock em homolog'
      )
    }

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
      debitos,
      valorTotal,
      taxaTransferencia: formatCurrency(taxaTransferencia),
      taxaLicenciamento: formatCurrency(taxaLicenciamento),
      totalDebitos: formatCurrency(valorTotal),
      qrCode: pixResult?.result?.qrCode,
      expiresAt: pixResult?.result?.dataExpiracaoQRCode
        ? normalizeUtcDateTime(pixResult.result.dataExpiracaoQRCode)
        : undefined,
      estado: estadoQRCode !== undefined ? Number(estadoQRCode) : undefined,
      estadoTdv: tdvResult?.result?.estado ?? undefined,
      comprovante: pixResult?.result?.idPagamentoQRCode || undefined,
      confirmedDate: pixResult?.result?.dataPagamentoQRCode
        ? formatDateTimeBr(pixResult.result.dataPagamentoQRCode)
        : undefined
    }
  }
}
