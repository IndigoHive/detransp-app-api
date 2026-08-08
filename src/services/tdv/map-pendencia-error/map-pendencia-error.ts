import { DetranSpServiceNowError } from '../../../clients/detran-sp-service-now'

export type PendenciaProximaAcao =
  | 'pagamento_pendente'
  | 'vistoria_pagamento_pendentes'
  | 'administrativa_pendente'
  | 'judicial_pendente'
  | 'administrativa_judicial_pendentes'

export type PendenciaResult = {
  proximaAcao: PendenciaProximaAcao
  detail: string
  codigoTransferencia?: string
}

const PENDENCIA_BY_TYPE: Record<string, PendenciaProximaAcao> = {
  pagamentopendenteerror: 'pagamento_pendente',
  pagamentovistoriapendenteserror: 'vistoria_pagamento_pendentes',
  situacaoadministrativapendenteerror: 'administrativa_pendente',
  situacaojudicialpendenteerror: 'judicial_pendente',
  situacoesadministrativajudicialpendenteserror: 'administrativa_judicial_pendentes'
}

function asServiceNowError (error: unknown): DetranSpServiceNowError | undefined {
  if (error instanceof DetranSpServiceNowError) return error
  if (
    error
    && typeof error === 'object'
    && 'cause' in error
    && (error as { cause: unknown }).cause instanceof DetranSpServiceNowError
  ) {
    return (error as { cause: DetranSpServiceNowError }).cause
  }
  return undefined
}

export function mapPendenciaError (error: unknown): PendenciaResult | undefined {
  const snError = asServiceNowError(error)
  if (!snError) return undefined

  const proximaAcao = PENDENCIA_BY_TYPE[snError.type.toLowerCase()]
  if (!proximaAcao) return undefined

  return {
    proximaAcao,
    detail: snError.detail
  }
}
