import type { DetranSpServiceNowVistoriasClient } from '../../../clients/detran-sp-service-now-vistorias'
import type { PagamentoVistoriaPublico } from '../../../clients/detran-sp-service-now-vistorias/types'
import { formatDateTimeBr } from '../../deb-restr/utils'
import type { VistoriasAuth } from '../types'

const PAGE_SIZE = 100

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
    docProprietario: boolean
  ): Promise<ListaPagamentosVistoriaOutput> {
    try {
      const result = await this.client.listaPagamentos(auth, documento, docProprietario)
      const response = result?.result

      if (!response?.success) {
        return this.failure(response?.message)
      }

      return response.items
        .filter((item) => item.pevNumber.trim().length > 0)
        .slice(0, PAGE_SIZE)
        .map(({ placa, token, status, modeloAuto, paymentDate, subtipoDescricao, pevNumber, ...item }) => ({
          ...item,
          pevNumber: pevNumber.trim(),
          plate: placa,
          brandModel: modeloAuto,
          vistoriaToken: token,
          vistoriaPaymentDate: formatDateTimeBr(paymentDate),
          vistoriaSubtypeDescription: subtipoDescricao,
          vistoriaStatus: status
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
