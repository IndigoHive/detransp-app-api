import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type VerificarEstadoTdvResult = {
  proximaAcao: 'nova_tdv' | 'comprador' | 'vendedor_2' | 'comprador_2' | 'concluido'
  vehicles?: Array<{
    plate: string
    brandModel: string
    renavam: string
    codigoTransferencia: string
  }>
  vehicle?: {
    plate: string
    brandModel: string
  }
  nomeComprador?: string
  codigoTransferencia?: string
}

export class VerificarEstadoTdvService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined): Promise<VerificarEstadoTdvResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)

    // Check if user has active TDVs as seller
    const tdvsAsVendedor = await this.client.listaTdvs(token, {
      ativa: 'true',
      codigoVendedor: cpf
    })

    const activeSeller = tdvsAsVendedor?.result?.find(
      tdv => tdv.ativa === 'true' && tdv.estado !== CodigoEstadoTDV.TRANSFERENCIA_CANCELADA
    )

    if (activeSeller) {
      const estado = activeSeller.estado

      // Seller needs to sign (buyer already signed)
      if (estado === CodigoEstadoTDV.ATPVE_ASSINADA_COMPRADOR) {
        return {
          proximaAcao: 'vendedor_2',
          vehicle: {
            plate: activeSeller.placaVeiculo ?? '',
            brandModel: activeSeller.descricaoMarcaVeiculo ?? ''
          },
          nomeComprador: activeSeller.nomeComprador ?? '',
          codigoTransferencia: activeSeller.codigoTransferenciaVeiculo ?? ''
        }
      }
    }

    // Check if user has active TDVs as buyer
    const tdvsAsComprador = await this.client.listaTdvs(token, {
      ativa: 'true',
      codigoComprador: cpf
    })

    const activeBuyer = tdvsAsComprador?.result?.find(
      tdv => tdv.ativa === 'true' && tdv.estado !== CodigoEstadoTDV.TRANSFERENCIA_CANCELADA
    )

    if (activeBuyer) {
      const estado = activeBuyer.estado

      // Buyer needs to confirm purchase (ATPV-e created by seller)
      if (estado === CodigoEstadoTDV.ATPVE_CRIADA) {
        return {
          proximaAcao: 'comprador',
          vehicles: [{
            plate: activeBuyer.placaVeiculo ?? '',
            brandModel: activeBuyer.descricaoMarcaVeiculo ?? '',
            renavam: activeBuyer.codigoRenavamVeiculo ?? '',
            codigoTransferencia: activeBuyer.codigoTransferenciaVeiculo ?? ''
          }]
        }
      }

      // Buyer needs to pay (seller already signed)
      if (
        estado === CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA ||
        estado === CodigoEstadoTDV.TAXA_SERVICO_PAGA
      ) {
        return {
          proximaAcao: 'comprador_2',
          codigoTransferencia: activeBuyer.codigoTransferenciaVeiculo ?? ''
        }
      }
    }

    return { proximaAcao: 'nova_tdv' }
  }
}
