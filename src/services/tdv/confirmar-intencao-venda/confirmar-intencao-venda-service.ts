import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ConfirmarIntencaoVendaInput = {
  codigoTransferencia: string
  codigoProvaVidaVendedor: string
}

export type ConfirmarIntencaoVendaResult = {
  codigo: string
}

// Counterpart to CriarTdvService for RENAVE-origin TDVs: ServiceNow already created the
// record (buyer/sale data included) from a dealer's SERPRO purchase intention, so the
// seller only needs to complete liveness and advance straight to ATPVE_CRIADA — no criaTdv
// call, no manual buyer/sale data entry.
export class ConfirmarIntencaoVendaService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: ConfirmarIntencaoVendaInput): Promise<ConfirmarIntencaoVendaResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    await this.client.atualizaTdv(auth, input.codigoTransferencia, {
      estado: CodigoEstadoTDV.ATPVE_CRIADA,
      codigoProvaVidaVendedor: input.codigoProvaVidaVendedor,
      tipoProvaVidaVendedor: '2' // LIVENESS
    })

    return { codigo: input.codigoTransferencia }
  }
}
