import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import {
  CodigoEstadoTDV,
  CodigoOrigemTDV,
  type ListaTdvsResultData
} from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken, extractNameFromToken, extractEmailFromToken } from '../../../utils/token'
import { compradorDisplayFieldsFromTdv, chassiVeiculoFrom, type CompradorDisplayFields } from '../comprador-display-fields'
import type { IAnalyticsService } from '../../analytics'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
  analyticsService: IAnalyticsService
}

type Auth = { token: string, cpf: string }

export type CriarTdvInput = {
  placaVeiculo: string
  renavamVeiculo: string
  chassiVeiculo?: string
}

export type CriarTdvResult = {
  codigo: string
  origem?: CodigoOrigemTDV
} & CompradorDisplayFields

// Creates the TDV as soon as the seller passes the vehicle eligibility check (state 1,
// VEICULO_SELECIONADO) — before facial liveness or any buyer/sale data exists. Buyer and
// sale data are informed later, at their own steps (see InformarDadosVendaService), so a
// dropped connection here doesn't force the seller to redo the whole form: reopening the
// app finds the TDV already created and resumes from there.
export class CriarTdvService {
  private readonly client: DetranSpServiceNowTdvClient
  private readonly analyticsService: IAnalyticsService

  constructor ({ detranSpServiceNowTdv, analyticsService }: Dependencies) {
    this.client = detranSpServiceNowTdv
    this.analyticsService = analyticsService
  }

  async run (authorizationHeader: string | undefined, input: CriarTdvInput): Promise<CriarTdvResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpfVendedor = extractCpfFromToken(token)
    const nomeVendedor = extractNameFromToken(token)
    const emailVendedor = extractEmailFromToken(token)
    const auth = { token, cpf: cpfVendedor }

    // Reuse an existing active TDV for this vehicle instead of failing with ATPVeExistenteError
    const tdvsAtivas = await this.client.listaTdvs(auth, {
      ativa: 'true',
      codigoVendedor: cpfVendedor,
      placaVeiculo: input.placaVeiculo
    })
    const tdvAtiva = tdvsAtivas?.result?.find(tdv => tdv.estado !== CodigoEstadoTDV.TRANSFERENCIA_CANCELADA)

    if (tdvAtiva?.codigoTransferenciaVeiculo) {
      return this.toResult(tdvAtiva.codigoTransferenciaVeiculo, tdvAtiva, input)
    }

    const createResult = await this.client.criaTdv(auth, {
      codigoRenavamVeiculo: input.renavamVeiculo,
      placaVeiculo: input.placaVeiculo,
      nomeVendedor,
      emailVendedor,
      codigoVendedor: cpfVendedor,
      origem: CodigoOrigemTDV.TDV,
      ...(input.chassiVeiculo?.trim() ? { chassiVeiculo: input.chassiVeiculo.trim() } : {})
    })

    const codigo = createResult?.result?.codigoTransferenciaVeiculo
    if (!codigo) {
      throw new Error('Falha ao criar transferência')
    }

    this.analyticsService.capture(cpfVendedor, 'tdv:create', {
      $insert_id: this.analyticsService.createInsertId(`tdv:create:${codigo}`)
    })

    const created = await this.findCreatedTdv(auth, cpfVendedor, input)
    return this.toResult(codigo, created, input)
  }

  private async findCreatedTdv (
    auth: Auth,
    cpfVendedor: string,
    input: CriarTdvInput
  ): Promise<ListaTdvsResultData | undefined> {
    const listed = await this.client.listaTdvs(auth, {
      ativa: 'true',
      codigoVendedor: cpfVendedor,
      placaVeiculo: input.placaVeiculo
    }).catch(() => undefined)

    return listed?.result?.find(tdv =>
      tdv.estado !== CodigoEstadoTDV.TRANSFERENCIA_CANCELADA
      && (
        tdv.placaVeiculo === input.placaVeiculo
        || tdv.codigoRenavamVeiculo === input.renavamVeiculo
      )
    )
  }

  private toResult (
    codigo: string,
    tdv: ListaTdvsResultData | undefined,
    input: CriarTdvInput
  ): CriarTdvResult {
    const display = tdv ? compradorDisplayFieldsFromTdv(tdv) : {}
    const chassiVeiculo = chassiVeiculoFrom(tdv, input)

    return {
      codigo,
      ...(tdv?.origem != null ? { origem: tdv.origem } : {}),
      ...display,
      ...(chassiVeiculo ? { chassiVeiculo } : {})
    }
  }
}
