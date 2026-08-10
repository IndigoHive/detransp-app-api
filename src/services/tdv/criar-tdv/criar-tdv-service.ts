import { UnprocessableEntity } from 'http-errors'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV, CodigoOrigemTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { sanitizeEnderecoComplemento } from '../../../utils/sanitize-endereco-complemento'
import { extractBearerToken, extractCpfFromToken, extractNameFromToken, extractEmailFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type CriarTdvInput = {
  placaVeiculo: string
  renavamVeiculo: string
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

export type CriarTdvResult = {
  codigo: string
}

export class CriarTdvService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: CriarTdvInput): Promise<CriarTdvResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpfVendedor = extractCpfFromToken(token)
    const nomeVendedor = extractNameFromToken(token)
    const emailVendedor = extractEmailFromToken(token)
    const auth = { token, cpf: cpfVendedor }

    // Reuse an existing active TDV for this vehicle instead of failing with ATPVeExistenteError
    const tdvsAtivas = await this.client.listaTdvs(auth, {
      ativa: 'true',
      codigoVendedor: cpfVendedor,
      placaVeiculo: input.placaVeiculo
    })
    const tdvAtiva = tdvsAtivas?.result?.find(tdv => tdv.estado !== CodigoEstadoTDV.TRANSFERENCIA_CANCELADA)

    let codigoTransferencia = tdvAtiva?.codigoTransferenciaVeiculo

    if (!codigoTransferencia) {
      const createResult = await this.client.criaTdv(auth, {
        codigoRenavamVeiculo: input.renavamVeiculo,
        placaVeiculo: input.placaVeiculo,
        nomeVendedor,
        emailVendedor,
        codigoVendedor: cpfVendedor,
        origem: CodigoOrigemTDV.TDV
      })

      codigoTransferencia = createResult?.result?.codigoTransferenciaVeiculo
      if (!codigoTransferencia) {
        throw new Error('Falha ao criar transferência')
      }
    }

    const tdvAtual = (await this.client.buscaTdv(auth, codigoTransferencia))?.result
    let estadoAtual = tdvAtual?.estado ?? CodigoEstadoTDV.VEICULO_SELECIONADO

    if (!tdvAtual?.kmVistoriadaVeiculo) {
      throw new UnprocessableEntity('O veículo precisa ser vistoriado antes de prosseguir com a venda.')
    }

    if (Number(tdvAtual.kmVistoriadaVeiculo) > Number(input.quilometragem)) {
      throw new UnprocessableEntity(
        `A quilometragem do veículo não pode ser menor que a quilometragem vistoriada (${tdvAtual.kmVistoriadaVeiculo}).`
      )
    }

    if (estadoAtual === CodigoEstadoTDV.VEICULO_SELECIONADO) {
      // Fetch buyer address details from CEP
      const enderecoResult = await this.client.buscaEndereco(auth, input.cepComprador)
      const endereco = enderecoResult?.result

      // Step 2: Advance to state 2 (DADOS_VENDA_INFORMADOS)
      await this.client.atualizaTdv(auth, codigoTransferencia, {
        estado: CodigoEstadoTDV.DADOS_VENDA_INFORMADOS,
        codigoComprador: input.cpfComprador,
        nomeComprador: input.nomeComprador,
        emailComprador: input.emailComprador,
        cepComprador: input.cepComprador,
        bairroComprador: endereco?.bairro ?? '',
        logradouroComprador: endereco?.logradouro ?? endereco?.endereco ?? '',
        numeroComprador: input.numeroComprador,
        complementoComprador: sanitizeEnderecoComplemento(input.complementoComprador ?? ''),
        valorVendaVeiculo: input.valorVenda,
        kmVeiculo: input.quilometragem,
        codigoProvaVidaVendedor: input.codigoProvaVidaVendedor,
        tipoProvaVidaVendedor: '2' // LIVENESS
      })
      estadoAtual = CodigoEstadoTDV.DADOS_VENDA_INFORMADOS
    }

    if (estadoAtual === CodigoEstadoTDV.DADOS_VENDA_INFORMADOS) {
      // Step 3: Advance to state 3 (ATPVE_CRIADA)
      await this.client.atualizaTdv(auth, codigoTransferencia, {
        estado: CodigoEstadoTDV.ATPVE_CRIADA,
        codigoProvaVidaVendedor: input.codigoProvaVidaVendedor,
        tipoProvaVidaVendedor: '2' // LIVENESS
      })
    }

    return { codigo: codigoTransferencia }
  }
}
