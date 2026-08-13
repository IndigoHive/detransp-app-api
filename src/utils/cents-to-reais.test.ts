import { describe, expect, it } from 'vitest'
import { centsToReais } from './cents-to-reais'

describe('centsToReais', () => {
  it('converts whole-reais centavos to a plain integer string, matching ServiceNow examples', () => {
    expect(centsToReais('3000000')).toBe('30000')
    expect(centsToReais('100')).toBe('1')
  })

  it('keeps decimals only when there are real centavos', () => {
    expect(centsToReais('150')).toBe('1.50')
    expect(centsToReais('3000050')).toBe('30000.50')
  })

  it('returns an empty string for empty input', () => {
    expect(centsToReais('')).toBe('')
  })
})
