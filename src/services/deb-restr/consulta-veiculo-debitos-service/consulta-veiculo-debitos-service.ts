import type { Logger } from 'pino'
import type {
  BuscaVeiculoResponse,
  DebitoIncluded,
  DetranSpServiceNowDebRestrClient
} from '../../../clients/detran-sp-service-now-deb-restr'
import { DetranSpServiceNowDebRestrError } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DetranSpServiceNowPgtoClient, ListaDebitosResult } from '../../../clients/detran-sp-service-now-pgto'
import type {
  ConsultaVeiculoDebitosResult,
  DebRestrVeiculoAuth,
  VehicleDebtsPayload
} from '../types'
import { deriveIpvaSectionStatus, deriveSectionStatus, formatCurrencyBr, sumValores } from '../utils'

const LICENCIAMENTO_BLOQUEADO_TEXT = 'Para liberar o pagamento do licenciamento, é preciso que todos os débitos do veículo tenham sido pagos.'

function ipvaHelperText (parcelCount: number): string | undefined {
  return parcelCount > 1 ? `Parcelamento em até ${parcelCount}x no Pix sem juros` : undefined
}

export type ConsultaVeiculoDebitosParams = DebRestrVeiculoAuth & {
  representacao?: boolean
}

export class ConsultaVeiculoDebitosService {
  private readonly debRestrClient: DetranSpServiceNowDebRestrClient
  private readonly pgtoClient: DetranSpServiceNowPgtoClient
  private readonly logger: Logger

  constructor (debRestrClient: DetranSpServiceNowDebRestrClient, pgtoClient: DetranSpServiceNowPgtoClient, logger: Logger) {
    this.debRestrClient = debRestrClient
    this.pgtoClient = pgtoClient
    this.logger = logger
  }

  async run (params: ConsultaVeiculoDebitosParams): Promise<ConsultaVeiculoDebitosResult> {
    const { representacao = false, ...auth } = params

    const [veiculoSettled, debitosSettled] = await Promise.allSettled([
      this.debRestrClient.buscaVeiculo(auth, auth.renavam, { includeProcedencia: representacao }),
      this.pgtoClient.listaDebitos(auth)
    ])

    // TEMP DEBUG — remove after this session. Always-on (not gated by
    // LOG_LEVEL) per request, to inspect buscaVeiculo's raw response live.
    // `String(reason)` used to collapse a DetranSpServiceNowDebRestrError down
    // to just "Name: message", dropping the raw ServiceNow `type`/`responseData`
    // that are the whole point of this debug log — log them explicitly instead.
    this.logger.warn(
      {
        action: 'temp-debug-consulta-veiculo',
        renavam: auth.renavam,
        placa: auth.placa,
        status: veiculoSettled.status,
        ...(veiculoSettled.status === 'fulfilled'
          ? { raw: veiculoSettled.value }
          : veiculoSettled.reason instanceof DetranSpServiceNowDebRestrError
            ? {
                errorName: veiculoSettled.reason.name,
                errorType: veiculoSettled.reason.type,
                errorMessage: veiculoSettled.reason.message,
                responseData: veiculoSettled.reason.responseData
              }
            : {
                errorName: veiculoSettled.reason?.name,
                errorMessage: veiculoSettled.reason?.message,
                errorStack: veiculoSettled.reason?.stack
              })
      },
      'TEMP DEBUG buscaVeiculo raw response'
    )

    if (veiculoSettled.status === 'rejected') {
      const err = veiculoSettled.reason
      if (!(err instanceof DetranSpServiceNowDebRestrError)) throw err
      // Daily query limit (10/day per CPF) on the representação path is a valid
      // flow branch, not an error — exact ServiceNow error type still unconfirmed
      // in homolog, so match defensively on type and message.
      if (representacao && /limite/i.test(`${err.type} ${err.message}`)) {
        return this.emptyResult({ limitReached: true })
      }
      throw err
    }

    const veiculo = veiculoSettled.value
    if (!veiculo?.data) {
      return this.emptyResult({ limitReached: false })
    }

    // Step 4 (pgto) is best-effort: on failure we still render the vehicle
    // using the deb-restr data, just without the bloqueio signal.
    const debitos = debitosSettled.status === 'fulfilled' ? debitosSettled.value : null

    return this.buildResult(veiculo, debitos)
  }

  private buildResult (veiculo: BuscaVeiculoResponse, debitos: ListaDebitosResult): ConsultaVeiculoDebitosResult {
    const attributes = veiculo.data.attributes
    const meta = veiculo.data.meta ?? veiculo.meta
    const included = veiculo.included ?? []

    const bloqueio = debitos?.data?.attributes?.bloqueio
    const hasMultaForaDoSistema = Boolean(bloqueio)

    const ipva = included.filter((d) => d.type === 'debitos-ipva')
    const multas = included.filter((d) => d.type === 'debitos-milt' || d.type === 'debitos-renainf')
    const licenciamento = included.filter((d) => d.type === 'debitos-licenciamento')

    const totalDebits =
      debitos?.meta?.valorDebitos ??
      meta?.valorDebitos ??
      sumValores([...ipva, ...multas, ...licenciamento])

    return {
      vehicle: {
        plate: attributes.placa ?? null,
        brandModel: attributes.marcaModelo?.descricao ?? null,
        renavam: attributes.renavam ?? null,
        yearFab: attributes.anoFabricacao?.toString() ?? null,
        yearMod: attributes.anoModelo?.toString() ?? null,
        cor: attributes.cor?.descricao ?? null,
        tipo: attributes.tipo?.descricao ?? null,
        combustivel: attributes.combustivel?.descricao ?? null,
      },
      restrictions: {
        bloqueioFurtoRoubo: meta?.bloqueioFurtoRoubo,
        restricaoTributaria: meta?.restricaoTributaria,
        restricaoAdministrativa: meta?.restricaoAdministrativa,
        restricaoJudicial: meta?.restricaoJudicial,
        restricaoVeiculoGuinchado: meta?.restricaoVeiculoGuinchado,
        renainf: meta?.multas,
        nomeAgente: meta?.nomeAgente,
      },
      hasMultaForaDoSistema,
      debts: this.buildDebtsPayload({ ipva, multas, licenciamento, hasMultaForaDoSistema }),
      totalDebits,
      totalDebitsLabel: formatCurrencyBr(totalDebits),
      limitReached: false,
    }
  }

  private buildDebtsPayload (params: {
    ipva: DebitoIncluded[]
    multas: DebitoIncluded[]
    licenciamento: DebitoIncluded[]
    hasMultaForaDoSistema: boolean
  }): VehicleDebtsPayload {
    const { ipva, multas, licenciamento, hasMultaForaDoSistema } = params
    const hasOtherDebts = ipva.length > 0 || multas.length > 0

    const licenciamentoPayable = licenciamento.length > 0 && !hasOtherDebts

    const ipvaStatus = deriveIpvaSectionStatus(ipva)
    const multasStatus = deriveSectionStatus(multas)
    const helperText = ipvaHelperText(ipva.length)

    return {
      ipva: {
        ...(ipvaStatus === 'REGULAR' ? { status: ipvaStatus } : {}),
        items: ipva.map((d) => ({ exercicio: d.attributes.exercicio ?? null, valor: d.attributes.valor })),
        totalLabel: ipva.length > 0 ? formatCurrencyBr(sumValores(ipva)) : null,
        detailsButton: ipva.length > 0 ? 'visible' : 'hidden',
        pixButton: hasMultaForaDoSistema ? 'hidden' : ipva.length > 0 ? 'visible' : 'hidden',
        ...(helperText ? { helperText } : {}),
      },
      multas: {
        ...(multasStatus === 'REGULAR' ? { status: multasStatus } : {}),
        items: multas.map((d) => ({
          descricao: d.attributes.descricao ?? d.attributes.autoInfracao ?? d.attributes.nomeServico ?? '',
          valor: d.attributes.valor,
        })),
        totalLabel: multas.length > 0 ? formatCurrencyBr(sumValores(multas)) : null,
        detailsButton: multas.length > 0 ? 'visible' : 'hidden',
        pixButton: hasMultaForaDoSistema ? 'hidden' : multas.length > 0 ? 'visible' : 'hidden',
      },
      licenciamento: {
        status: deriveSectionStatus(licenciamento),
        items: licenciamento.map((d) => ({ exercicio: d.attributes.exercicio ?? null, valor: d.attributes.valor })),
        // No debt → no button; debt blocked by other debts → disabled; payable → visible
        pixButton: hasMultaForaDoSistema || licenciamento.length === 0
          ? 'hidden'
          : licenciamentoPayable ? 'visible' : 'disabled',
        ...(licenciamento.length > 0 && !licenciamentoPayable
          ? { helperText: LICENCIAMENTO_BLOQUEADO_TEXT }
          : {}),
      },
    }
  }

  private emptyResult (params: { limitReached: boolean }): ConsultaVeiculoDebitosResult {
    return {
      vehicle: null,
      restrictions: {},
      hasMultaForaDoSistema: false,
      debts: null,
      totalDebits: 0,
      totalDebitsLabel: formatCurrencyBr(0),
      limitReached: params.limitReached,
    }
  }
}
