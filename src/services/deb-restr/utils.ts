import type { DebitoIncluded } from '../../clients/detran-sp-service-now-deb-restr'
import type { DebtSectionStatus } from './types'

export function formatCurrencyBr (value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDateBr (isoDate: string): string {
  // ServiceNow sends bare dates ("2026-07-10") in some fields and full ISO
  // datetimes ("2026-07-10T03:00:00.000Z") in others (e.g. certidão taxa).
  const [year, month, day] = isoDate.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

export function debtVencimento (debito: DebitoIncluded): string | null {
  return debito.attributes.dataVencimento ?? debito.attributes.vencimento ?? null
}

export function deriveSectionStatus (debitos: DebitoIncluded[]): DebtSectionStatus {
  if (debitos.length === 0) return 'REGULAR'

  const today = new Date().toISOString().slice(0, 10)
  const vencimentos = debitos.map(debtVencimento).filter((v): v is string => v != null)

  // A debt without a due date is still a debt — treat as overdue
  if (vencimentos.length < debitos.length) return 'VENCIDO'
  return vencimentos.some((v) => v < today) ? 'VENCIDO' : 'A VENCER'
}

// IPVA: ServiceNow recalculates an overdue exercício's vencimento to the
// consultation day (the pay-today value), so date comparison alone never
// flags it — an exercício before the current year is overdue by definition.
export function isIpvaVencido (debito: DebitoIncluded): boolean {
  const exercicio = debito.attributes.exercicio
  if (exercicio != null && exercicio < new Date().getFullYear()) return true
  const vencimento = debtVencimento(debito)
  return !vencimento || vencimento.slice(0, 10) < new Date().toISOString().slice(0, 10)
}

export function deriveIpvaSectionStatus (debitos: DebitoIncluded[]): DebtSectionStatus {
  if (debitos.length === 0) return 'REGULAR'
  return debitos.some(isIpvaVencido) ? 'VENCIDO' : 'A VENCER'
}

// ServiceNow emits datetimes as "DD-MM-YYYY HH:MM:SS" (already BRT) in some
// endpoints and as full ISO in others — normalize both to "dd/mm/yyyy HH:MM".
export function formatDateTimeBr (value: string): string {
  const brMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}):(\d{2})/)
  if (brMatch) {
    const [, day, month, year, hour, minute] = brMatch
    return `${day}/${month}/${year} ${hour}:${minute}`
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
        .toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
        .replace(',', '')
    }
  }
  return value
}

export function sumValores (debitos: DebitoIncluded[]): number {
  const total = debitos.reduce((sum, d) => sum + (d.attributes.valor ?? 0), 0)
  // Cents are exact in BRL; summing floats isn't ("6575.890000000001")
  return Math.round(total * 100) / 100
}

export function buildVeiculoPixId (renavam: string, placa: string): string {
  return Buffer.from(`${renavam},${placa.toUpperCase()}`).toString('base64')
}

export function toSentenceCase (value: string): string {
  return value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1).toLocaleLowerCase('pt-BR')
}
