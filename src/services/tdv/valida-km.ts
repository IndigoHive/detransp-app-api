import { UnprocessableEntity } from 'http-errors'
import type { BuscaTdvResultData } from '../../clients/detran-sp-service-now/tdv/types'

// Mirrors the rule the government API enforces with HTTP 406 on the TDV PATCH. Checked here
// first so the seller gets a specific message (and, via /validar-km, gets it before submitting).
export function assertKmValida (
  tdv: BuscaTdvResultData | undefined,
  quilometragem: string
): asserts tdv is BuscaTdvResultData {
  if (!tdv?.kmVistoriadaVeiculo) {
    throw new UnprocessableEntity('O veículo precisa ser vistoriado antes de prosseguir com a venda.')
  }

  if (Number(tdv.kmVistoriadaVeiculo) > Number(quilometragem)) {
    throw new UnprocessableEntity(
      'Revise e informe a km correta.'
    )
  }
}
