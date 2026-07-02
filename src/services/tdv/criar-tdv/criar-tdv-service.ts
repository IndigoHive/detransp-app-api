import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV, CodigoOrigemTDV } from '../../../clients/detran-sp-service-now/tdv/types'

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

  async run (accessToken: string, cpfVendedor: string, nomeVendedor: string, emailVendedor: string, input: CriarTdvInput): Promise<CriarTdvResult> {
    const enderecoResult = await this.client.buscaEndereco(accessToken, input.cepComprador)
    const endereco = enderecoResult?.result

    const createResult = await this.client.criaTdv(accessToken, {
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

    await this.client.atualizaTdv(accessToken, codigoTransferencia, {
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
      tipoProvaVidaVendedor: '2'
    })

    await this.client.atualizaTdv(accessToken, codigoTransferencia, {
      estado: CodigoEstadoTDV.ATPVE_CRIADA,
      codigoProvaVidaVendedor: input.codigoProvaVidaVendedor,
      tipoProvaVidaVendedor: '2'
    })

    return { codigo: codigoTransferencia }
  }
}
