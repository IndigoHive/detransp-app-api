import { describe, expect, it } from 'vitest'
import { formatCep, formatCnpj, formatCpf, formatCpfCnpj } from './format-document'

describe('formatCpf', () => {
  it('formats 11 digits', () => {
    expect(formatCpf('12345678900')).toBe('123.456.789-00')
  })

  it('is idempotent on an already formatted CPF', () => {
    expect(formatCpf('123.456.789-00')).toBe('123.456.789-00')
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
})
