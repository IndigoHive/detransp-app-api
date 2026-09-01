import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'
import type { IAnalyticsService } from '../../analytics'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
  analyticsService: IAnalyticsService
}

export type CancelarTdvInput = {
  codigoTransferencia: string
}

export type CancelarTdvResult = {
  success: boolean
}

export class CancelarTdvService {
  private readonly client: DetranSpServiceNowTdvClient
  private readonly analyticsService: IAnalyticsService

  constructor ({ detranSpServiceNowTdv, analyticsService }: Dependencies) {
    this.client = detranSpServiceNowTdv
    this.analyticsService = analyticsService
  }

  async run (authorizationHeader: string | undefined, input: CancelarTdvInput): Promise<CancelarTdvResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const codigoTransferencia = input.codigoTransferencia?.trim() ?? ''

    // Nothing to cancel: on TDV 2.0/3.0/6.0 the buyer can back out from the confirmation screen
    // while the comunicação de venda is still just that — there is no TDV behind it yet.
    if (!codigoTransferencia) {
      return { success: true }
    }

    const tdv = await this.client.buscaTdv(auth, codigoTransferencia)

    // Already cancelled: a repeated call (back button, retry after a timeout) must not turn into
    // an invalid-transition error on the way out.
    if (tdv?.result?.estado === CodigoEstadoTDV.TRANSFERENCIA_CANCELADA) {
      return { success: true }
    }

    await this.client.atualizaTdv(auth, codigoTransferencia, {
      estado: CodigoEstadoTDV.TRANSFERENCIA_CANCELADA,
      ativa: 'false'
    })

    this.analyticsService.capture(cpf, 'tdv:cancel', {
      $insert_id: this.analyticsService.createInsertId(`tdv:cancel:${codigoTransferencia}`)
    })

    return { success: true }
  }
}
