import createError from 'http-errors'
import { describe, expect, it } from 'vitest'
import { DetranSpServiceNowError } from '../../../clients/detran-sp-service-now'
import { mapPendenciaError } from './map-pendencia-error'

describe('mapPendenciaError', () => {
  it.each([
    ['PagamentoPendenteError', 'pagamento_pendente', 'Pagamento de taxa não localizado'],
    ['VistoriaPendenteError', 'vistoria_pendente', 'Laudo de vistoria não localizado'],
    [
      'PagamentoVistoriaPendentesError',
      'vistoria_pagamento_pendentes',
      'Pagamento de taxa não localizado,Laudo de vistoria não localizado'
    ],
    [
      'SituacaoAdministrativaPendenteError',
      'administrativa_pendente',
      'Veículo com bloqueio - Baixa permanente'
    ],
    ['SituacaoJudicialPendenteError', 'judicial_pendente', 'Veículo com Restrição Judicial'],
    [
      'SituacoesAdministrativaJudicialPendentesError',
      'administrativa_judicial_pendentes',
      'Veículo com bloqueio - Baixa permanente,Veículo com Restrição Judicial'
    ]
  ] as const)('maps %s to %s', (type, proximaAcao, detail) => {
    expect(mapPendenciaError(new DetranSpServiceNowError(type, detail))).toEqual({
      proximaAcao,
      detail
    })
  })

  it('matches SN type case-insensitively via createError production path', () => {
    const error = createError(
      500,
      new DetranSpServiceNowError('pagamentopendenteerror', 'Pagamento de taxa não localizado'),
      { expose: true }
    )

    expect(mapPendenciaError(error)).toEqual({
      proximaAcao: 'pagamento_pendente',
      detail: 'Pagamento de taxa não localizado'
    })
  })

  it('reads the reason from RestricoesEncontradasError when it is a missing service fee', () => {
    const detail = 'PAGAMENTO DE TAXA DE SERVIÇO NÃO LOCALIZADO'

    expect(mapPendenciaError(new DetranSpServiceNowError('RestricoesEncontradasError', detail)))
      .toEqual({ proximaAcao: 'pagamento_pendente', detail })
  })

  it('leaves other RestricoesEncontradasError alone', () => {
    expect(
      mapPendenciaError(
        new DetranSpServiceNowError('RestricoesEncontradasError', 'Veículo com restrição judicial')
      )
    ).toBeUndefined()
  })

  it('returns undefined for unknown SN errors', () => {
    expect(
      mapPendenciaError(new DetranSpServiceNowError('SomeUnknownError', 'falha inesperada'))
    ).toBeUndefined()
  })

  it('returns undefined for non-SN errors', () => {
    expect(mapPendenciaError(new Error('boom'))).toBeUndefined()
  })
})
