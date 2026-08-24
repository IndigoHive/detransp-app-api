import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import type {
  CodigoEstadoTDV,
  CodigoOrigemComunicacaoVendaVeiculo,
  CodigoOrigemTDV
} from '../../../clients/detran-sp-service-now/tdv/types'
import { formatCurrency } from '../../../utils/currency'
import { formatCep, formatCpf } from '../../../utils/format-document'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'
import {
  displayOrNaoInformado,
  formatEnderecoComprador
} from '../comprador-display-fields'
import { acaoComoComprador, type ProximaAcaoComprador } from '../proxima-acao-comprador'

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
  'kmVistoriadaVeiculo',
  'valorVendaVeiculo'
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
  proximaAcao: ProximaAcaoComprador
  nomeComprador: string
  nomeVendedor: string
  descricaoCorVeiculo: string
  ativa?: 'true' | 'false' | '1' | '0'
  estado?: CodigoEstadoTDV
  origem?: CodigoOrigemTDV
  origemComunicacaoVendaVeiculo?: CodigoOrigemComunicacaoVendaVeiculo
  descricaoMarcaVeiculo?: string
  codigoComprador?: string
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
  valorVenda?: string
  quilometragem?: string
  enderecoComprador?: string
}

export type ConsultaComprasResult = {
  vehicles: CompraVehicle[]
}

// "MARIA COMPRADORA TESTE" -> "Maria" — greeting screens only use the first
// name; the full nomeComprador value is still used as-is elsewhere
// (declarations, seller-facing identity confirmation).
function firstName (fullName: string): string {
  const [first] = fullName.trim().split(/\s+/)
  if (!first) return ''
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

function trimField (value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function formatNumericDisplay (value: string | undefined, format: (n: number) => string): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? format(n) : trimmed
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

    // Only list purchases the buyer can actually act on right now — a TDV still waiting on
    // the seller has nothing for this screen to route into once picked.
    const vehicles = result.result.flatMap((tdv, index) => {
      const proximaAcao = acaoComoComprador(tdv.estado)
      if (!proximaAcao) return []

      const codigoTransferencia = trimField(tdv.codigoTransferenciaVeiculo) ?? ''
      const plate = trimField(tdv.placaVeiculo) ?? ''
      const renavam = trimField(tdv.codigoRenavamVeiculo) ?? ''
      const id = codigoTransferencia || (plate && renavam ? `${plate}-${renavam}` : String(index + 1))
      const enderecoComprador = displayOrNaoInformado(formatEnderecoComprador(tdv))
      const chassiVeiculo = trimField(tdv.chassiVeiculo)
      const kmVeiculo = trimField(tdv.kmVeiculo)
      const kmVistoriadaVeiculo = trimField(tdv.kmVistoriadaVeiculo) ?? kmVeiculo
      const valorVenda = displayOrNaoInformado(
        formatNumericDisplay(trimField(tdv.valorVendaVeiculo), formatCurrency)
      )
      const quilometragem = displayOrNaoInformado(
        formatNumericDisplay(kmVeiculo, n => n.toLocaleString('pt-BR'))
      )
      const descricaoMarcaVeiculo = trimField(tdv.descricaoMarcaVeiculo)
      const descricaoCorVeiculo = trimField(tdv.descricaoCorVeiculo) ?? ''
      const codigoCompradorRaw = trimField(tdv.codigoComprador)
      const codigoComprador = displayOrNaoInformado(
        codigoCompradorRaw ? formatCpf(codigoCompradorRaw) : undefined
      )
      const nomeVendedor = trimField(tdv.nomeVendedor) ?? ''
      const codigoVendedor = trimField(tdv.codigoVendedor)
      const nomeMunicipioVeiculo = trimField(tdv.nomeMunicipioVeiculo)
      const nomeMunicipioComprador = trimField(tdv.nomeMunicipioComprador)
      const logradouroComprador = trimField(tdv.logradouroComprador)
      const numeroComprador = trimField(tdv.numeroComprador)
      const complementoComprador = trimField(tdv.complementoComprador)
      const bairroComprador = trimField(tdv.bairroComprador)
      const ufComprador = trimField(tdv.ufComprador)
      const cepCompradorRaw = trimField(tdv.cepComprador)
      const cepComprador = cepCompradorRaw ? formatCep(cepCompradorRaw) : undefined

      return [{
        id,
        title: descricaoMarcaVeiculo ?? '',
        plate,
        licensingStatus: 'PENDENTE',
        licensingExpirationDate: '',
        type: 'Passeio',
        brandModel: displayOrNaoInformado(descricaoMarcaVeiculo),
        renavam,
        lastLicensing: '',
        yearFab: '',
        yearMod: '',
        codigoTransferencia,
        proximaAcao,
        nomeComprador: displayOrNaoInformado(firstName(tdv.nomeComprador ?? '') || undefined),
        nomeVendedor,
        descricaoCorVeiculo,
        ...(tdv.ativa != null ? { ativa: tdv.ativa } : {}),
        ...(tdv.estado != null ? { estado: tdv.estado } : {}),
        ...(tdv.origem != null ? { origem: tdv.origem } : {}),
        ...(tdv.origemComunicacaoVendaVeiculo != null
          ? { origemComunicacaoVendaVeiculo: tdv.origemComunicacaoVendaVeiculo }
          : {}),
        ...(descricaoMarcaVeiculo ? { descricaoMarcaVeiculo } : {}),
        codigoComprador,
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
        valorVenda,
        quilometragem,
        enderecoComprador
      }]
    })

    return { vehicles }
  }
}
