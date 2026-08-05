export type PagamentoVistoria = {
  id: string
  placa: string
  token: string
  status: string
  modeloAuto: string | null
  paymentDate: string
  tipo: string
  subtipoDescricao: string
  pagador: {
    nome: string
    documento: string
  }
  pevNumber: string
  correlationId: string
}

export type PagamentoVistoriaPublico = Omit<
  PagamentoVistoria,
  'placa' | 'token' | 'status' | 'modeloAuto' | 'paymentDate' | 'subtipoDescricao'
> & {
  plate: string
  brandModel: string | null
  vistoriaToken: string
  vistoriaPaymentDate: string
  vistoriaSubtypeDescription: string
  vistoriaStatus: string
}

export type ListaPagamentosResult =
  | {
      result?:
      | {
          success: true
          message: string
          items: PagamentoVistoria[]
          total: number
          page: number
          pageSize: number
          totalPages: number
        }
      | {
          success: false
          message: string
        }
    }
  | null
  | undefined
