import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ConfirmarCompraInput = {
  codigoTransferencia: string
  codigoProvaVidaComprador: string
}

export type ConfirmarCompraResult = {
  nomeComprador: string
  cpfComprador: string
  enderecoComprador: string
  vehicle: {
    id: string
    plate: string
    title: string
    status: string
    brandModel: string
    licensingExpirationDate: string
    renavam: string
    lastLicensing: string
    yearFab: string
    yearMod: string
  }
}

export class ConfirmarCompraService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (accessToken: string, input: ConfirmarCompraInput): Promise<ConfirmarCompraResult> {
    await this.client.atualizaTdv(accessToken, input.codigoTransferencia, {
      estado: CodigoEstadoTDV.INTENCAO_COMPRA_CONFIRMADA,
      codigoProvaVidaComprador: input.codigoProvaVidaComprador,
      tipoProvaVidaComprador: '2'
    })

    await this.client.atualizaTdv(accessToken, input.codigoTransferencia, {
      estado: CodigoEstadoTDV.AUTODECLARACAO_RESIDENCIA_CONFIRMADA,
      codigoProvaVidaComprador: input.codigoProvaVidaComprador,
      tipoProvaVidaComprador: '2',
      confirmacaoAutodeclaracaoResidenciaComprador: 'true'
    })

    const tdv = await this.client.buscaTdv(accessToken, input.codigoTransferencia)
    const data = tdv?.result

    const enderecoComprador = [
      data?.logradouroComprador,
      data?.numeroComprador,
      data?.bairroComprador,
      data?.nomeMunicipioComprador ? `${data.nomeMunicipioComprador} - ${data.ufComprador ?? 'SP'}` : undefined
    ].filter(Boolean).join(', ')

    return {
      nomeComprador: data?.nomeComprador ?? '',
      cpfComprador: data?.codigoComprador ?? '',
      enderecoComprador,
      vehicle: {
        id: '1',
        plate: data?.placaVeiculo ?? '',
        title: data?.descricaoMarcaVeiculo ?? '',
        status: 'REGULAR',
        brandModel: data?.descricaoMarcaVeiculo ?? '',
        licensingExpirationDate: '',
        renavam: data?.codigoRenavamVeiculo ?? '',
        lastLicensing: '',
        yearFab: '',
        yearMod: ''
      }
    }
  }
}
