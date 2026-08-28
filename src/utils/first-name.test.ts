import { describe, expect, it } from 'vitest'
import { firstName } from './first-name'

describe('firstName', () => {
  it('reduz o nome completo em caixa alta ao primeiro nome capitalizado', () => {
    expect(firstName('MARIA DA SILVA')).toBe('Maria')
  })

  it('é idempotente — aplicar de novo no resultado não muda nada', () => {
    expect(firstName(firstName('MARIA DA SILVA'))).toBe('Maria')
  })

  it('tolera espaços extras e string vazia', () => {
    expect(firstName('   JOÃO   PEDRO  ')).toBe('João')
    expect(firstName('   ')).toBe('')
    expect(firstName('')).toBe('')
  })
})
