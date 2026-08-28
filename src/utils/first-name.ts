// "MARIA COMPRADORA TESTE" -> "Maria" — as telas de conclusão saúdam pelo primeiro nome
// ("Olá, Maria"). O nome completo continua sendo usado como veio em todo o resto
// (declarações, confirmação de identidade, telas informativas).
export function firstName (fullName: string): string {
  const [first] = fullName.trim().split(/\s+/)
  if (!first) return ''
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}
