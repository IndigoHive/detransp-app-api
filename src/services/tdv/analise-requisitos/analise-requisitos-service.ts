import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import {
  CodigoEstadoTDV,
  CodigoOrigemTDV
} from '../../../clients/detran-sp-service-now/tdv/types'
import type { Config } from '../../../types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'
import { compradorDisplayFieldsFromTdv, chassiVeiculoFrom } from '../comprador-display-fields'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
  config: Config
}

export type AnaliseRequisitosInput = {
  selectedVehicle: {
    plate: string
    renavam: string
    [key: string]: unknown
  }
}

export type AnaliseRequisitosSuccess = {
  hasActiveTDV: boolean
  codigoTransferencia?: string | undefined
  // Raw ServiceNow estado of the active TDV, if any — lets the flow branch resume
  // behavior (e.g. skip straight to the final confirmation once sale data is already in).
  estado?: string | undefined
  // Set only when the picked vehicle is ready to move straight into a specific step —
  // 'vendedor_2' when the buyer already signed and it's the seller's turn,
  // 'vendedor_loja_assinar' for the origem 5 equivalent (see proximaAcaoParaVendedor), and
  // 'nova_tdv' when there's nothing blocking a brand new sale. Left unset for every other
  // active state (including states 1-5, still resumable by the seller) — those go through the
  // existing "TDV aberta?" prompt instead, which is also where cancellation (allowed up to
  // estado 6) is offered.
  proximaAcao?: 'vendedor_2' | 'vendedor_loja_assinar' | 'nova_tdv' | undefined
  // Buyer name, surfaced once known so the seller's re-entry screens (e.g. "comprador assinou")
  // can display who signed without a separate lookup.
  nomeComprador?: string | undefined
  // Vehicle color, same rationale as nomeComprador — the seller's re-entry screens show it
  // without a separate vehicle lookup.
  descricaoCorVeiculo?: string | undefined
  // TDV.origem from ServiceNow — the seller flow branches on this after liveness
  // (origem 5 = Entrada Renave / venda para loja). Not present on the vehicle list.
  origem?: CodigoOrigemTDV | undefined
  cpfComprador?: string | undefined
  emailComprador?: string | undefined
  enderecoComprador?: string | undefined
  // Chassis, same rationale as descricaoCorVeiculo — Confirmação dados loja reads it from
  // this node (and Criar TDV), not from the vehicle picker.
  chassiVeiculo?: string | undefined
  // Origem 5 only: the TCR text comes rendered by ServiceNow, the same way the app in production
  // shows it. The flow keeps a composed fallback for when the record has none.
  termoCienciaResponsabilidade?: string | undefined
}

export type AnaliseRequisitosResult = AnaliseRequisitosSuccess | {
  showSnackbar: {
    variant: string
    title: string
    description: string
  }
}

// The seller only has a forced next step once estado 6 is reached — every other active state,
// including still filling in buyer/sale data (1-2) or waiting on the buyer (3-5), goes through
// the "TDV aberta?" prompt so cancellation stays available up to estado 6.
//
// What estado 6 means depends on the version: on TDV 1.0 the buyer signed the ATPV-e and it is
// the seller's turn, but on origem 5 (Entrada Renave) no buyer ever signs in the app — estado 6
// there is the seller's own TCR acceptance, so they resume at their signature screen instead.
function proximaAcaoParaVendedor (
  estado: CodigoEstadoTDV | undefined,
  origem: CodigoOrigemTDV | undefined
): AnaliseRequisitosSuccess['proximaAcao'] {
  if (estado !== CodigoEstadoTDV.ATPVE_ASSINADA_COMPRADOR) return undefined
  return origem === CodigoOrigemTDV.ENTRADA_RENAVE ? 'vendedor_loja_assinar' : 'vendedor_2'
}

export class AnaliseRequisitosService {
  private readonly client: DetranSpServiceNowTdvClient
  private readonly forceVehicleRestriction: boolean

  constructor ({ detranSpServiceNowTdv, config }: Dependencies) {
    this.client = detranSpServiceNowTdv
    this.forceVehicleRestriction = config.tdvMock.forceVehicleRestriction
  }

  async run (authorizationHeader: string | undefined, input: AnaliseRequisitosInput): Promise<AnaliseRequisitosResult> {
    // Dev/QA-only escape hatch: the real restriction check isn't implemented yet (see TODO
    // below), so this is the only way to exercise the restriction toast end to end.
    if (this.forceVehicleRestriction) {
      return {
        showSnackbar: {
          variant: 'error',
          title: 'Erro',
          description: 'Esse veículo tem restrição e não pode ser transferido. Regularize a pendência com o órgão responsável.'
        }
      }
    }

    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    // Check for existing active TDV on this plate
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

    if (activeTdv) {
      const chassiVeiculo = chassiVeiculoFrom(activeTdv, input.selectedVehicle)

      const termoCienciaResponsabilidade = activeTdv.termoCienciaResponsabilidade?.trim()

      return {
        hasActiveTDV: true,
        codigoTransferencia: activeTdv.codigoTransferenciaVeiculo ?? undefined,
        estado: activeTdv.estado,
        proximaAcao: proximaAcaoParaVendedor(activeTdv.estado, activeTdv.origem ?? undefined),
        ...(activeTdv.origem != null ? { origem: activeTdv.origem } : {}),
        ...compradorDisplayFieldsFromTdv(activeTdv),
        ...(chassiVeiculo ? { chassiVeiculo } : {}),
        ...(termoCienciaResponsabilidade ? { termoCienciaResponsabilidade } : {})
      }
    }

    // TODO: real restriction check not implemented yet. Once it is, a restricted vehicle
    // should short-circuit with a snackbar error response (see other tdv services), not a
    // boolean field here — the seller needs the specific reason, not a generic dead-end screen.

    const chassiVeiculo = chassiVeiculoFrom(undefined, input.selectedVehicle)

    return {
      hasActiveTDV: false,
      proximaAcao: 'nova_tdv',
      ...(chassiVeiculo ? { chassiVeiculo } : {})
    }
  }
}
