import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type CompradorCpfInput = {
  cpf: string
}

export type CompradorCpfResult = {
  name: string | null
  errorText: string | null
}

// Mantém o primeiro e o último caractere visíveis, mascara o resto (espaços
// preservados para manter o formato do nome legível).
export function censorName (fullName: string): string {
  const chars = fullName.split('')
  return chars
    .map((char, index) => {
      if (index === 0 || index === chars.length - 1) return char
      return char === ' ' ? ' ' : '*'
    })
    .join('')
}

export class CompradorCpfService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: CompradorCpfInput): Promise<CompradorCpfResult> {
    const token = extractBearerToken(authorizationHeader)
    const sellerCpf = extractCpfFromToken(token)
    const auth = { token, cpf: sellerCpf }

    if (input.cpf === sellerCpf) {
      return { name: null, errorText: 'CPF deve ser diferente do proprietário atual' }
    }

    const cidadaoResult = await this.client.buscaCidadao(auth, input.cpf)
    if (!cidadaoResult?.result) {
      return { name: null, errorText: 'CPF não encontrado' }
    }

    return { name: censorName(cidadaoResult.result.nome), errorText: null }
  }
}
