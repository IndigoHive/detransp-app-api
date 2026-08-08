import { BadRequest } from 'http-errors'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import {
  CodigoEstadoTDV,
  type CodigoOrigemComunicacaoVendaVeiculo,
  type CodigoOrigemTDV
} from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken, extractEmailFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type CriarCompraInput = {
  placaVeiculo: string
  renavamVeiculo: string
  origem: CodigoOrigemTDV
  nomeVendedor: string
  codigoVendedor: string
  emailVendedor?: string
  cepComprador?: string
  ativa?: 'true' | 'false' | '1' | '0'
  estado?: CodigoEstadoTDV
  origemComunicacaoVendaVeiculo?: CodigoOrigemComunicacaoVendaVeiculo
  codigoTransferenciaVeiculo?: string
  descricaoMarcaVeiculo?: string
  codigoComprador?: string
  nomeComprador?: string
  nomeMunicipioVeiculo?: string
  nomeMunicipioComprador?: string
  chassiVeiculo?: string
  kmVeiculo?: string
  kmVistoriadaVeiculo?: string
  numeroComprador?: string
}

export type CriarCompraResult = {
  proximaAcao: 'aviso_pagamento' | 'pagamento_confirmado' | 'concluido'
  estado: CodigoEstadoTDV
} | {
  showSnackbar: {
    variant: string
    title: string
    description: string
  }
}

function mapProximaAcao (estado: CodigoEstadoTDV | undefined): CriarCompraResult {
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

function pickOptionalListingFields (input: CriarCompraInput) {
  const kmVistoriada = input.kmVistoriadaVeiculo?.trim() || input.kmVeiculo?.trim()
  return {
    ...(input.origemComunicacaoVendaVeiculo
      ? { origemComunicacaoVendaVeiculo: input.origemComunicacaoVendaVeiculo }
      : {}),
    ...(input.codigoTransferenciaVeiculo?.trim()
      ? { codigoTransferenciaVeiculo: input.codigoTransferenciaVeiculo.trim() }
      : {}),
    ...(input.descricaoMarcaVeiculo?.trim()
      ? { descricaoMarcaVeiculo: input.descricaoMarcaVeiculo.trim() }
      : {}),
    ...(input.codigoComprador?.trim() ? { codigoComprador: input.codigoComprador.trim() } : {}),
    ...(input.nomeComprador?.trim() ? { nomeComprador: input.nomeComprador.trim() } : {}),
    ...(input.nomeMunicipioVeiculo?.trim()
      ? { nomeMunicipioVeiculo: input.nomeMunicipioVeiculo.trim() }
      : {}),
    ...(input.nomeMunicipioComprador?.trim()
      ? { nomeMunicipioComprador: input.nomeMunicipioComprador.trim() }
      : {}),
    ...(input.chassiVeiculo?.trim() ? { chassiVeiculo: input.chassiVeiculo.trim() } : {}),
    ...(kmVistoriada ? { kmVistoriadaVeiculo: kmVistoriada } : {}),
    ...(input.numeroComprador?.trim() ? { numeroComprador: input.numeroComprador.trim() } : {})
  }
}

export class CriarCompraService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: CriarCompraInput): Promise<CriarCompraResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const email = extractEmailFromToken(token)
    const auth = { token, cpf }

    const placaVeiculo = input.placaVeiculo?.trim() ?? ''
    const renavamVeiculo = input.renavamVeiculo?.trim() ?? ''
    const nomeVendedor = input.nomeVendedor?.trim() ?? ''
    const codigoVendedor = input.codigoVendedor?.trim() ?? ''
    const emailVendedor = input.emailVendedor?.trim() ?? email
    const origem = input.origem

    if (!placaVeiculo || !renavamVeiculo || !nomeVendedor || !codigoVendedor || !origem) {
      throw BadRequest('placaVeiculo, renavamVeiculo, origem, nomeVendedor e codigoVendedor são obrigatórios')
    }

    const enriched = await this.enrichFromStub(auth, cpf, {
      ...input,
      placaVeiculo,
      renavamVeiculo
    })

    const cep = normalizeCep(enriched.cepComprador)
    const addressFields = cep
      ? await this.resolveAddressFields(auth, cep, enriched.numeroComprador)
      : (enriched.numeroComprador?.trim()
        ? { numeroComprador: enriched.numeroComprador.trim() }
        : {})

    const optionalFields = pickOptionalListingFields(enriched)
    const criaTdvPayload = {
      ...optionalFields,
      ...addressFields,
      codigoRenavamVeiculo: renavamVeiculo,
      placaVeiculo,
      nomeVendedor,
      emailVendedor,
      codigoVendedor,
      origem
    }

    const createResult = await this.client.criaTdv(auth, criaTdvPayload)

    const codigoTransferencia = createResult?.result?.codigoTransferenciaVeiculo
    if (!codigoTransferencia) {
      throw new Error('Falha ao criar transferência')
    }

    const tdv = await this.client.buscaTdv(auth, codigoTransferencia)
    return mapProximaAcao(tdv?.result?.estado)
  }

  private async enrichFromStub (
    auth: { token: string, cpf: string },
    cpf: string,
    input: CriarCompraInput
  ): Promise<CriarCompraInput> {
    const needsChassi = !input.chassiVeiculo?.trim()
    const needsKmVistoriada = !input.kmVistoriadaVeiculo?.trim()
    const needsNumero = !input.numeroComprador?.trim()
    if (!needsChassi && !needsKmVistoriada && !needsNumero) {
      return input
    }

    const listed = await this.client.listaTdvs(auth, {
      ativa: 'true',
      codigoComprador: cpf
    })
    const stub = listed?.result?.find((tdv) =>
      (tdv.placaVeiculo ?? '') === input.placaVeiculo
      && (tdv.codigoRenavamVeiculo ?? '') === input.renavamVeiculo
    )

    if (!stub) return input

    return {
      ...input,
      ...(needsChassi && stub.chassiVeiculo?.trim()
        ? { chassiVeiculo: stub.chassiVeiculo.trim() }
        : {}),
      ...(needsKmVistoriada && stub.kmVistoriadaVeiculo?.trim()
        ? { kmVistoriadaVeiculo: stub.kmVistoriadaVeiculo.trim() }
        : {}),
      ...(needsNumero && stub.numeroComprador?.trim()
        ? { numeroComprador: stub.numeroComprador.trim() }
        : {})
    }
  }

  private async resolveAddressFields (
    auth: { token: string, cpf: string },
    cep: string,
    numeroComprador?: string
  ) {
    const enderecoResult = await this.client.buscaEndereco(auth, cep)
    const endereco = enderecoResult?.result
    const numero = numeroComprador?.trim() ?? ''

    return {
      cepComprador: cep,
      bairroComprador: endereco?.bairro ?? '',
      logradouroComprador: endereco?.logradouro ?? endereco?.endereco ?? '',
      ...(numero ? { numeroComprador: numero } : { numeroComprador: '' }),
      complementoComprador: endereco?.complemento ?? ''
    }
  }
}
