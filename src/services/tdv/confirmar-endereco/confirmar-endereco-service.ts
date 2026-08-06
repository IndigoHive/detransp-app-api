import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ConfirmarEnderecoInput = {
  codigoTransferencia: string
  cepComprador?: string
}

export type ConfirmarEnderecoResult = {
  proximaAcao: 'aviso_pagamento' | 'pagamento_confirmado' | 'concluido'
  estado: CodigoEstadoTDV
} | {
  showSnackbar: {
    variant: string
    title: string
    description: string
  }
}

function mapProximaAcao (estado: CodigoEstadoTDV | undefined): ConfirmarEnderecoResult {
  if (estado === CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA) {
    return { proximaAcao: 'aviso_pagamento', estado }
  }
  if (estado === CodigoEstadoTDV.TAXA_SERVICO_PAGA) {
    return { proximaAcao: 'pagamento_confirmado', estado }
  }
  if (estado === CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA) {
    return { proximaAcao: 'concluido', estado }
  }

  return {
    showSnackbar: {
      variant: 'error',
      title: 'Erro',
      description: 'Estado da transferência inválido para continuar'
    }
  }
}

function normalizeCep (cep: string | undefined): string | undefined {
  const digits = cep?.replace(/\D/g, '')
  return digits && digits.length === 8 ? digits : undefined
}

export class ConfirmarEnderecoService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: ConfirmarEnderecoInput): Promise<ConfirmarEnderecoResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const cep = normalizeCep(input.cepComprador)
    if (cep) {
      const enderecoResult = await this.client.buscaEndereco(auth, cep)
      const endereco = enderecoResult?.result

      await this.client.atualizaTdv(auth, input.codigoTransferencia, {
        cepComprador: cep,
        bairroComprador: endereco?.bairro ?? '',
        logradouroComprador: endereco?.logradouro ?? endereco?.endereco ?? '',
        numeroComprador: '',
        complementoComprador: endereco?.complemento ?? ''
      })
    }

    const tdv = await this.client.buscaTdv(auth, input.codigoTransferencia)
    return mapProximaAcao(tdv?.result?.estado)
  }
}
