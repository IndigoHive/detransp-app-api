import type { BuscaTdvResultData } from '../../clients/detran-sp-service-now/tdv/types'

export function isTermoCienciaConfirmado (tdv: BuscaTdvResultData | undefined): boolean {
  const flag = tdv?.confirmacaoTermoCienciaResponsabilidade
  return flag === '1' || flag === 'true' || Boolean(tdv?.codigoAnexoTermoCienciaResponsabilidade)
}
