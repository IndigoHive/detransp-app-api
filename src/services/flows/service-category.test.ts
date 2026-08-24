import { describe, expect, test } from 'vitest'
import { createCategoryId, getCategoryIconName } from './service-category'

describe('service category', () => {
  test('creates the same ID for equivalent category labels', () => {
    expect(createCategoryId(' Veículos ')).toBe('veiculos')
    expect(createCategoryId('veiculos')).toBe('veiculos')
  })

  test('returns a generic icon for new categories', () => {
    expect(getCategoryIconName('atendimento')).toBe('category')
  })
})
