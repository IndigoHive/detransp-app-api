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

function cpfCheckDigit (digits: string): number {
  const weight = digits.length + 1
  const sum = [...digits].reduce((acc, digit, i) => acc + Number(digit) * (weight - i), 0)
  const remainder = (sum * 10) % 11
  return remainder === 10 ? 0 : remainder
}

function isCpf (digits: string): boolean {
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false
  return cpfCheckDigit(digits.slice(0, 9)) === Number(digits[9])
    && cpfCheckDigit(digits.slice(0, 10)) === Number(digits[10])
}

function cnpjCheckDigit (digits: string): number {
  const weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2].slice(-digits.length)
  const sum = [...digits].reduce((acc, digit, i) => acc + Number(digit) * weights[i]!, 0)
  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

function isCnpj (digits: string): boolean {
  if (digits.length !== 14) return false
  return cnpjCheckDigit(digits.slice(0, 12)) === Number(digits[12])
    && cnpjCheckDigit(digits.slice(0, 13)) === Number(digits[13])
}

// ServiceNow zero-pads CPFs to 14 characters — exactly a CNPJ's width — so length alone
// cannot tell the two apart, and reading a padded CPF as a CNPJ silently drops its first
// three digits. Check digits settle it, and a real CNPJ wins the tie: some low-numbered
// ones (e.g. 00.000.000/0001-91) are also valid CPFs once the padding is stripped.
export function formatCpfCnpj (value: string): string {
  const digits = onlyDigits(value)
  if (digits.length === 11) return formatCpf(value)
  if (digits.length === 14) {
    if (isCnpj(digits)) return formatCnpj(value)
    if (isCpf(digits.slice(-11))) return formatCpf(digits.slice(-11))
    return formatCnpj(value)
  }
  const asCpf = formatCpf(value)
  if (asCpf !== value) return asCpf
  return value
}
