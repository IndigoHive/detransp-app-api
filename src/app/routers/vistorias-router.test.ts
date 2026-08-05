import { describe, expect, it } from 'vitest'
import { getDocProprietarioByPaymentLabel } from './vistorias-router'

describe('getDocProprietarioByPaymentLabel', () => {
  it('maps Meus pagamentos to a payer document search', () => {
    expect(getDocProprietarioByPaymentLabel('Meus pagamentos')).toBe(false)
  })

  it('maps Meus veiculos to an owner document search', () => {
    expect(getDocProprietarioByPaymentLabel('Meus veiculos')).toBe(true)
  })

  it('rejects unknown labels', () => {
    expect(getDocProprietarioByPaymentLabel('Outro filtro')).toBeUndefined()
  })
})
