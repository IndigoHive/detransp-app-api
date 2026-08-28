import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { formatCep } from '../../../utils/format-document'
import { sanitizeEnderecoComplemento } from '../../../utils/sanitize-endereco-complemento'
import { composeLogradouro } from '../../../utils/compose-logradouro'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

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

// Formato pedido pelo Detran para a tela de confirmação do vendedor (s_3a0b04432a52):
// "RUA BOA VISTA, 209, CASA 2, CENTRO, 01014-001, SAO PAULO, SP". É a mesma sequência do
// formatEnderecoComprador() — usado nas telas que leem o endereço já gravado na TDV — só que
// com o CEP antes do município em vez de no fim, e a UF como item próprio.
function formatEnderecoConfirmacao (partes: {
  logradouro: string
  numero: string | undefined
  complemento: string | undefined
  bairro: string
  cep: string
  municipio: string
  uf: string
}): string {
  return [
    partes.logradouro,
    partes.numero,
    partes.complemento,
    partes.bairro,
    partes.cep.trim() ? formatCep(partes.cep) : undefined,
    partes.municipio,
    partes.uf
  ].map(valor => valor?.trim()).filter(Boolean).join(', ')
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
    // que o vendedor viu e da que fica registrada.
    const enderecoComprador = formatEnderecoConfirmacao({
      logradouro: composeLogradouro(endereco),
      numero: input.numeroComprador,
      complemento: sanitizeEnderecoComplemento(input.complementoComprador ?? ''),
      bairro: endereco.bairro,
      cep: endereco.cep,
      municipio: endereco.municipio || endereco.localidade,
      uf: endereco.uf
    })

    return {
      nomeComprador: cidadao.nome,
      cpfComprador: cidadao.cpf,
      enderecoComprador
    }
  }
}
