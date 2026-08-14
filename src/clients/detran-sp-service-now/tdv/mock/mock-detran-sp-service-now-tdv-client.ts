import type { DetranSpServiceNowAuth } from '../../detran-sp-service-now-http'
import {
  DetranSpServiceNowTdvClient,
  type DetranSpServiceNowTdvClientParams
} from '../detran-sp-service-now-tdv-client'
import { CodigoEstadoTDV } from '../types'
import type {
  AtualizaTdvCommand,
  AtualizaTdvResult,
  BuscaCidadaoResult,
  BuscaDebitosTdvResult,
  BuscaEnderecoResult,
  BuscaPixQrCodeTdvResult,
  BuscaTdvResult,
  CriaTdvCommand,
  CriaTdvResult,
  ListaTdvsResult,
  ListTdvsQuery,
  ListaVeiculosProprietarioResult,
  ValidarTdvCommand,
  ValidarTdvResult
} from '../types'
import { tdvMockStore } from './tdv-mock-store'

const ESTADO_NOME: Record<string, string> = {
  [CodigoEstadoTDV.VEICULO_SELECIONADO]: 'VEICULO_SELECIONADO',
  [CodigoEstadoTDV.DADOS_VENDA_INFORMADOS]: 'DADOS_VENDA_INFORMADOS',
  [CodigoEstadoTDV.ATPVE_CRIADA]: 'ATPVE_CRIADA',
  [CodigoEstadoTDV.INTENCAO_COMPRA_CONFIRMADA]: 'INTENCAO_COMPRA_CONFIRMADA',
  [CodigoEstadoTDV.AUTODECLARACAO_RESIDENCIA_CONFIRMADA]: 'AUTODECLARACAO_RESIDENCIA_CONFIRMADA',
  [CodigoEstadoTDV.ATPVE_ASSINADA_COMPRADOR]: 'ATPVE_ASSINADA_COMPRADOR',
  [CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA]: 'ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA',
  [CodigoEstadoTDV.TAXA_SERVICO_PAGA]: 'TAXA_SERVICO_PAGA',
  [CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA]: 'TRANSFERENCIA_CONCLUIDA',
  [CodigoEstadoTDV.TRANSFERENCIA_CANCELADA]: 'TRANSFERENCIA_CANCELADA'
}

export function estadoLabel (code: string | undefined): string {
  if (!code) return '—'
  return `${code} (${ESTADO_NOME[code] ?? '?'})`
}

// Mirrors the DETRAN ServiceNow cron worker that advances a paid TDV from 8 to 9 asynchronously.
const AUTO_CONCLUSAO_DELAY_MS = 5000

/**
 * Drop-in replacement for {@link DetranSpServiceNowTdvClient} that serves the TDV flow from an
 * in-memory, stateful store ({@link tdvMockStore}) instead of the real ServiceNow backend.
 *
 * It extends the real client only to satisfy the DI/`Clients` type — every network method is
 * overridden and the inherited axios instance is never used. Enabled via `config.tdvMock.enabled`
 * (dev/QA only). Each state transition is logged so the test mass can be followed step by step.
 */
export class MockDetranSpServiceNowTdvClient extends DetranSpServiceNowTdvClient {
  private readonly params: DetranSpServiceNowTdvClientParams

  constructor (params: DetranSpServiceNowTdvClientParams) {
    // The real constructor builds `new URL('/api/...', config.serviceNow.api.baseUrl)`, which
    // throws on an empty base — fall back to a dummy host so the mock never depends on it.
    super({
      config: params.config.serviceNow.api.baseUrl
        ? params.config
        : {
            ...params.config,
            serviceNow: {
              ...params.config.serviceNow,
              api: { ...params.config.serviceNow.api, baseUrl: 'http://tdv-mock.local' }
            }
          },
      logger: params.logger
    })
    this.params = params
    // Boot-level announcement lives in create-container; this fires per request scope, so keep
    // it at debug to avoid spamming the log on every TDV call.
    this.logger.debug('[TDV-MOCK] Cliente TDV em modo MOCK (in-memory, stateful) resolvido')
  }

  private seed (): void {
    tdvMockStore.ensureSeeded(this.params.config.tdvMock)
  }

  async listaVeiculosProprietario (_auth: DetranSpServiceNowAuth): Promise<ListaVeiculosProprietarioResult> {
    this.seed()
    return { result: tdvMockStore.getVehicles() }
  }

  async listaTdvs (_auth: DetranSpServiceNowAuth, query: ListTdvsQuery): Promise<ListaTdvsResult> {
    this.seed()
    return { result: tdvMockStore.listTdvs(query) }
  }

  async buscaTdv (_auth: DetranSpServiceNowAuth, codigoTransferenciaVeiculo: string): Promise<BuscaTdvResult> {
    this.seed()
    const record = tdvMockStore.getTdv(codigoTransferenciaVeiculo)
    return record ? { result: record } : undefined
  }

  async criaTdv (auth: DetranSpServiceNowAuth, data: CriaTdvCommand): Promise<CriaTdvResult> {
    this.seed()
    const record = tdvMockStore.createTdv(data)
    this.logger.info(
      { vendedor: auth.cpf, placa: record.placaVeiculo },
      `\n🟢 [TDV-MOCK] ${record.codigoTransferenciaVeiculo} criada  →  ${estadoLabel(record.estado)}  (vendedor ${auth.cpf})`
    )
    return {
      result: {
        codigoTransferenciaVeiculo: record.codigoTransferenciaVeiculo!,
        ...(record.origem != null ? { origem: record.origem } : {})
      }
    }
  }

  async atualizaTdv (
    auth: DetranSpServiceNowAuth,
    codigoTransferenciaVeiculo: string,
    data: AtualizaTdvCommand
  ): Promise<AtualizaTdvResult> {
    this.seed()
    const updated = tdvMockStore.updateTdv(codigoTransferenciaVeiculo, data)

    if (!updated) {
      this.logger.warn(
        { codigoTransferencia: codigoTransferenciaVeiculo },
        '[TDV-MOCK] atualizaTdv chamado para uma TDV inexistente'
      )
      return { result: { codigoTransferenciaVeiculo } }
    }

    const { record } = updated
    const de = updated.previousEstado
    const para = data.estado
    const ator = record.codigoVendedor === auth.cpf ? 'vendedor' : 'comprador'

    // Clean, scannable one-liner for the transition + a compact summary of the mass (not the full
    // record). Bump LOG_LEVEL=debug and read the debug line below for the whole snapshot.
    this.logger.info(
      {
        comprador: record.codigoComprador,
        valorVenda: record.valorVendaVeiculo,
        km: record.kmVeiculo,
        ativa: record.ativa
      },
      `\n🔄 [TDV-MOCK] ${codigoTransferenciaVeiculo}  ${estadoLabel(de)}  →  ${estadoLabel(para)}  (por ${ator} ${auth.cpf})`
    )
    this.logger.debug({ snapshot: record }, `[TDV-MOCK] ${codigoTransferenciaVeiculo} snapshot completo`)

    // In real homolog/prod, ServiceNow's own cron worker advances a paid TDV from 8 to 9
    // (TRANSFERENCIA_CONCLUIDA) asynchronously — no client request does that. Simulate the same
    // async behavior here so the buyer can reopen the TDV and see the "concluída" screen.
    if (para === CodigoEstadoTDV.TAXA_SERVICO_PAGA) {
      this.scheduleAutoConclusao(codigoTransferenciaVeiculo)
    }

    return { result: { codigoTransferenciaVeiculo } }
  }

  private scheduleAutoConclusao (codigo: string): void {
    setTimeout(() => {
      // Guard: only fire if the TDV is still exactly at 8 (e.g. wasn't re-created/reset since).
      const current = tdvMockStore.getTdv(codigo)
      if (current?.estado !== CodigoEstadoTDV.TAXA_SERVICO_PAGA) return

      const updated = tdvMockStore.forceEstado(codigo, CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA)
      if (!updated) return

      this.logger.info(
        {},
        `\n🏁 [TDV-MOCK] ${codigo}  ${estadoLabel(updated.previousEstado)}  →  ${estadoLabel(CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA)}  (worker DETRAN simulado)`
      )
    }, AUTO_CONCLUSAO_DELAY_MS)
  }

  async buscaCidadao (_auth: DetranSpServiceNowAuth, cpf: string): Promise<BuscaCidadaoResult> {
    this.seed()
    return { result: tdvMockStore.getCitizen(cpf) }
  }

  async buscaEndereco (_auth: DetranSpServiceNowAuth, cep: string): Promise<BuscaEnderecoResult> {
    this.seed()
    return { result: tdvMockStore.getEndereco(cep) }
  }

  async buscaDebitosTdv (_auth: DetranSpServiceNowAuth, _codigoTransferenciaVeiculo: string): Promise<BuscaDebitosTdvResult> {
    this.seed()
    return tdvMockStore.getDebitos()
  }

  async buscaPixQrCodeTdv (
    _auth: DetranSpServiceNowAuth,
    codigoTransferenciaVeiculo: string,
    _forcarNovo: boolean
  ): Promise<BuscaPixQrCodeTdvResult> {
    this.seed()
    return tdvMockStore.getPixQrCode(codigoTransferenciaVeiculo)
  }

  async validarTdv (_auth: DetranSpServiceNowAuth, _data: ValidarTdvCommand): Promise<ValidarTdvResult> {
    this.seed()
    return { result: {} }
  }
}
