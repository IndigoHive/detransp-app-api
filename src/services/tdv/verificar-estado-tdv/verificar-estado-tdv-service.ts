import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import type { BuscaTdvResultData, ListaTdvsResultData } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

type VehicleData = {
  id: string
  plate: string
  title: string
  licensingStatus: string
  brandModel: string
  licensingExpirationDate: string
  renavam: string
  lastLicensing: string
  yearFab: string
  yearMod: string
}

function buildVehicleData (data: BuscaTdvResultData | undefined, fallback: ListaTdvsResultData): VehicleData {
  return {
    id: '1',
    plate: data?.placaVeiculo ?? fallback.placaVeiculo ?? '',
    title: data?.descricaoMarcaVeiculo ?? fallback.descricaoMarcaVeiculo ?? '',
    licensingStatus: 'REGULAR',
    brandModel: data?.descricaoMarcaVeiculo ?? fallback.descricaoMarcaVeiculo ?? '',
    licensingExpirationDate: '',
    renavam: data?.codigoRenavamVeiculo ?? fallback.codigoRenavamVeiculo ?? '',
    lastLicensing: '',
    yearFab: '',
    yearMod: ''
  }
}

export type VerificarEstadoTdvResult = {
  proximaAcao:
    | 'nova_tdv'
    | 'comprador'
    | 'vendedor_2'
    | 'comprador_2'
    | 'pagamento_confirmado'
    | 'concluido'
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
    const auth = { token, cpf }

    // Check if user has active TDVs as seller
    const tdvsAsVendedor = await this.client.listaTdvs(auth, {
      ativa: 'true',
      codigoVendedor: cpf
    })

    // ServiceNow's `ativa` field is the string "1"/"0", not "true"/"false" — the ?ativa=true
    // query param already filters server-side, so estado is the only client-side check needed.
    const activeSeller = tdvsAsVendedor?.result?.find(
      tdv => tdv.estado !== CodigoEstadoTDV.TRANSFERENCIA_CANCELADA
    )

    if (activeSeller) {
      const estado = activeSeller.estado

      // Seller needs to sign (buyer already signed)
      if (estado === CodigoEstadoTDV.ATPVE_ASSINADA_COMPRADOR) {
        const codigo = activeSeller.codigoTransferenciaVeiculo ?? ''
        const tdvDetails = await this.client.buscaTdv(auth, codigo)
        const data = tdvDetails?.result

        return {
          proximaAcao: 'vendedor_2',
          vehicle: buildVehicleData(data, activeSeller),
          nomeComprador: data?.nomeComprador ?? activeSeller.nomeComprador ?? '',
          codigoTransferencia: codigo
        }
      }
    }

    // Check if user has active TDVs as buyer
    const tdvsAsComprador = await this.client.listaTdvs(auth, {
      ativa: 'true',
      codigoComprador: cpf
    })

    const activeBuyer = tdvsAsComprador?.result?.find(
      tdv => tdv.estado !== CodigoEstadoTDV.TRANSFERENCIA_CANCELADA
    )

    if (activeBuyer) {
      const estado = activeBuyer.estado

      // Buyer needs to confirm purchase (ATPV-e created by seller)
      if (estado === CodigoEstadoTDV.ATPVE_CRIADA) {
        return {
          proximaAcao: 'comprador',
          codigoTransferencia: activeBuyer.codigoTransferenciaVeiculo ?? '',
          vehicles: [{
            plate: activeBuyer.placaVeiculo ?? '',
            brandModel: activeBuyer.descricaoMarcaVeiculo ?? '',
            renavam: activeBuyer.codigoRenavamVeiculo ?? '',
            codigoTransferencia: activeBuyer.codigoTransferenciaVeiculo ?? ''
          }]
        }
      }

      // Buyer needs to pay (seller already signed, communication generated)
      if (estado === CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA) {
        const codigo = activeBuyer.codigoTransferenciaVeiculo ?? ''
        const tdvDetails = await this.client.buscaTdv(auth, codigo)
        const data = tdvDetails?.result

        return {
          proximaAcao: 'comprador_2',
          codigoTransferencia: codigo,
          vehicle: buildVehicleData(data, activeBuyer)
        }
      }

      // Buyer already paid — waiting for the transfer to be finalized
      if (estado === CodigoEstadoTDV.TAXA_SERVICO_PAGA) {
        const codigo = activeBuyer.codigoTransferenciaVeiculo ?? ''
        const tdvDetails = await this.client.buscaTdv(auth, codigo)
        const data = tdvDetails?.result

        return {
          proximaAcao: 'pagamento_confirmado',
          codigoTransferencia: codigo,
          nomeComprador: data?.nomeComprador ?? activeBuyer.nomeComprador ?? '',
          vehicle: buildVehicleData(data, activeBuyer)
        }
      }

      // Transfer fully concluded
      if (estado === CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA) {
        const codigo = activeBuyer.codigoTransferenciaVeiculo ?? ''
        const tdvDetails = await this.client.buscaTdv(auth, codigo)
        const data = tdvDetails?.result

        return {
          proximaAcao: 'concluido',
          codigoTransferencia: codigo,
          nomeComprador: data?.nomeComprador ?? activeBuyer.nomeComprador ?? '',
          vehicle: buildVehicleData(data, activeBuyer)
        }
      }
    }

    return { proximaAcao: 'nova_tdv' }
  }
}
