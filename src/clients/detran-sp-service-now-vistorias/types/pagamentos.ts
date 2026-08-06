export type PagamentoVistoriaKnownStatus =
  | 'ATIVO'
  | 'EM_ANDAMENTO'
  | 'FINALIZADO'
  | 'EXPIRADO'
  | 'RESTITUICAO_EM_ANALISE'
  | 'RESTITUICAO_EM_PROCESSO'
  | 'RESTITUIDO'

export type PagamentoVistoriaStatus =
  | PagamentoVistoriaKnownStatus
  | (string & Record<never, never>)

export type PagamentoVistoriaStatusPublico =
  | 'EM ABERTO'
  | 'EM USO'
  | 'UTILIZADO'
  | 'VENCIDO'
  | 'RESTITUIÇÃO EM ANÁLISE'
  | 'RESTITUÍDO'
  | (string & Record<never, never>)

export type PagamentoVistoria = {
  id: string
  placa: string
  token: string
  status: PagamentoVistoriaStatus
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
  vistoriaStatus: PagamentoVistoriaStatusPublico
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
