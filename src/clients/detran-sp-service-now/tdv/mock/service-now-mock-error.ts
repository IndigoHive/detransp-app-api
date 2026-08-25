import createError from 'http-errors'
import { DetranSpServiceNowError } from '../../errors/detran-sp-service-now-error'

// Business rejections on the TDV endpoints come back as 406 with this envelope (see the
// error examples in docs/tdv/swagger.yaml). DetranSpServiceNowHttp.createResponseError turns
// that into createError(status, new DetranSpServiceNowError(message, detail, responseData)),
// which is what mapPendenciaError and ValidarTdvService actually match on — so the mock has to
// throw the exact same shape, or an error path would "work" here and break against homolog.
const HTTP_NAO_ACEITAVEL = 406

export function serviceNowMockError (message: string, detail: string, status = HTTP_NAO_ACEITAVEL): Error {
  const responseData = { error: { message, detail }, status: 'failure' }
  return createError(
    status,
    new DetranSpServiceNowError(message, detail, responseData),
    { expose: true }
  )
}

// Types and details copied from what the services match on (map-pendencia-error.ts,
// validar-tdv-service.ts, criar-compra-service.ts) and from the swagger error examples.
export const TDV_MOCK_ERRORS = {
  pagamento_pendente: [
    'PagamentoPendenteError',
    'Pagamento de taxa não localizado'
  ],
  vistoria_pendente: [
    'VistoriaPendenteError',
    'Laudo de vistoria não localizado'
  ],
  vistoria_pagamento_pendentes: [
    'PagamentoVistoriaPendentesError',
    'Pagamento de taxa não localizado,Laudo de vistoria não localizado'
  ],
  administrativa_pendente: [
    'SituacaoAdministrativaPendenteError',
    'Veículo com bloqueio - Baixa permanente'
  ],
  judicial_pendente: [
    'SituacaoJudicialPendenteError',
    'Veículo com Restrição Judicial'
  ],
  administrativa_judicial_pendentes: [
    'SituacoesAdministrativaJudicialPendentesError',
    'Veículo com bloqueio - Baixa permanente,Veículo com Restrição Judicial'
  ],
  duas_assinaturas: [
    'DuasAssinaturasError',
    'A comunicação de venda não possui as assinaturas do comprador e do vendedor'
  ],
  duas_pessoas_fisicas: [
    'DuasPessoasFisicasError',
    'A comunicação de venda possui pessoa jurídica como comprador ou vendedor'
  ],
  tdv_ativa_existente: [
    'TDVAtivaExistenteError',
    'Já existe uma TDV ativa para o veículo'
  ]
} as const satisfies Record<string, readonly [string, string]>

export type TdvMockErrorKey = keyof typeof TDV_MOCK_ERRORS

export function throwTdvMockError (key: TdvMockErrorKey): never {
  const [message, detail] = TDV_MOCK_ERRORS[key]
  throw serviceNowMockError(message, detail)
}
