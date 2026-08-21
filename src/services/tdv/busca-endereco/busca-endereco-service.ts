import createError, { BadRequest } from 'http-errors'
import type {
  BuscaEnderecoResultSuccess,
  DetranSpServiceNowTdvClient
} from '../../../clients/detran-sp-service-now/tdv'
import { formatCep } from '../../../utils/format-document'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type BuscaEnderecoInput = {
  cep: string
}

export type BuscaEnderecoServiceResult = BuscaEnderecoResultSuccess

export class BuscaEnderecoService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (
    authorizationHeader: string | undefined,
    input: BuscaEnderecoInput
  ): Promise<BuscaEnderecoServiceResult> {
    const cep = input.cep?.replace(/\D/g, '') ?? ''
    if (!cep) {
      throw BadRequest('cep é obrigatório')
    }

    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const result = await this.client.buscaEndereco(auth, cep)
    if (!result?.result) {
      throw createError(404, 'CEP não encontrado', { expose: true })
    }

    return {
      ...result,
      result: {
        ...result.result,
        cep: formatCep(result.result.cep)
      }
    }
  }
}
