import { BadRequest } from 'http-errors'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type AutodeclaracaoResidenciaInput = {
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  uf?: string
  nomeUF?: string
}

export type AutodeclaracaoResidenciaResult = {
  autodeclaracaoResidencia: string
}

function texto (value: string | undefined): string {
  return value?.trim() ?? ''
}

export class AutodeclaracaoResidenciaService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (
    authorizationHeader: string | undefined,
    input: AutodeclaracaoResidenciaInput
  ): Promise<AutodeclaracaoResidenciaResult> {
    const logradouro = texto(input.logradouro)
    const municipio = texto(input.municipio)

    if (!logradouro || !municipio) {
      throw BadRequest('logradouro e municipio são obrigatórios')
    }

    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const result = await this.client.criaAutodeclaracaoResidencia(auth, cpf, {
      logradouro,
      numero: texto(input.numero),
      complemento: texto(input.complemento),
      bairro: texto(input.bairro),
      municipio,
      uf: texto(input.uf),
      nomeUF: texto(input.nomeUF)
    })

    return { autodeclaracaoResidencia: result?.result?.autodeclaracaoResidencia ?? '' }
  }
}
