import { CodigoEstadoTDV } from '../../clients/detran-sp-service-now/tdv/types'

export type ProximaAcaoComprador = 'comprador' | 'comprador_2' | 'pagamento_confirmado' | 'concluido'

// Only these buyer states require an action from the returning user — earlier states mean
// the ball is in the seller's court, so there's nothing actionable to route into yet.
export function acaoComoComprador (estado: CodigoEstadoTDV | undefined): ProximaAcaoComprador | null {
  switch (estado) {
    case CodigoEstadoTDV.ATPVE_CRIADA: return 'comprador'
    case CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA: return 'comprador_2'
    case CodigoEstadoTDV.TAXA_SERVICO_PAGA: return 'pagamento_confirmado'
    case CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA: return 'concluido'
    default: return null
  }
}
