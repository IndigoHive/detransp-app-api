import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV, CodigoOrigemTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type AnaliseRequisitosInput = {
  selectedVehicle: {
    plate: string
    renavam: string
    [key: string]: unknown
  }
}

export type AnaliseRequisitosResult = {
  hasRestriction: boolean
  hasActiveTDV: boolean
  codigoTransferencia?: string | undefined
  origem?: CodigoOrigemTDV
  estado?: string | undefined
  proximaAcao?: 'vendedor_2' | 'continuar_venda' | 'nova_tdv' | undefined
  buyer?: {
    codigo: string
    nome: string
    email: string
    cep: string
    bairro: string
    logradouro: string
    numero: string
    complemento: string
    municipio: string
    uf: string
  }
  sale?: {
    valor: string
    km: string
  }
}

function proximaAcaoParaVendedor (estado: CodigoEstadoTDV | undefined): AnaliseRequisitosResult['proximaAcao'] {
  switch (estado) {
    case CodigoEstadoTDV.ATPVE_ASSINADA_COMPRADOR: return 'vendedor_2'
    case CodigoEstadoTDV.VEICULO_SELECIONADO: return 'continuar_venda'
    case CodigoEstadoTDV.DADOS_VENDA_INFORMADOS: return 'continuar_venda'
    default: return undefined
  }
}

export class AnaliseRequisitosService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: AnaliseRequisitosInput): Promise<AnaliseRequisitosResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const tdvs = await this.client.listaTdvs(auth, {
      ativa: 'true',
      codigoVendedor: cpf,
      placaVeiculo: input.selectedVehicle.plate
    })

    // ServiceNow's `ativa` field is the string "1"/"0", not "true"/"false" — the ?ativa=true
    // query param already filters server-side, so estado is the only client-side check needed.
    const activeTdv = tdvs?.result?.find(
      tdv => tdv.estado !== CodigoEstadoTDV.TRANSFERENCIA_CANCELADA
    )

    if (!activeTdv) {
      return {
        hasRestriction: false,
        hasActiveTDV: false,
        proximaAcao: 'nova_tdv'
      }
    }

    const codigoTransferencia = activeTdv.codigoTransferenciaVeiculo
    const proximaAcao = proximaAcaoParaVendedor(activeTdv.estado)

    if (activeTdv.origem === CodigoOrigemTDV.RENAVE && codigoTransferencia) {
      const details = await this.client.buscaTdv(auth, codigoTransferencia)
      const data = details?.result

      return {
        hasRestriction: false,
        hasActiveTDV: true,
        codigoTransferencia,
        origem: activeTdv.origem,
        estado: activeTdv.estado,
        proximaAcao,
        ...(data ? {
          buyer: {
            codigo: data.codigoComprador ?? '',
            nome: data.nomeComprador ?? '',
            email: data.emailComprador ?? '',
            cep: data.cepComprador ?? '',
            bairro: data.bairroComprador ?? '',
            logradouro: data.logradouroComprador ?? '',
            numero: data.numeroComprador ?? '',
            complemento: data.complementoComprador ?? '',
            municipio: data.nomeMunicipioComprador ?? '',
            uf: data.ufComprador ?? ''
          },
          sale: {
            valor: data.valorVendaVeiculo ?? '',
            km: data.kmVeiculo ?? ''
          }
        } : {})
      }
    }

    return {
      hasRestriction: false,
      hasActiveTDV: true,
      ...(codigoTransferencia != null ? { codigoTransferencia } : {}),
      ...(activeTdv.origem != null ? { origem: activeTdv.origem } : {}),
      estado: activeTdv.estado,
      proximaAcao
    }
  }
}
