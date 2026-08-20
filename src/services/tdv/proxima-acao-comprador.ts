import { CodigoEstadoTDV } from '../../clients/detran-sp-service-now/tdv/types'

export type ProximaAcaoComprador = 'comprador' | 'comprador_2' | 'pagamento_confirmado' | 'concluido'

// Only these buyer states require an action from the returning user — earlier states mean
// the ball is in the seller's court, so there's nothing actionable to route into yet.
// States 3-5 are all the same buyer branch: the buyer may have dropped out mid-flow after
// confirming intent (4) or the residence self-declaration (5) but before signing the ATPVE,
// and confirmar-compra resumes from whichever of those it finds.
export function acaoComoComprador (estado: CodigoEstadoTDV | undefined): ProximaAcaoComprador | null {
  switch (estado) {
    case CodigoEstadoTDV.ATPVE_CRIADA:
    case CodigoEstadoTDV.INTENCAO_COMPRA_CONFIRMADA:
    case CodigoEstadoTDV.AUTODECLARACAO_RESIDENCIA_CONFIRMADA: return 'comprador'
    case CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA: return 'comprador_2'
    case CodigoEstadoTDV.TAXA_SERVICO_PAGA: return 'pagamento_confirmado'
    case CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA: return 'concluido'
    default: return null
  }
}
