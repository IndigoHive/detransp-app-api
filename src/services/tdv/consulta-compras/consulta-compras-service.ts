import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import type {
  CodigoEstadoTDV,
  CodigoOrigemComunicacaoVendaVeiculo,
  CodigoOrigemTDV
} from '../../../clients/detran-sp-service-now/tdv/types'
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
  ativa?: 'true' | 'false' | '1' | '0'
  estado?: CodigoEstadoTDV
  origem?: CodigoOrigemTDV
  origemComunicacaoVendaVeiculo?: CodigoOrigemComunicacaoVendaVeiculo
  descricaoMarcaVeiculo?: string
  codigoComprador?: string
  nomeComprador?: string
  nomeVendedor?: string
  codigoVendedor?: string
  nomeMunicipioVeiculo?: string
  nomeMunicipioComprador?: string
  chassiVeiculo?: string
  kmVistoriadaVeiculo?: string
  numeroComprador?: string
}

export type ConsultaComprasResult = {
  vehicles: CompraVehicle[]
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

    const vehicles = result.result.map((tdv, index) => {
      const codigoTransferencia = tdv.codigoTransferenciaVeiculo?.trim() ?? ''
      const plate = tdv.placaVeiculo ?? ''
      const renavam = tdv.codigoRenavamVeiculo ?? ''
      const id = codigoTransferencia || (plate && renavam ? `${plate}-${renavam}` : String(index + 1))

      return {
        id,
        title: tdv.descricaoMarcaVeiculo ?? '',
        plate,
        licensingStatus: 'PENDENTE',
        licensingExpirationDate: '',
        type: 'Passeio',
        brandModel: tdv.descricaoMarcaVeiculo ?? '',
        renavam,
        lastLicensing: '',
        yearFab: '',
        yearMod: '',
        codigoTransferencia,
        ...(tdv.ativa !== undefined ? { ativa: tdv.ativa } : {}),
        ...(tdv.estado !== undefined ? { estado: tdv.estado } : {}),
        ...(tdv.origem !== undefined ? { origem: tdv.origem } : {}),
        ...(tdv.origemComunicacaoVendaVeiculo !== undefined
          ? { origemComunicacaoVendaVeiculo: tdv.origemComunicacaoVendaVeiculo }
          : {}),
        ...(tdv.descricaoMarcaVeiculo !== undefined
          ? { descricaoMarcaVeiculo: tdv.descricaoMarcaVeiculo }
          : {}),
        ...(tdv.codigoComprador !== undefined ? { codigoComprador: tdv.codigoComprador } : {}),
        ...(tdv.nomeComprador !== undefined ? { nomeComprador: tdv.nomeComprador } : {}),
        ...(tdv.nomeVendedor !== undefined ? { nomeVendedor: tdv.nomeVendedor } : {}),
        ...(tdv.codigoVendedor !== undefined ? { codigoVendedor: tdv.codigoVendedor } : {}),
        ...(tdv.nomeMunicipioVeiculo !== undefined
          ? { nomeMunicipioVeiculo: tdv.nomeMunicipioVeiculo }
          : {}),
        ...(tdv.nomeMunicipioComprador !== undefined
          ? { nomeMunicipioComprador: tdv.nomeMunicipioComprador }
          : {}),
        ...(tdv.chassiVeiculo?.trim() ? { chassiVeiculo: tdv.chassiVeiculo.trim() } : {}),
        ...(tdv.kmVistoriadaVeiculo?.trim()
          ? { kmVistoriadaVeiculo: tdv.kmVistoriadaVeiculo.trim() }
          : {}),
        ...(tdv.numeroComprador?.trim() ? { numeroComprador: tdv.numeroComprador.trim() } : {})
      }
    })

    return { vehicles }
  }
}
