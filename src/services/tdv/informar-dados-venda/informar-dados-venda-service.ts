import { UnprocessableEntity } from 'http-errors'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { centsToReais } from '../../../utils/cents-to-reais'
import { sanitizeEnderecoComplemento } from '../../../utils/sanitize-endereco-complemento'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type InformarDadosVendaInput = {
  codigoTransferencia: string
  cpfComprador: string
  nomeComprador: string
  emailComprador: string
  cepComprador: string
  numeroComprador: string
  complementoComprador?: string
  valorVenda: string
  quilometragem: string
  codigoProvaVidaVendedor: string
}

export type InformarDadosVendaResult = {
  valorVenda: string
}

// Advances the TDV to state 2 (DADOS_VENDA_INFORMADOS) as soon as the seller submits the
// sale screen (value + mileage) — not batched with TDV creation or ATPV-e generation.
export class InformarDadosVendaService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: InformarDadosVendaInput): Promise<InformarDadosVendaResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const tdvAtual = (await this.client.buscaTdv(auth, input.codigoTransferencia))?.result
    const valorVendaReais = centsToReais(input.valorVenda)

    if (!tdvAtual?.kmVistoriadaVeiculo) {
      throw new UnprocessableEntity('O veículo precisa ser vistoriado antes de prosseguir com a venda.')
    }

    if (Number(tdvAtual.kmVistoriadaVeiculo) > Number(input.quilometragem)) {
      throw new UnprocessableEntity(
        'A quilometragem do veículo não pode ser menor que a quilometragem vistoriada.'
      )
    }

    // Idempotency guard: only move the state machine forward from the exact state this
    // transition expects. If the seller (or a retry/resume) calls this again after the TDV
    // already advanced past VEICULO_SELECIONADO, skip the mutation instead of re-sending it —
    // calling this endpoint twice must be safe.
    if (tdvAtual.estado === CodigoEstadoTDV.VEICULO_SELECIONADO) {
      const enderecoResult = await this.client.buscaEndereco(auth, input.cepComprador)
      const endereco = enderecoResult?.result

      await this.client.atualizaTdv(auth, input.codigoTransferencia, {
        estado: CodigoEstadoTDV.DADOS_VENDA_INFORMADOS,
        codigoComprador: input.cpfComprador,
        nomeComprador: input.nomeComprador,
        emailComprador: input.emailComprador,
        cepComprador: input.cepComprador,
        bairroComprador: endereco?.bairro ?? '',
        logradouroComprador: endereco?.logradouro ?? endereco?.endereco ?? '',
        numeroComprador: input.numeroComprador,
        complementoComprador: sanitizeEnderecoComplemento(input.complementoComprador ?? ''),
        valorVendaVeiculo: valorVendaReais,
        kmVeiculo: input.quilometragem,
        codigoProvaVidaVendedor: input.codigoProvaVidaVendedor,
        tipoProvaVidaVendedor: '2' // LIVENESS
      })
    }

    return { valorVenda: valorVendaReais }
  }
}
