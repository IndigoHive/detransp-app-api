import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import type {
  CodigoEstadoTDV,
  CodigoOrigemComunicacaoVendaVeiculo,
  CodigoOrigemTDV,
  ListaTdvsResultData
} from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

const LISTA_COMPRAS_CAMPOS = [
  'placaVeiculo',
  'descricaoMarcaVeiculo',
  'descricaoCorVeiculo',
  'nomeComprador',
  'codigoTransferenciaVeiculo',
  'origemComunicacaoVendaVeiculo',
  'origem',
  'ativa',
  'estado',
  'codigoRenavamVeiculo',
  'codigoComprador',
  'nomeVendedor',
  'codigoVendedor',
  'nomeMunicipioVeiculo',
  'nomeMunicipioComprador',
  'logradouroComprador',
  'numeroComprador',
  'complementoComprador',
  'bairroComprador',
  'ufComprador',
  'cepComprador',
  'chassiVeiculo',
  'kmVeiculo',
  'kmVistoriadaVeiculo'
].join(',')

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
  logradouroComprador?: string
  numeroComprador?: string
  complementoComprador?: string
  bairroComprador?: string
  ufComprador?: string
  cepComprador?: string
  chassiVeiculo?: string
  kmVeiculo?: string
  kmVistoriadaVeiculo?: string
  descricaoCorVeiculo?: string
  enderecoComprador?: string
}

export type ConsultaComprasResult = {
  vehicles: CompraVehicle[]
}

function trimField (value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function formatEnderecoComprador (tdv: ListaTdvsResultData): string | undefined {
  const logradouro = trimField(tdv.logradouroComprador)
  const numero = trimField(tdv.numeroComprador)
  const complemento = trimField(tdv.complementoComprador)
  const bairro = trimField(tdv.bairroComprador)
  const municipio = trimField(tdv.nomeMunicipioComprador)
  const uf = trimField(tdv.ufComprador)
  const cep = trimField(tdv.cepComprador)
  const municipioUf = municipio
    ? (uf ? `${municipio} - ${uf}` : municipio)
    : uf

  const endereco = [logradouro, numero, complemento, bairro, municipioUf, cep]
    .filter(Boolean)
    .join(', ')

  return endereco || undefined
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
      codigoComprador: cpf,
      campos: LISTA_COMPRAS_CAMPOS
    })

    if (!result?.result) {
      return { vehicles: [] }
    }

    const vehicles = result.result.map((tdv, index) => {
      const codigoTransferencia = trimField(tdv.codigoTransferenciaVeiculo) ?? ''
      const plate = trimField(tdv.placaVeiculo) ?? ''
      const renavam = trimField(tdv.codigoRenavamVeiculo) ?? ''
      const id = codigoTransferencia || (plate && renavam ? `${plate}-${renavam}` : String(index + 1))
      const enderecoComprador = formatEnderecoComprador(tdv)
      const chassiVeiculo = trimField(tdv.chassiVeiculo)
      const kmVeiculo = trimField(tdv.kmVeiculo)
      const kmVistoriadaVeiculo = trimField(tdv.kmVistoriadaVeiculo) ?? kmVeiculo
      const descricaoMarcaVeiculo = trimField(tdv.descricaoMarcaVeiculo)
      const descricaoCorVeiculo = trimField(tdv.descricaoCorVeiculo)
      const codigoComprador = trimField(tdv.codigoComprador)
      const nomeComprador = trimField(tdv.nomeComprador)
      const nomeVendedor = trimField(tdv.nomeVendedor)
      const codigoVendedor = trimField(tdv.codigoVendedor)
      const nomeMunicipioVeiculo = trimField(tdv.nomeMunicipioVeiculo)
      const nomeMunicipioComprador = trimField(tdv.nomeMunicipioComprador)
      const logradouroComprador = trimField(tdv.logradouroComprador)
      const numeroComprador = trimField(tdv.numeroComprador)
      const complementoComprador = trimField(tdv.complementoComprador)
      const bairroComprador = trimField(tdv.bairroComprador)
      const ufComprador = trimField(tdv.ufComprador)
      const cepComprador = trimField(tdv.cepComprador)

      return {
        id,
        title: descricaoMarcaVeiculo ?? '',
        plate,
        licensingStatus: 'PENDENTE',
        licensingExpirationDate: '',
        type: 'Passeio',
        brandModel: descricaoMarcaVeiculo ?? '',
        renavam,
        lastLicensing: '',
        yearFab: '',
        yearMod: '',
        codigoTransferencia,
        ...(tdv.ativa != null ? { ativa: tdv.ativa } : {}),
        ...(tdv.estado != null ? { estado: tdv.estado } : {}),
        ...(tdv.origem != null ? { origem: tdv.origem } : {}),
        ...(tdv.origemComunicacaoVendaVeiculo != null
          ? { origemComunicacaoVendaVeiculo: tdv.origemComunicacaoVendaVeiculo }
          : {}),
        ...(descricaoMarcaVeiculo ? { descricaoMarcaVeiculo } : {}),
        ...(codigoComprador ? { codigoComprador } : {}),
        ...(nomeComprador ? { nomeComprador } : {}),
        ...(nomeVendedor ? { nomeVendedor } : {}),
        ...(codigoVendedor ? { codigoVendedor } : {}),
        ...(nomeMunicipioVeiculo ? { nomeMunicipioVeiculo } : {}),
        ...(nomeMunicipioComprador ? { nomeMunicipioComprador } : {}),
        ...(logradouroComprador ? { logradouroComprador } : {}),
        ...(numeroComprador ? { numeroComprador } : {}),
        ...(complementoComprador ? { complementoComprador } : {}),
        ...(bairroComprador ? { bairroComprador } : {}),
        ...(ufComprador ? { ufComprador } : {}),
        ...(cepComprador ? { cepComprador } : {}),
        ...(chassiVeiculo ? { chassiVeiculo } : {}),
        ...(kmVeiculo ? { kmVeiculo } : {}),
        ...(kmVistoriadaVeiculo ? { kmVistoriadaVeiculo } : {}),
        ...(descricaoCorVeiculo ? { descricaoCorVeiculo } : {}),
        ...(enderecoComprador ? { enderecoComprador } : {})
      }
    })

    return { vehicles }
  }
}
