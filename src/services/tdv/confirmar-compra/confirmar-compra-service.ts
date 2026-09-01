import { BadRequest } from 'http-errors'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV, type CodigoOrigemTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { formatCurrency } from '../../../utils/currency'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'
import type { IAnalyticsService } from '../../analytics'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
  analyticsService: IAnalyticsService
}

export type ConfirmarCompraInput = {
  codigoTransferencia: string
  codigoProvaVidaComprador?: string
}

export type ConfirmarCompraResult = {
  nomeComprador: string
  cpfComprador: string
  enderecoComprador: string
  origem?: CodigoOrigemTDV
  estado?: CodigoEstadoTDV
  vehicle: {
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
    valorVenda?: string
    quilometragem?: string
  }
}

function formatNumericDisplay (value: string | undefined, format: (n: number) => string): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? format(n) : trimmed
}

export class ConfirmarCompraService {
  private readonly client: DetranSpServiceNowTdvClient
  private readonly analyticsService: IAnalyticsService

  constructor ({ detranSpServiceNowTdv, analyticsService }: Dependencies) {
    this.client = detranSpServiceNowTdv
    this.analyticsService = analyticsService
  }

  async run (authorizationHeader: string | undefined, input: ConfirmarCompraInput): Promise<ConfirmarCompraResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const codigoTransferencia = input.codigoTransferencia?.trim() ?? ''

    if (!codigoTransferencia) {
      throw BadRequest('codigoTransferencia é obrigatório')
    }

    const current = await this.client.buscaTdv(auth, codigoTransferencia)
    let estadoAtual = current?.result?.estado
    const needsAdvance = estadoAtual === CodigoEstadoTDV.ATPVE_CRIADA
      || estadoAtual === CodigoEstadoTDV.INTENCAO_COMPRA_CONFIRMADA

    if (needsAdvance) {
      const codigoProvaVidaComprador = input.codigoProvaVidaComprador?.trim()
      if (!codigoProvaVidaComprador) {
        throw BadRequest('codigoProvaVidaComprador é obrigatório para avançar a compra')
      }

      if (estadoAtual === CodigoEstadoTDV.ATPVE_CRIADA) {
        await this.client.atualizaTdv(auth, codigoTransferencia, {
          estado: CodigoEstadoTDV.INTENCAO_COMPRA_CONFIRMADA,
          codigoProvaVidaComprador,
          tipoProvaVidaComprador: '2' // LIVENESS
        })
        estadoAtual = CodigoEstadoTDV.INTENCAO_COMPRA_CONFIRMADA

        this.analyticsService.capture(cpf, 'tdv:intent_confirm', {
          $insert_id: this.analyticsService.createInsertId(`tdv:intent_confirm:${codigoTransferencia}`)
        })
      }

      if (estadoAtual === CodigoEstadoTDV.INTENCAO_COMPRA_CONFIRMADA) {
        await this.client.atualizaTdv(auth, codigoTransferencia, {
          estado: CodigoEstadoTDV.AUTODECLARACAO_RESIDENCIA_CONFIRMADA,
          codigoProvaVidaComprador,
          tipoProvaVidaComprador: '2',
          confirmacaoAutodeclaracaoResidenciaComprador: 'true'
        })

        this.analyticsService.capture(cpf, 'tdv:residence_declaration_confirm', {
          $insert_id: this.analyticsService.createInsertId(`tdv:residence_declaration_confirm:${codigoTransferencia}`)
        })
      }
    }

    const tdv = needsAdvance
      ? await this.client.buscaTdv(auth, codigoTransferencia)
      : current
    const data = tdv?.result

    const enderecoComprador = [
      data?.logradouroComprador,
      data?.numeroComprador,
      data?.bairroComprador,
      data?.nomeMunicipioComprador ? `${data.nomeMunicipioComprador} - ${data.ufComprador ?? 'SP'}` : undefined
    ].filter(Boolean).join(', ')

    const valorVenda = formatNumericDisplay(data?.valorVendaVeiculo, formatCurrency)
    const quilometragem = formatNumericDisplay(data?.kmVeiculo, n => n.toLocaleString('pt-BR'))

    return {
      nomeComprador: data?.nomeComprador ?? '',
      cpfComprador: data?.codigoComprador ?? '',
      enderecoComprador,
      ...(data?.origem !== undefined ? { origem: data.origem } : {}),
      ...(data?.estado !== undefined ? { estado: data.estado } : {}),
      vehicle: {
        id: '1',
        plate: data?.placaVeiculo ?? '',
        title: data?.descricaoMarcaVeiculo ?? '',
        licensingStatus: 'REGULAR',
        brandModel: data?.descricaoMarcaVeiculo ?? '',
        licensingExpirationDate: '',
        renavam: data?.codigoRenavamVeiculo ?? '',
        lastLicensing: '',
        yearFab: '',
        yearMod: '',
        ...(valorVenda ? { valorVenda } : {}),
        ...(quilometragem ? { quilometragem } : {})
      }
    }
  }
}
