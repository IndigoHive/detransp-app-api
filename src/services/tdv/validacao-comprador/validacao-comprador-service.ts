import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { extractBearerToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ValidacaoCompradorInput = {
  cpf: string
  nome: string
  email: string
  cep: string
}

export type ValidacaoCompradorResult = {
  valid: boolean
  cidadao?: {
    cpf: string
    nome: string
    logradouro: string
    numero: string
    complemento: string
    bairro: string
    cep: string
    uf: string
    codMunicipio: string
  }
  endereco?: {
    logradouro: string | null
    bairro: string
    municipio: string
    uf: string
    codigoMunicipio: number
  }
  error?: string
}

export class ValidacaoCompradorService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: ValidacaoCompradorInput): Promise<ValidacaoCompradorResult> {
    const token = extractBearerToken(authorizationHeader)

    const [cidadaoResult, enderecoResult] = await Promise.all([
      this.client.buscaCidadao(token, input.cpf),
      this.client.buscaEndereco(token, input.cep)
    ])

    if (!cidadaoResult?.result) {
      return { valid: false, error: 'CPF não encontrado' }
    }

    if (!enderecoResult?.result) {
      return { valid: false, error: 'CEP não encontrado' }
    }

    const cidadao = cidadaoResult.result
    const endereco = enderecoResult.result

    return {
      valid: true,
      cidadao: {
        cpf: cidadao.cpf,
        nome: cidadao.nome,
        logradouro: cidadao.logradouro,
        numero: cidadao.numeroLogradouro,
        complemento: cidadao.complemento,
        bairro: cidadao.bairro,
        cep: cidadao.cep,
        uf: cidadao.uf,
        codMunicipio: cidadao.codMunicipio
      },
      endereco: {
        logradouro: endereco.logradouro,
        bairro: endereco.bairro,
        municipio: endereco.municipio,
        uf: endereco.uf,
        codigoMunicipio: endereco.codigoMunicipio
      }
    }
  }
}
