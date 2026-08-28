import { describe, expect, it } from 'vitest'
import { composeLogradouro } from './compose-logradouro'

describe('composeLogradouro', () => {
  // O caso que motivou a correção: o CEP de homologação devolve `logradouro: null`.
  it('junta tipoLogradouro e endereco quando o composto vem nulo', () => {
    expect(composeLogradouro({
      tipoLogradouro: 'Rua', endereco: 'Aulide Carini', logradouro: null
    })).toBe('Rua Aulide Carini')
  })

  it('compõe das partes mesmo quando logradouro veio preenchido — o tipo nunca some', () => {
    expect(composeLogradouro({
      tipoLogradouro: 'RUA', endereco: 'DAS FLORES', logradouro: 'Rua das Flores'
    })).toBe('RUA DAS FLORES')
  })

  it('usa o endereco sozinho quando não há tipo', () => {
    expect(composeLogradouro({ tipoLogradouro: null, endereco: 'BOA VISTA' })).toBe('BOA VISTA')
  })

  it('cai para logradouro quando as partes não vêm', () => {
    expect(composeLogradouro({ endereco: null, logradouro: 'Avenida Paulista' }))
      .toBe('Avenida Paulista')
  })

  it('devolve vazio quando não há nada', () => {
    expect(composeLogradouro({})).toBe('')
    expect(composeLogradouro(undefined)).toBe('')
  })
})
