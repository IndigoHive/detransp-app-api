import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'
import type { IAnalyticsService } from '../../analytics'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
  analyticsService: IAnalyticsService
}

export type ConfirmarIntencaoVendaInput = {
  codigoTransferencia: string
  codigoProvaVidaVendedor: string
}

export type ConfirmarIntencaoVendaResult = Record<string, never>

// Advances the TDV to state 3 (ATPVE_CRIADA) — generating the ATPV-e — only when the seller
// taps the final confirmation button, matching what that screen tells them will happen.
export class ConfirmarIntencaoVendaService {
  private readonly client: DetranSpServiceNowTdvClient
  private readonly analyticsService: IAnalyticsService

  constructor ({ detranSpServiceNowTdv, analyticsService }: Dependencies) {
    this.client = detranSpServiceNowTdv
    this.analyticsService = analyticsService
  }

  async run (authorizationHeader: string | undefined, input: ConfirmarIntencaoVendaInput): Promise<ConfirmarIntencaoVendaResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    // Idempotency guard: only advance from the exact prior state. If the seller (or a
    // retry/resume) calls this again after the TDV already moved past DADOS_VENDA_INFORMADOS,
    // skip the mutation instead of re-sending a backward/duplicate transition.
    const tdvAtual = (await this.client.buscaTdv(auth, input.codigoTransferencia))?.result

    if (tdvAtual?.estado === CodigoEstadoTDV.DADOS_VENDA_INFORMADOS) {
      await this.client.atualizaTdv(auth, input.codigoTransferencia, {
        estado: CodigoEstadoTDV.ATPVE_CRIADA,
        codigoProvaVidaVendedor: input.codigoProvaVidaVendedor,
        tipoProvaVidaVendedor: '2' // LIVENESS
      })

      this.analyticsService.capture(cpf, 'tdv:atpve_create', {
        $insert_id: this.analyticsService.createInsertId(`tdv:atpve_create:${input.codigoTransferencia}`)
      })
    }

    return {}
  }
}
