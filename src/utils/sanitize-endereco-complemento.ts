export function sanitizeEnderecoComplemento (complemento: string): string {
  return complemento
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
