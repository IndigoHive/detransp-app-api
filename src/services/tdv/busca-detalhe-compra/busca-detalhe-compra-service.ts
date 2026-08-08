import { BadRequest } from 'http-errors'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type BuscaDetalheCompraInput = {
  codigoTransferencia: string
}

export type BuscaDetalheCompraResult = {
  enderecoComprador: string
  cepComprador: string
  logradouroComprador: string
  numeroComprador: string
  complementoComprador: string
  bairroComprador: string
  autodeclaracaoResidenciaComprador: string
  nomeComprador: string
}

const CAMPOS = [
  'cepComprador',
  'bairroComprador',
  'logradouroComprador',
  'numeroComprador',
  'complementoComprador',
  'autodeclaracaoResidenciaComprador',
  'nomeComprador'
].join(',')

export class BuscaDetalheCompraService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (
    authorizationHeader: string | undefined,
    input: BuscaDetalheCompraInput
  ): Promise<BuscaDetalheCompraResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const codigoTransferencia = input.codigoTransferencia?.trim() ?? ''
    if (!codigoTransferencia) {
      throw BadRequest('codigoTransferencia é obrigatório')
    }

    const tdv = await this.client.buscaTdv(auth, codigoTransferencia, CAMPOS)
    const data = tdv?.result

    const logradouroComprador = data?.logradouroComprador ?? ''
    const numeroComprador = data?.numeroComprador ?? ''
    const complementoComprador = data?.complementoComprador ?? ''
    const bairroComprador = data?.bairroComprador ?? ''
    const cepComprador = data?.cepComprador ?? ''

    return {
      enderecoComprador: [
        logradouroComprador,
        numeroComprador,
        complementoComprador,
        bairroComprador,
        cepComprador
      ].filter(Boolean).join(', '),
      cepComprador,
      logradouroComprador,
      numeroComprador,
      complementoComprador,
      bairroComprador,
      autodeclaracaoResidenciaComprador: data?.autodeclaracaoResidenciaComprador ?? '',
      nomeComprador: data?.nomeComprador ?? ''
    }
  }
}
