import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import {
  CodigoOrigemTDV,
  type CodigoEstadoTDV,
  type CodigoOrigemComunicacaoVendaVeiculo
} from '../../../clients/detran-sp-service-now/tdv/types'
import { formatCurrency } from '../../../utils/currency'
import { firstName } from '../../../utils/first-name'
import { formatCep, formatCpfCnpj } from '../../../utils/format-document'
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
  'emailVendedor',
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
  proximaAcao?: ProximaAcaoComprador
  nomeComprador: string
  nomeVendedor: string
  emailVendedor?: string
  descricaoCorVeiculo: string
  ativa?: 'true' | 'false' | '1' | '0'
  estado?: CodigoEstadoTDV
  origem?: CodigoOrigemTDV
  origemComunicacaoVendaVeiculo?: CodigoOrigemComunicacaoVendaVeiculo
  descricaoMarcaVeiculo?: string
  codigoComprador?: string
  cpfComprador: string
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

// TDV 2.0 (e-Notariado/CDT), 3.0 (Renave saída) and 6.0 (Cartório/SEFAZ): the sale was
// registered outside the app, so the listed record is a comunicação de venda that may not
// have a TDV — and therefore no estado — behind it yet.
const ORIGENS_COMUNICACAO_VENDA_EXTERNA: readonly string[] = [
  CodigoOrigemTDV.E_NOTARIADO,
  CodigoOrigemTDV.CDT,
  CodigoOrigemTDV.RENAVE,
  CodigoOrigemTDV.CARTORIO
]

function isComunicacaoVendaExterna (origem: CodigoOrigemTDV | null | undefined): boolean {
  return origem != null && ORIGENS_COMUNICACAO_VENDA_EXTERNA.includes(origem)
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
    // the seller has nothing for this screen to route into once picked. Comunicações de
    // venda registered outside the app are the exception: the buyer's whole journey is to
    // pick one and drive it, so they must be listed even before a TDV exists for them (no
    // estado yet) — the flow routes those by origem, never by proximaAcao.
    const vehicles = result.result.flatMap((tdv, index) => {
      const proximaAcao = acaoComoComprador(tdv.estado)
      if (!proximaAcao && !isComunicacaoVendaExterna(tdv.origem)) return []

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
      const descricaoCorVeiculo = displayOrNaoInformado(trimField(tdv.descricaoCorVeiculo))
      const codigoComprador = trimField(tdv.codigoComprador)
      const cpfComprador = displayOrNaoInformado(
        codigoComprador ? formatCpfCnpj(codigoComprador) : undefined
      )
      const nomeVendedor = trimField(tdv.nomeVendedor) ?? ''
      const codigoVendedor = trimField(tdv.codigoVendedor)
      const emailVendedor = trimField(tdv.emailVendedor)
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
        ...(proximaAcao ? { proximaAcao } : {}),
        nomeComprador: displayOrNaoInformado(firstName(tdv.nomeComprador ?? '') || undefined),
        nomeVendedor,
        ...(emailVendedor ? { emailVendedor } : {}),
        descricaoCorVeiculo,
        ...(tdv.ativa != null ? { ativa: tdv.ativa } : {}),
        ...(tdv.estado != null ? { estado: tdv.estado } : {}),
        ...(tdv.origem != null ? { origem: tdv.origem } : {}),
        ...(tdv.origemComunicacaoVendaVeiculo != null
          ? { origemComunicacaoVendaVeiculo: tdv.origemComunicacaoVendaVeiculo }
          : {}),
        ...(descricaoMarcaVeiculo ? { descricaoMarcaVeiculo } : {}),
        ...(codigoComprador ? { codigoComprador } : {}),
        cpfComprador,
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
