import { BadRequest } from 'http-errors'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV, type CodigoOrigemTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
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
  }
}

const ESTADOS_JA_AVANCADOS: ReadonlySet<string> = new Set([
  CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
  CodigoEstadoTDV.TAXA_SERVICO_PAGA,
  CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA
])

export class ConfirmarCompraService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
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
    const alreadyAdvanced = !!current?.result?.estado
      && ESTADOS_JA_AVANCADOS.has(current.result.estado)

    if (!alreadyAdvanced) {
      const codigoProvaVidaComprador = input.codigoProvaVidaComprador?.trim()
      if (!codigoProvaVidaComprador) {
        throw BadRequest('codigoProvaVidaComprador é obrigatório para avançar a compra')
      }

      // Advance to state 4 (INTENCAO_COMPRA_CONFIRMADA)
      await this.client.atualizaTdv(auth, codigoTransferencia, {
        estado: CodigoEstadoTDV.INTENCAO_COMPRA_CONFIRMADA,
        codigoProvaVidaComprador,
        tipoProvaVidaComprador: '2' // LIVENESS
      })

      // Advance to state 5 (AUTODECLARACAO_RESIDENCIA_CONFIRMADA)
      // This prepares the TDV for ITI signing (state 5 → 6 by ITI callback)
      await this.client.atualizaTdv(auth, codigoTransferencia, {
        estado: CodigoEstadoTDV.AUTODECLARACAO_RESIDENCIA_CONFIRMADA,
        codigoProvaVidaComprador,
        tipoProvaVidaComprador: '2',
        confirmacaoAutodeclaracaoResidenciaComprador: 'true'
      })
    }

    // Fetch the updated TDV to get buyer and vehicle data
    const tdv = alreadyAdvanced
      ? current
      : await this.client.buscaTdv(auth, codigoTransferencia)
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
        yearMod: ''
      }
    }
  }
}
