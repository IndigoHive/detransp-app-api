import { describe, expect, it } from 'vitest'
import { getApplicableOtherProcess, getDocProprietarioByPaymentLabel } from './vistorias-router'

describe('getDocProprietarioByPaymentLabel', () => {
  it('maps Meus pagamentos to a payer document search', () => {
    expect(getDocProprietarioByPaymentLabel('Meus pagamentos')).toBe(false)
  })

  it('maps Meus veiculos to an owner document search', () => {
    expect(getDocProprietarioByPaymentLabel('Meus veiculos')).toBe(true)
  })

  it('maps the corrected Meus Veículos label to an owner document search', () => {
    expect(getDocProprietarioByPaymentLabel('Meus Veículos')).toBe(true)
  })

  it('rejects unknown labels', () => {
    expect(getDocProprietarioByPaymentLabel('Outro filtro')).toBeUndefined()
  })
})

describe('getApplicableOtherProcess', () => {
  it('keeps the selected other process when the process type is Outros', () => {
    expect(getApplicableOtherProcess('Outros', 'Transferência de Localidade')).toBe('Transferência de Localidade')
  })

  it('ignores a stale other process when the user changes the process type', () => {
    expect(getApplicableOtherProcess('Mera Identificação', 'Transferência de Localidade')).toBeUndefined()
  })
})
