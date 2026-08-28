import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { sanitizeEnderecoComplemento } from '../../../utils/sanitize-endereco-complemento'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'
import { formatEnderecoComprador } from '../comprador-display-fields'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ValidacaoCompradorInput = {
  cpfComprador: string
  cepComprador: string
  numeroComprador?: string
  complementoComprador?: string
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
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const [cidadaoResult, enderecoResult] = await Promise.all([
      this.client.buscaCidadao(auth, input.cpfComprador),
      this.client.buscaEndereco(auth, input.cepComprador)
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

    // O endereço sai só da busca por CEP — o BCadastro fica de fora, mesmo trazendo logradouro
    // e número do comprador. É o endereço que a tela do CEP acabou de mostrar ao vendedor
    // (CompradorCepService lê os mesmos campos) e é o que InformarDadosVendaService grava na
    // TDV; misturar o endereço cadastral aqui faria a confirmação exibir uma rua diferente da
    // que o vendedor viu e da que fica registrada. Mesmo formatador das telas seguintes, que
    // leem o endereço já gravado — assim as três não têm como divergir.
    const enderecoComprador = formatEnderecoComprador({
      logradouroComprador: endereco.logradouro ?? endereco.endereco,
      numeroComprador: input.numeroComprador ?? null,
      complementoComprador: sanitizeEnderecoComplemento(input.complementoComprador ?? ''),
      bairroComprador: endereco.bairro,
      nomeMunicipioComprador: endereco.municipio || endereco.localidade,
      ufComprador: endereco.uf,
      cepComprador: endereco.cep
    })

    return {
      nomeComprador: cidadao.nome,
      cpfComprador: cidadao.cpf,
      enderecoComprador: enderecoComprador ?? ''
    }
  }
}
