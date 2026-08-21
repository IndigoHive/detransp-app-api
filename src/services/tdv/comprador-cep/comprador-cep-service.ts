import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type CompradorCepInput = {
  cep: string
}

export type CompradorCepResult = {
  cidade: string | null
  bairro: string | null
  logradouro: string | null
  errorText: string | null
}

const CEP_LENGTH = 8
const ENDERECO_VAZIO = { cidade: null, bairro: null, logradouro: null } as const

export class CompradorCepService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: CompradorCepInput): Promise<CompradorCepResult> {
    const cep = input.cep?.replace(/\D/g, '') ?? ''
    if (cep.length !== CEP_LENGTH) {
      return { ...ENDERECO_VAZIO, errorText: 'CEP inválido' }
    }

    const token = extractBearerToken(authorizationHeader)
    const auth = { token, cpf: extractCpfFromToken(token) }

    const enderecoResult = await this.client.buscaEndereco(auth, cep)
    if (!enderecoResult?.result) {
      return { ...ENDERECO_VAZIO, errorText: 'CEP não encontrado' }
    }

    const endereco = enderecoResult.result
    return {
      cidade: endereco.municipio || endereco.localidade,
      bairro: endereco.bairro,
      logradouro: endereco.logradouro ?? endereco.endereco,
      errorText: null
    }
  }
}
