import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV, CodigoOrigemTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken, extractNameFromToken, extractEmailFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type CriarTdvInput = {
  placaVeiculo: string
  renavamVeiculo: string
  cpfComprador: string
  nomeComprador: string
  emailComprador: string
  cepComprador: string
  valorVenda: string
  quilometragem: string
  codigoProvaVidaVendedor: string
}

export type CriarTdvResult = {
  codigo: string
}

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

    // Fetch buyer address details from CEP
    const enderecoResult = await this.client.buscaEndereco(auth, input.cepComprador)
    const endereco = enderecoResult?.result

    // Step 1: Create the TDV (state 1 - VEICULO_SELECIONADO)
    const createResult = await this.client.criaTdv(auth, {
      codigoRenavamVeiculo: input.renavamVeiculo,
      placaVeiculo: input.placaVeiculo,
      nomeVendedor,
      emailVendedor,
      codigoVendedor: cpfVendedor,
      origem: CodigoOrigemTDV.TDV
    })

    const codigoTransferencia = createResult?.result?.codigoTransferenciaVeiculo
    if (!codigoTransferencia) {
      throw new Error('Falha ao criar transferência')
    }

    // Step 2: Advance to state 2 (DADOS_VENDA_INFORMADOS)
    await this.client.atualizaTdv(auth, codigoTransferencia, {
      estado: CodigoEstadoTDV.DADOS_VENDA_INFORMADOS,
      codigoComprador: input.cpfComprador,
      nomeComprador: input.nomeComprador,
      emailComprador: input.emailComprador,
      cepComprador: input.cepComprador,
      bairroComprador: endereco?.bairro ?? '',
      logradouroComprador: endereco?.logradouro ?? endereco?.endereco ?? '',
      numeroComprador: '',
      complementoComprador: endereco?.complemento ?? '',
      valorVendaVeiculo: input.valorVenda,
      kmVeiculo: input.quilometragem,
      codigoProvaVidaVendedor: input.codigoProvaVidaVendedor,
      tipoProvaVidaVendedor: '2' // LIVENESS
    })

    // Step 3: Advance to state 3 (ATPVE_CRIADA)
    await this.client.atualizaTdv(auth, codigoTransferencia, {
      estado: CodigoEstadoTDV.ATPVE_CRIADA,
      codigoProvaVidaVendedor: input.codigoProvaVidaVendedor,
      tipoProvaVidaVendedor: '2' // LIVENESS
    })

    return { codigo: codigoTransferencia }
  }
}
