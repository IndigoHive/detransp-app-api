import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import type { CodigoOrigemComunicacaoVendaVeiculo, CodigoOrigemTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

type CompraVehicle = {
  id: string
  title: string
  plate: string
  licensingStatus: string
  licensingExpirationDate: string
  type: string
  brandModel: string
  renavam: string
  lastLicensing: string
  yearFab: string
  yearMod: string
  codigoTransferencia: string
  origem?: CodigoOrigemTDV
  origemComunicacaoVendaVeiculo?: CodigoOrigemComunicacaoVendaVeiculo
}

export type ConsultaComprasResult = {
  vehicles: CompraVehicle[]
} | {
  vehicles: []
  showSnackbar: {
    variant: string
    title: string
    description: string
  }
}

export class ConsultaComprasService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined): Promise<ConsultaComprasResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const result = await this.client.listaTdvs(auth, {
      ativa: 'true',
      codigoComprador: cpf
    })

    if (!result?.result) {
      return { vehicles: [] }
    }

    const withCodigo = result.result.filter((tdv) => !!tdv.codigoTransferenciaVeiculo?.trim())
    const skippedWithoutCodigo = result.result.length - withCodigo.length

    const vehicles = withCodigo.map((tdv, index) => {
      const codigoTransferencia = tdv.codigoTransferenciaVeiculo?.trim() ?? ''
      return {
        id: String(index + 1),
        title: tdv.descricaoMarcaVeiculo ?? '',
        plate: tdv.placaVeiculo ?? '',
        licensingStatus: 'PENDENTE',
        licensingExpirationDate: '',
        type: 'Passeio',
        brandModel: tdv.descricaoMarcaVeiculo ?? '',
        renavam: tdv.codigoRenavamVeiculo ?? '',
        lastLicensing: '',
        yearFab: '',
        yearMod: '',
        codigoTransferencia,
        ...(tdv.origem !== undefined ? { origem: tdv.origem } : {}),
        ...(tdv.origemComunicacaoVendaVeiculo !== undefined ? { origemComunicacaoVendaVeiculo: tdv.origemComunicacaoVendaVeiculo } : {})
      }
    })

    if (vehicles.length === 0 && skippedWithoutCodigo > 0) {
      return {
        vehicles: [],
        showSnackbar: {
          variant: 'error',
          title: 'Erro',
          description: 'Nenhuma transferência ativa válida encontrada para este CPF'
        }
      }
    }

    return { vehicles }
  }
}
