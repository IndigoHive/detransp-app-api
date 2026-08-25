import { DetranSpServiceNowError } from '../../../clients/detran-sp-service-now'

export type PendenciaProximaAcao =
  | 'pagamento_pendente'
  | 'vistoria_pendente'
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
  vistoriapendenteerror: 'vistoria_pendente',
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

// ServiceNow also reports a missing service fee as a generic RestricoesEncontradasError whose
// detail carries the actual reason — the app in production reads that detail instead of showing
// the generic error screen.
const TAXA_NAO_LOCALIZADA = 'pagamento de taxa de serviço não localizado'

function proximaAcaoFor (snError: DetranSpServiceNowError): PendenciaProximaAcao | undefined {
  const mapped = PENDENCIA_BY_TYPE[snError.type.toLowerCase()]
  if (mapped) return mapped

  if (
    snError.type.toLowerCase() === 'restricoesencontradaserror'
    && snError.detail?.toLowerCase().includes(TAXA_NAO_LOCALIZADA)
  ) {
    return 'pagamento_pendente'
  }

  return undefined
}

export function mapPendenciaError (error: unknown): PendenciaResult | undefined {
  const snError = asServiceNowError(error)
  if (!snError) return undefined

  const proximaAcao = proximaAcaoFor(snError)
  if (!proximaAcao) return undefined

  return {
    proximaAcao,
    detail: snError.detail
  }
}
