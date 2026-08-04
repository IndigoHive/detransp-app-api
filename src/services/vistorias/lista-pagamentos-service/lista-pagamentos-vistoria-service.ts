import type { DetranSpServiceNowVistoriasClient } from '../../../clients/detran-sp-service-now-vistorias'
import type { PagamentoVistoriaPublico } from '../../../clients/detran-sp-service-now-vistorias/types'
import { formatDateTimeBr } from '../../deb-restr/utils'
import type { VistoriasAuth } from '../types'

const PAGE_SIZE = 100

export class ListaPagamentosVistoriaService {
  constructor(private readonly client: DetranSpServiceNowVistoriasClient) {}

  async run (
    auth: VistoriasAuth,
    documento: string,
    docProprietario: boolean
  ): Promise<PagamentoVistoriaPublico[]> {
    const result = await this.client.listaPagamentos(auth, documento, docProprietario)
    const response = result?.result

    if (!response?.success) {
      return []
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
  }
}
