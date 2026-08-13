// The app's money input stores its value as digits-only centavos (e.g. "3000000" for
// R$ 30.000,00). ServiceNow's valorVendaVeiculo allows optional decimals (pattern
// ^[0-9]*(.[0-9]{1,2})?$) but every example in docs/tdv/swagger.yaml is a plain integer
// (e.g. "87464", never "87464.00"), so only emit decimals when there are real centavos.
export function centsToReais (cents: string): string {
  const digits = cents.replace(/\D/g, '')
  if (!digits) {
    return ''
  }
  const amount = Number(digits) / 100
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
}
