import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken } from '../../../utils/token'

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

  async run (authorizationHeader: string | undefined, input: ConfirmarCompraInput): Promise<ConfirmarCompraResult> {
    const token = extractBearerToken(authorizationHeader)

    // Advance to state 4 (INTENCAO_COMPRA_CONFIRMADA)
    await this.client.atualizaTdv(token, input.codigoTransferencia, {
      estado: CodigoEstadoTDV.INTENCAO_COMPRA_CONFIRMADA,
      codigoProvaVidaComprador: input.codigoProvaVidaComprador,
      tipoProvaVidaComprador: '2' // LIVENESS
    })

    // Advance to state 5 (AUTODECLARACAO_RESIDENCIA_CONFIRMADA)
    // This prepares the TDV for ITI signing (state 5 → 6 by ITI callback)
    await this.client.atualizaTdv(token, input.codigoTransferencia, {
      estado: CodigoEstadoTDV.AUTODECLARACAO_RESIDENCIA_CONFIRMADA,
      codigoProvaVidaComprador: input.codigoProvaVidaComprador,
      tipoProvaVidaComprador: '2',
      confirmacaoAutodeclaracaoResidenciaComprador: 'true'
    })

    // Fetch the updated TDV to get buyer and vehicle data
    const tdv = await this.client.buscaTdv(token, input.codigoTransferencia)
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
