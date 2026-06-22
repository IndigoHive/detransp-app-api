import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { extractBearerToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ValidacaoCompradorInput = {
  cpfComprador: string
  cepComprador: string
}

export type ValidacaoCompradorResult = {
  nomeComprador: string
  cpfComprador: string
  enderecoComprador: string
} | {
  showSnackbar: {
    variant: string
    title: string
    description: string
  }
}

export class ValidacaoCompradorService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: ValidacaoCompradorInput): Promise<ValidacaoCompradorResult> {
    const token = extractBearerToken(authorizationHeader)

    const [cidadaoResult, enderecoResult] = await Promise.all([
      this.client.buscaCidadao(token, input.cpfComprador),
      this.client.buscaEndereco(token, input.cepComprador)
    ])

    if (!cidadaoResult?.result) {
      return {
        showSnackbar: {
          variant: 'error',
          title: 'Erro',
          description: 'CPF do comprador não encontrado'
        }
      }
    }

    if (!enderecoResult?.result) {
      return {
        showSnackbar: {
          variant: 'error',
          title: 'Erro',
          description: 'CEP não encontrado'
        }
      }
    }

    const cidadao = cidadaoResult.result
    const endereco = enderecoResult.result

    const enderecoFormatado = [
      cidadao.logradouro ? `${cidadao.tipoLogradouro ?? ''} ${cidadao.logradouro}`.trim() : endereco.logradouro,
      cidadao.numeroLogradouro,
      cidadao.bairro || endereco.bairro,
      `${endereco.municipio} - ${endereco.uf}`
    ].filter(Boolean).join(', ')

    return {
      nomeComprador: cidadao.nome,
      cpfComprador: cidadao.cpf,
      enderecoComprador: enderecoFormatado
    }
  }
}
