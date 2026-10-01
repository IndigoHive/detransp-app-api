import type { Selo } from '../../clients'

export const SELO_LEVELS: Record<Selo, number> = { Bronze: 1, Prata: 2, Ouro: 3 }

export function isSeloAtLeast (current: Selo | null, required: Selo): boolean {
  if (!current) {
    return false
  }

  return SELO_LEVELS[current] >= SELO_LEVELS[required]
}
