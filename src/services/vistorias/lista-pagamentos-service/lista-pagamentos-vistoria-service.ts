import type { DetranSpServiceNowVistoriasClient } from '../../../clients/detran-sp-service-now-vistorias'
import type {
  PagamentoVistoriaKnownStatus,
  PagamentoVistoriaPublico,
  PagamentoVistoriaStatus,
  PagamentoVistoriaStatusPublico
} from '../../../clients/detran-sp-service-now-vistorias/types'
import { formatDateTimeBr } from '../../deb-restr/utils'
import type { VistoriasAuth } from '../types'

const PAGE_SIZE = 100
const STATUS_LABELS = {
  ATIVO: 'EM ABERTO',
  EM_ANDAMENTO: 'EM USO',
  FINALIZADO: 'UTILIZADO',
  EXPIRADO: 'VENCIDO',
  RESTITUICAO_EM_ANALISE: 'RESTITUIÇÃO EM ANÁLISE',
  RESTITUICAO_EM_PROCESSO: 'RESTITUIÇÃO EM ANÁLISE',
  RESTITUIDO: 'RESTITUÍDO'
} as const satisfies Record<PagamentoVistoriaKnownStatus, PagamentoVistoriaStatusPublico>

function getStatusLabel (status: PagamentoVistoriaStatus): PagamentoVistoriaStatusPublico {
  return status in STATUS_LABELS
    ? STATUS_LABELS[status as PagamentoVistoriaKnownStatus]
    : status
}

export type ListaPagamentosVistoriaOutput =
  | PagamentoVistoriaPublico[]
  | {
    showSnackbar: {
      variant: 'error'
      title: string
      description: string
    }
  }

export class ListaPagamentosVistoriaService {
  constructor(private readonly client: DetranSpServiceNowVistoriasClient) {}

  async run (
    auth: VistoriasAuth,
    documento: string,
    docProprietario: boolean,
    renavam?: string
  ): Promise<ListaPagamentosVistoriaOutput> {
    try {
      const result = await this.client.listaPagamentos(auth, documento, docProprietario, renavam)
      const response = result?.result

      if (!response?.success) {
        return this.failure(response?.message)
      }

      return response.items
        .filter((item) => item.pevNumber.trim().length > 0)
        .slice(0, PAGE_SIZE)
        .map(({ placa, token, status, modeloAuto, paymentDate, tipo, subtipoDescricao, pevNumber, ...item }) => ({
          ...item,
          pevNumber: pevNumber.trim(),
          plate: placa,
          brandModel: modeloAuto,
          vistoriaToken: token,
          vistoriaPaymentDate: formatDateTimeBr(paymentDate),
          vistoriaType: tipo,
          vistoriaStatus: getStatusLabel(status)
        }))
    } catch (error) {
      return this.failure(error instanceof Error ? error.message : undefined)
    }
  }

  private failure (description?: string): ListaPagamentosVistoriaOutput {
    return {
      showSnackbar: {
        variant: 'error',
        title: 'Não foi possível consultar os pagamentos',
        description: description ?? 'Tente novamente em alguns instantes.'
      }
    }
  }
}
