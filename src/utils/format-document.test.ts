import { describe, expect, it } from 'vitest'
import { formatCep, formatCnpj, formatCpf, formatCpfCnpj } from './format-document'

describe('formatCpf', () => {
  it('formats 11 digits', () => {
    expect(formatCpf('12345678900')).toBe('123.456.789-00')
  })

  it('is idempotent on an already formatted CPF', () => {
    expect(formatCpf('123.456.789-00')).toBe('123.456.789-00')
  })

  it('strips extra leading zeros then formats', () => {
    expect(formatCpf('00005246487601')).toBe('052.464.876-01')
  })

  it('keeps a significant leading zero on an 11-digit CPF', () => {
    expect(formatCpf('05246487601')).toBe('052.464.876-01')
  })

  it('returns the original value when the digit count is unexpected', () => {
    expect(formatCpf('12345')).toBe('12345')
  })
})

describe('formatCnpj', () => {
  it('formats 14 digits', () => {
    expect(formatCnpj('16794464003768')).toBe('16.794.464/0037-68')
  })

  it('returns the original value when the digit count is unexpected', () => {
    expect(formatCnpj('167944640037')).toBe('167944640037')
  })
})

describe('formatCep', () => {
  it('formats 8 digits', () => {
    expect(formatCep('11045001')).toBe('11045-001')
  })

  it('returns the original value when the digit count is unexpected', () => {
    expect(formatCep('11045')).toBe('11045')
  })
})

describe('formatCpfCnpj', () => {
  it('formats a CPF or a CNPJ from digit length', () => {
    expect(formatCpfCnpj('12345678900')).toBe('123.456.789-00')
    expect(formatCpfCnpj('16794464003768')).toBe('16.794.464/0037-68')
  })

  it('formats a zero-padded CPF that is longer than 11 digits', () => {
    expect(formatCpfCnpj('0005246487601')).toBe('052.464.876-01')
  })

  it('reads a CPF zero-padded to a CNPJ width as a CPF, not as a CNPJ', () => {
    expect(formatCpfCnpj('00005246487601')).toBe('052.464.876-01')
  })

  it('keeps a real CNPJ with leading zeros as a CNPJ', () => {
    expect(formatCpfCnpj('00000000000191')).toBe('00.000.000/0001-91')
  })
})
