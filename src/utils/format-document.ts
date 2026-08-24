function onlyDigits (value: string): string {
  return value.replace(/\D/g, '')
}

function normalizeCpfDigits (cpf: string): string {
  const digits = onlyDigits(cpf)
  if (digits.length <= 11) return digits
  const stripped = digits.replace(/^0+/, '')
  return stripped.length <= 11 ? stripped.padStart(11, '0') : stripped.slice(-11)
}

export function formatCpf (cpf: string): string {
  const digits = normalizeCpfDigits(cpf)
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function formatCnpj (cnpj: string): string {
  const digits = onlyDigits(cnpj)
  if (digits.length !== 14) return cnpj
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

export function formatCep (cep: string): string {
  const digits = onlyDigits(cep)
  if (digits.length !== 8) return cep
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function formatCpfCnpj (value: string): string {
  const digits = onlyDigits(value)
  if (digits.length === 11) return formatCpf(value)
  if (digits.length === 14) return formatCnpj(value)
  const asCpf = formatCpf(value)
  if (asCpf !== value) return asCpf
  return value
}
