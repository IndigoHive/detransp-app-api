import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

type VehicleData = {
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

export type VerificarEstadoTdvResult = {
  proximaAcao: 'nova_tdv' | 'comprador' | 'vendedor_2' | 'comprador_2' | 'concluido'
  vehicles?: Array<{
    plate: string
    brandModel: string
    renavam: string
    codigoTransferencia: string
  }>
  vehicle?: VehicleData
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
        const codigo = activeSeller.codigoTransferenciaVeiculo ?? ''
        const tdvDetails = await this.client.buscaTdv(token, codigo)
        const data = tdvDetails?.result

        return {
          proximaAcao: 'vendedor_2',
          vehicle: {
            id: '1',
            plate: data?.placaVeiculo ?? activeSeller.placaVeiculo ?? '',
            title: data?.descricaoMarcaVeiculo ?? activeSeller.descricaoMarcaVeiculo ?? '',
            status: 'REGULAR',
            brandModel: data?.descricaoMarcaVeiculo ?? activeSeller.descricaoMarcaVeiculo ?? '',
            licensingExpirationDate: '',
            renavam: data?.codigoRenavamVeiculo ?? activeSeller.codigoRenavamVeiculo ?? '',
            lastLicensing: '',
            yearFab: '',
            yearMod: ''
          },
          nomeComprador: data?.nomeComprador ?? activeSeller.nomeComprador ?? '',
          codigoTransferencia: codigo
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
        const codigo = activeBuyer.codigoTransferenciaVeiculo ?? ''
        const tdvDetails = await this.client.buscaTdv(token, codigo)
        const data = tdvDetails?.result

        return {
          proximaAcao: 'comprador_2',
          codigoTransferencia: codigo,
          vehicle: {
            id: '1',
            plate: data?.placaVeiculo ?? activeBuyer.placaVeiculo ?? '',
            title: data?.descricaoMarcaVeiculo ?? activeBuyer.descricaoMarcaVeiculo ?? '',
            status: 'REGULAR',
            brandModel: data?.descricaoMarcaVeiculo ?? activeBuyer.descricaoMarcaVeiculo ?? '',
            licensingExpirationDate: '',
            renavam: data?.codigoRenavamVeiculo ?? activeBuyer.codigoRenavamVeiculo ?? '',
            lastLicensing: '',
            yearFab: '',
            yearMod: ''
          }
        }
      }
    }

    return { proximaAcao: 'nova_tdv' }
  }
}
