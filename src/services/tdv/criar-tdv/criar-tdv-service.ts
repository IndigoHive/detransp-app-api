import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV, CodigoOrigemTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type CriarTdvInput = {
  renavam: string
  plate: string
  nomeVendedor: string
  emailVendedor: string
  cpfComprador: string
  nomeComprador: string
  emailComprador: string
  cepComprador: string
  bairroComprador: string
  logradouroComprador: string
  numeroComprador: string
  complementoComprador: string
  valorVenda: string
  km: string
  codigoProvaVidaVendedor: string
}

export type CriarTdvResult = {
  codigoTransferencia: string
}

export class CriarTdvService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: CriarTdvInput): Promise<CriarTdvResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpfVendedor = extractCpfFromToken(token)

    // Step 1: Create the TDV (state 1 - VEICULO_SELECIONADO)
    const createResult = await this.client.criaTdv(token, {
      codigoRenavamVeiculo: input.renavam,
      placaVeiculo: input.plate,
      nomeVendedor: input.nomeVendedor,
      emailVendedor: input.emailVendedor,
      codigoVendedor: cpfVendedor,
      origem: CodigoOrigemTDV.TDV
    })

    const codigoTransferencia = createResult?.result?.codigoTransferenciaVeiculo
    if (!codigoTransferencia) {
      throw new Error('Falha ao criar transferência')
    }

    // Step 2: Advance to state 2 (DADOS_VENDA_INFORMADOS)
    await this.client.atualizaTdv(token, codigoTransferencia, {
      estado: CodigoEstadoTDV.DADOS_VENDA_INFORMADOS,
      codigoComprador: input.cpfComprador,
      nomeComprador: input.nomeComprador,
      emailComprador: input.emailComprador,
      cepComprador: input.cepComprador,
      bairroComprador: input.bairroComprador,
      logradouroComprador: input.logradouroComprador,
      numeroComprador: input.numeroComprador,
      complementoComprador: input.complementoComprador,
      valorVendaVeiculo: input.valorVenda,
      kmVeiculo: input.km,
      codigoProvaVidaVendedor: input.codigoProvaVidaVendedor,
      tipoProvaVidaVendedor: '2' // LIVENESS
    })

    // Step 3: Advance to state 3 (ATPVE_CRIADA)
    await this.client.atualizaTdv(token, codigoTransferencia, {
      estado: CodigoEstadoTDV.ATPVE_CRIADA,
      codigoProvaVidaVendedor: input.codigoProvaVidaVendedor,
      tipoProvaVidaVendedor: '2' // LIVENESS
    })

    return { codigoTransferencia }
  }
}
