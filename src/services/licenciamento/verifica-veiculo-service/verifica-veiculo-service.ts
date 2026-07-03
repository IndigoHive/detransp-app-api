import type { DetranSpServiceNowLicenciamentoClient } from '../../../clients/detran-sp-service-now-licenciamento'
import { DetranSpServiceNowLicenciamentoError } from '../../../clients/detran-sp-service-now-licenciamento/errors/detran-sp-service-now-licenciamento-error'
import type { DebitoData, ListaVeiculosVeiculoData } from '../../../clients/detran-sp-service-now-licenciamento/types'
import { formatCurrency } from '../../../utils/currency'
import type {
  LicenciamentoVeiculoAuth,
  MultasDetail,
  VehicleItem,
  VerificacaoVeiculoResult,
  VehicleStatus,
} from '../types'
import { toVehicleItemFromLista, mapStatus } from '../utils'

export class VerificaVeiculoLicenciamentoService {
  private readonly licenciamentoClient: DetranSpServiceNowLicenciamentoClient

  constructor(
    licenciamentoClient: DetranSpServiceNowLicenciamentoClient,
  ) {
    this.licenciamentoClient = licenciamentoClient
  }

  async run(auth: LicenciamentoVeiculoAuth): Promise<VerificacaoVeiculoResult> {
    const veiculosResult = await this.licenciamentoClient.listaVeiculos(auth)
    const vehicleFromList = (veiculosResult?.result ?? []).find(
      (v: ListaVeiculosVeiculoData) => v.codigoRenavamVeiculo === auth.renavam
   )
    const vehicle: VehicleItem | undefined = vehicleFromList ? toVehicleItemFromLista(vehicleFromList) : undefined

    let hasMultaForaDoSistema = false
    let vigency: VehicleStatus = 'VENCIDO'
    const isLicensingOverdue = vehicle?.status === 'VENCIDO'

    try {
      const verifyResult = await this.licenciamentoClient.verificaVeiculo(auth, auth.renavam)
      vigency = mapStatus(verifyResult?.result?.situacaoLicenciamento)
    } catch (err) {
      if (!(err instanceof DetranSpServiceNowLicenciamentoError)) throw err

      if (err.type === 'VeiculoComPendenciaError') {
        return this.buildResult(vehicle, 'VENCIDO', { isBlocked: true, isGnvBlocked: false, hasMultaForaDoSistema: false, isLicensingOverdue })
      }

      if (err.type === 'VeiculoSemCertificadoGNVVigenteError') {
        const debitosData = await this.fetchDebitos(auth)
        const multasDetail = debitosData.debts.some(d => d.tipoServico === 7)
          ? await this.fetchMultas(auth)
          : { items: [], total: formatCurrency(0) }
        return {
          vehicle,
          vigency: 'VENCIDO',
          isBlocked: false,
          isGnvBlocked: true,
          hasMultaForaDoSistema: false,
          onlyLicensing: false,
          hasPayableDebts: debitosData.hasPayableDebts,
          isLicensingOverdue,
          debts: debitosData.debts,
          result: debitosData.debts,
          totalDebits: formatCurrency(debitosData.totalDebits),
          multasDetail,
        }
      }

      if (err.type === 'VeiculoComMultaForaDoSistemaError') {
        hasMultaForaDoSistema = true
      } else {
        throw err
      }
    }

    const debitosData = await this.fetchDebitos(auth)
    const multasDetail = hasMultaForaDoSistema ? await this.fetchMultas(auth) : { items: [], total: formatCurrency(0) }


    return {
      vehicle,
      vigency,
      isBlocked: false,
      isGnvBlocked: false,
      hasMultaForaDoSistema,
      onlyLicensing: debitosData.onlyLicensing,
      hasPayableDebts: debitosData.hasPayableDebts,
      isLicensingOverdue: hasMultaForaDoSistema ? isLicensingOverdue : vigency !== 'REGULAR',
      debts: debitosData.debts,
      result: debitosData.debts,
      totalDebits: formatCurrency(debitosData.totalDebits),
      multasDetail,
    }
  }

  private buildResult(
    vehicle: VehicleItem | undefined,
    vigency: VehicleStatus,
    flags: Pick<VerificacaoVeiculoResult, 'isBlocked' | 'isGnvBlocked' | 'hasMultaForaDoSistema' | 'isLicensingOverdue'>
  ): VerificacaoVeiculoResult {
    return {
      vehicle,
      vigency,
      ...flags,
      onlyLicensing: false,
      hasPayableDebts: false,
      debts: [],
      result: [],
      totalDebits: formatCurrency(0),
      multasDetail: { items: [], total: formatCurrency(0) },
    }
  }

  private async fetchDebitos(auth: LicenciamentoVeiculoAuth): Promise<{
    debts: DebitoData[]
    totalDebits: number
    onlyLicensing: boolean
    hasPayableDebts: boolean
  }> {
    try {
      const result = await this.licenciamentoClient.listaDebitosVeiculo(auth, auth.renavam)
      const debts: DebitoData[] = result?.result ?? []
      return {
        debts,
        totalDebits: debts.reduce((sum, d) => sum + d.valor, 0),
        onlyLicensing: debts.length > 0 && debts.every(d => d.tipoServico === 5),
        hasPayableDebts: debts.some(d => d.tipoServico === 6 || d.tipoServico === 7),
      }
    } catch (err) {
      if (!(err instanceof DetranSpServiceNowLicenciamentoError)) throw err
      return {
        debts: [],
        totalDebits: 0,
        onlyLicensing: false,
        hasPayableDebts: false,
      }
    }
  }

  private async fetchMultas(auth: LicenciamentoVeiculoAuth): Promise<MultasDetail> {
    try {
      const result = await this.licenciamentoClient.listaMultas(auth, auth.renavam)
      const items = result?.result?.map(multa => ({
        ...multa,
        dataInfracao: new Date(multa.dataInfracao).toLocaleDateString(),
      })) ?? []

      return {
        items,
        total: formatCurrency(items.reduce((sum, m) => sum + (m.valor ?? 0), 0)),
      }
    } catch (err) {
      if (!(err instanceof DetranSpServiceNowLicenciamentoError)) throw err
      return { items: [], total: formatCurrency(0) }
    }
  }
}
