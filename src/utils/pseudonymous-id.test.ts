import { describe, expect, it } from 'vitest'
import { derivePseudonymousId } from './pseudonymous-id'

const cpf = '05246487601'
const pepper = 'pepper-de-teste'

describe('derivePseudonymousId', () => {
  it('is deterministic for the same cpf and pepper', () => {
    expect(derivePseudonymousId(cpf, pepper)).toBe(derivePseudonymousId(cpf, pepper))
  })

  it('returns a 64-char hex digest that does not contain the cpf', () => {
    const id = derivePseudonymousId(cpf, pepper)

    expect(id).toMatch(/^[0-9a-f]{64}$/)
    expect(id).not.toContain(cpf)
  })

  it('produces a different id for a different cpf', () => {
    expect(derivePseudonymousId(cpf, pepper)).not.toBe(derivePseudonymousId('11111111111', pepper))
  })

  // O pepper é o que impede a reversão por força bruta: sem ele, o mesmo CPF não
  // pode ser ligado ao id. Se esta asserção quebrar, o pepper parou de ser usado.
  it('produces a different id when the pepper changes', () => {
    expect(derivePseudonymousId(cpf, pepper)).not.toBe(derivePseudonymousId(cpf, 'outro-pepper'))
  })
})
