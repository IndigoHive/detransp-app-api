import type { DetranSpServiceNowLicenciamentoClient } from '../../../clients/detran-sp-service-now-licenciamento'
import { DetranSpServiceNowLicenciamentoError } from '../../../clients/detran-sp-service-now-licenciamento/errors/detran-sp-service-now-licenciamento-error'
import type { DebitoData, ListaMultasData } from '../../../clients/detran-sp-service-now-licenciamento/types'
import { formatCurrency } from '../../../utils/currency'
import type {
  LicenciamentoVeiculoAuth,
  VehicleItem,
  VerificacaoVeiculoResult,
} from '../types'
import { toVehicleItemFromVerifica } from '../utils'
import { Logger } from 'pino'

const EMPTY_DEBITS_RESULT = {
  debts: [] as DebitoData[],
  totalDebits: 0,
  onlyLicensing: false,
  hasPayableDebts: false,
  multasDetail: {} as Record<string, ListaMultasData[]>,
}

export class VerificaVeiculoRepresentacaoService {
  private readonly licenciamentoClient: DetranSpServiceNowLicenciamentoClient


  constructor(
    licenciamentoClient: DetranSpServiceNowLicenciamentoClient,
  ) {
    this.licenciamentoClient = licenciamentoClient
  }

  async run(auth: LicenciamentoVeiculoAuth): Promise<VerificacaoVeiculoResult | undefined> {
    try {
      const verifyResult = await this.licenciamentoClient.verificaVeiculo(auth, auth.renavam)
      const data = verifyResult?.result
      if (!data) {
        return this.buildResult(null, 'VENCIDO', { isBlocked: false, isGnvBlocked: false, hasMultaForaDoSistema: false })
      }

      const vehicle = toVehicleItemFromVerifica(data)
      const vigency = vehicle.status
      const isLicensingOverdue = vigency !== 'REGULAR'

      const debitosData = await this.fetchDebitos(auth)
      const multasDetail = debitosData.debts.some(d => d.tipoServico === 7)
        ? await this.fetchMultas(auth)
        : {}

      return {
        vehicle,
        vigency,
        isBlocked: false,
        isGnvBlocked: false,
        hasMultaForaDoSistema: false,
        onlyLicensing: debitosData.onlyLicensing,
        hasPayableDebts: debitosData.hasPayableDebts,
        isLicensingOverdue,
        debts: debitosData.debts,
        result: debitosData.debts,
        totalDebits: formatCurrency(debitosData.totalDebits),
        multasDetail,
      }
    } catch (err) {
      if (!(err instanceof DetranSpServiceNowLicenciamentoError)) throw err
    }
  }

  private buildResult(
    vehicle: VehicleItem | null,
    vigency: VerificacaoVeiculoResult['vigency'],
    flags: Pick<VerificacaoVeiculoResult, 'isBlocked' | 'isGnvBlocked' | 'hasMultaForaDoSistema'>
  ): VerificacaoVeiculoResult {
    return {
      vehicle,
      vigency,
      ...flags,
      onlyLicensing: false,
      hasPayableDebts: false,
      isLicensingOverdue: true,
      debts: EMPTY_DEBITS_RESULT.debts,
      result: EMPTY_DEBITS_RESULT.debts,
      totalDebits: formatCurrency(0),
      multasDetail: {},
    }
  }

  private async fetchDebitos(auth: LicenciamentoVeiculoAuth): Promise<{
    debts: DebitoData[]
    totalDebits: number
    onlyLicensing: boolean
    hasPayableDebts: boolean
  }> {
    const result = await this.licenciamentoClient.listaDebitosVeiculo(auth, auth.renavam)
    const debts: DebitoData[] = result?.result ?? []
    return {
      debts,
      totalDebits: debts.reduce((sum, d) => sum + d.valor, 0),
      onlyLicensing: debts.length > 0 && debts.every(d => d.tipoServico === 5),
      hasPayableDebts: debts.some(d => d.tipoServico === 6 || d.tipoServico === 7),
    }
  }

  private async fetchMultas(auth: LicenciamentoVeiculoAuth): Promise<Record<string, ListaMultasData[]>> {
    try {
      const result = await this.licenciamentoClient.listaMultas(auth, auth.renavam)
      const multasDetail: Record<string, ListaMultasData[]> = {}
      for (const m of result?.result ?? []) {
        multasDetail[m.autoInfracao] = [...(multasDetail[m.autoInfracao] ?? []), m]
      }
      return multasDetail
    } catch (err) {
      if (!(err instanceof DetranSpServiceNowLicenciamentoError)) throw err
      return {}
    }
  }
}
