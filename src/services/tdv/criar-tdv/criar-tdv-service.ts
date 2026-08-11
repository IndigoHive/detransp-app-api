import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV, CodigoOrigemTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken, extractNameFromToken, extractEmailFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type CriarTdvInput = {
  placaVeiculo: string
  renavamVeiculo: string
}

export type CriarTdvResult = {
  codigo: string
}

// Creates the TDV as soon as the seller passes the vehicle eligibility check (state 1,
// VEICULO_SELECIONADO) — before facial liveness or any buyer/sale data exists. Buyer and
// sale data are informed later, at their own steps (see InformarDadosVendaService), so a
// dropped connection here doesn't force the seller to redo the whole form: reopening the
// app finds the TDV already created and resumes from there.
export class CriarTdvService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
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
      return { codigo: tdvAtiva.codigoTransferenciaVeiculo }
    }

    const createResult = await this.client.criaTdv(auth, {
      codigoRenavamVeiculo: input.renavamVeiculo,
      placaVeiculo: input.placaVeiculo,
      nomeVendedor,
      emailVendedor,
      codigoVendedor: cpfVendedor,
      origem: CodigoOrigemTDV.TDV
    })

    const codigo = createResult?.result?.codigoTransferenciaVeiculo
    if (!codigo) {
      throw new Error('Falha ao criar transferência')
    }

    return { codigo }
  }
}
