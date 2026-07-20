import { BadGateway } from 'http-errors'
import type { Logger } from 'pino'
import type {
  CriaPixBody,
  DetranSpServiceNowPgtoClient,
  PixResult
} from '../../../clients/detran-sp-service-now-pgto'
import { CodigoSefaz } from '../../../clients/detran-sp-service-now-pgto'
import type { CriaPixDebitoResult, DebRestrVeiculoAuth, PixDebitoTipo } from '../types'
import type { TiposServicoResolverService } from '../tipos-servico-resolver-service'
import { buildVeiculoPixId } from '../utils'

const CODIGO_SEFAZ_BY_TIPO: Record<PixDebitoTipo, string> = {
  ipva: CodigoSefaz.IPVA,
  // MILT only — Renainf is not payable through DetranSP (no jurisdiction over
  // national fines; they are query/block-only)
  multas: CodigoSefaz.Milt,
  licenciamento: CodigoSefaz.Licenciamento,
  // "Débitos Pendentes" aggregates every payable debt into one QR — confirmed
  // in homolog 2026-07-06 (DET9H13: 2 multas; BSY0A03: 2 IPVA exercícios)
  total: CodigoSefaz.DebitosPendentes,
}

export type CriaPixDebitoParams = DebRestrVeiculoAuth & {
  tipo: PixDebitoTipo
  parcelado?: boolean
}

export class CriaPixDebitoService {
  private readonly client: DetranSpServiceNowPgtoClient
  private readonly tiposServicoResolver: TiposServicoResolverService
  private readonly logger: Logger

  constructor (client: DetranSpServiceNowPgtoClient, tiposServicoResolver: TiposServicoResolverService, logger: Logger) {
    this.client = client
    this.tiposServicoResolver = tiposServicoResolver
    this.logger = logger
  }

  async run (params: CriaPixDebitoParams): Promise<CriaPixDebitoResult> {
    const { tipo, parcelado = false, ...auth } = params

    const codigoSefaz = CODIGO_SEFAZ_BY_TIPO[tipo]
    const tipoServicoId = await this.tiposServicoResolver.resolve(auth, codigoSefaz)
    if (!tipoServicoId) {
      // Never fail silently here: an unresolvable service type means the
      // ServiceNow tipos-servico catalog is broken again (the resolver has
      // already logged the alert). Surface it as an upstream failure.
      throw new BadGateway('Catálogo tipos-servico do ServiceNow indisponível ou sem códigos — pagamento PIX bloqueado.')
    }

    const veiculoId = buildVeiculoPixId(auth.renavam, auth.placa)
    const body: CriaPixBody = {
      included: [
        { type: 'condutor', id: auth.userCpf, attributes: { cpf: auth.userCpf, cnpj: '' } },
        {
          type: 'tipos-servico',
          id: tipoServicoId,
          attributes: { codigoservico: codigoSefaz, ipvaParcelado: tipo === 'ipva' && parcelado, ipvaAnterior: false }
        },
        { type: 'veiculos', id: veiculoId, attributes: { renavam: auth.renavam, placa: auth.placa.toUpperCase() } }
      ],
      data: {
        type: 'servicos',
        id: '',
        relationships: {
          condutor: { type: 'condutor', id: auth.userCpf },
          'tipo-servico': { type: 'tipos-servico', id: tipoServicoId },
          veiculos: { type: 'veiculos', id: veiculoId }
        }
      }
    }

    const result = await this.criaPixComRetry(auth, body)
    const qrCode = result?.included?.find((item) => item.type === 'qr-code')

    // Temporary (do not ship): txid for mock-paying the QR via the SEFAZ
    // homolog webhook — only present in the raw ServiceNow payload.
    this.logger.info(
      {
        action: 'mock-pay-txid',
        tipo,
        renavam: auth.renavam,
        txid: qrCode?.attributes?.idQRCode,
        idSolServico: qrCode?.attributes?.idSolServico,
        valor: result?.meta?.valorDebitos
      },
      'PIX débito criado — txid para pagamento mock em homolog'
    )

    return {
      qrCode: qrCode?.attributes?.qrCode ?? null,
      expiresAt: qrCode?.attributes?.dataExpiracaoQRCode ?? null,
      idSolServico: qrCode?.attributes?.idSolServico ?? null,
    }
  }

  // First attempt on IPVA with multiple exercícios intermittently hits the
  // ServiceNow 30s execution timeout; the retry with the same body succeeds.
  private async criaPixComRetry (auth: DebRestrVeiculoAuth, body: CriaPixBody): Promise<PixResult> {
    try {
      return await this.client.criaPix(auth, body)
    } catch (err) {
      const status = (err as { status?: number }).status
      if (status != null && status >= 500) {
        return await this.client.criaPix(auth, body)
      }
      throw err
    }
  }
}
