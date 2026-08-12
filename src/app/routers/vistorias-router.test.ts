import { describe, expect, it } from 'vitest'
import { getApplicableProcessSubtype, getDocProprietarioByPaymentLabel, isProcessWithoutVehicleData, isValidVehicleIdentifierPath } from './vistorias-router'

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

describe('getApplicableProcessSubtype', () => {
  it('keeps the selected other process when the process type is Outros', () => {
    expect(getApplicableProcessSubtype('Outros', 'Transferência de Localidade')).toBe('Transferência de Localidade')
  })

  it('ignores a stale other process when the user changes the process type', () => {
    expect(getApplicableProcessSubtype('Mera Identificação', 'Transferência de Localidade')).toBeUndefined()
  })

  it('keeps the subtype for the inspection without vehicle data', () => {
    expect(getApplicableProcessSubtype('SEGURANCA', 'SEGURANCA_9')).toBe('SEGURANCA_9')
  })
})

describe('isProcessWithoutVehicleData', () => {
  it('accepts only the SEGURANCA_9 special process', () => {
    expect(isProcessWithoutVehicleData('SEGURANCA', 'SEGURANCA_9')).toBe(true)
    expect(isProcessWithoutVehicleData('SEGURANCA', 'SEGURANCA_8')).toBe(false)
    expect(isProcessWithoutVehicleData('Outros', 'SEGURANCA_9')).toBe(false)
  })
})

describe('isValidVehicleIdentifierPath', () => {
  it('accepts a RENAVAM or the special process path', () => {
    expect(isValidVehicleIdentifierPath('12345678901')).toBe(true)
    expect(isValidVehicleIdentifierPath('sem-identificacao')).toBe(true)
    expect(isValidVehicleIdentifierPath('invalid')).toBe(false)
  })
})
