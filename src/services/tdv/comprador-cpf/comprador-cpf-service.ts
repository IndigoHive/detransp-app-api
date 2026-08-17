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

    return { name: cidadaoResult.result.nome, errorText: null }
  }
}
