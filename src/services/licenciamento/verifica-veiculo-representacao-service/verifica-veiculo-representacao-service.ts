import type { DetranSpServiceNowLicenciamentoClient } from '../../../clients/detran-sp-service-now-licenciamento'
import { DetranSpServiceNowLicenciamentoError } from '../../../clients/detran-sp-service-now-licenciamento/errors/detran-sp-service-now-licenciamento-error'
import type { DebitoData } from '../../../clients/detran-sp-service-now-licenciamento/types'
import { formatCurrency } from '../../../utils/currency'
import type {
  LicenciamentoVeiculoAuth,
  MultasDetail,
  VehicleItem,
  VerificacaoVeiculoResult,
} from '../types'
import { toVehicleItemFromVerifica } from '../utils'

const EMPTY_DEBITS_RESULT = {
  debts: [] as DebitoData[],
  totalDebits: 0,
  onlyLicensing: false,
  hasPayableDebts: false,
}

export class VerificaVeiculoRepresentacaoService {
  private readonly licenciamentoClient: DetranSpServiceNowLicenciamentoClient


  constructor(
    licenciamentoClient: DetranSpServiceNowLicenciamentoClient,
  ) {
    this.licenciamentoClient = licenciamentoClient
  }

  async run(auth: LicenciamentoVeiculoAuth): Promise<VerificacaoVeiculoResult | undefined> {
    const vehicleBase = await this.fetchVehicleBase(auth)

    try {
      const verifyResult = await this.licenciamentoClient.verificaVeiculo(auth, auth.renavam)
      const data = verifyResult?.result
      if (!data) {
        return this.buildResult(vehicleBase ?? null, 'VENCIDO', { isBlocked: false, isGnvBlocked: false, hasMultaForaDoSistema: false })
      }

      const vehicle = vehicleBase ?? toVehicleItemFromVerifica(data)
      const vigency = vehicle.licensingStatus
      const isLicensingOverdue = vigency !== 'REGULAR'

      const debitosData = await this.fetchDebitos(auth)
      const multasDetail = debitosData.debts.some(d => d.tipoServico === 7)
        ? await this.fetchMultas(auth)
        : { items: [], total: formatCurrency(0) }

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

      if (err.type === 'VeiculoSemCertificadoGNVVigenteError') {
        const debitosData = await this.fetchDebitos(auth)
        const multasDetail = await this.fetchMultas(auth)
        return {
          vehicle: vehicleBase ?? {
            id: auth.renavam,
            renavam: auth.renavam,
            plate: auth.placa,
            title: '',
            brandModel: '',
            licensingStatus: 'VENCIDO',
            licensingExpirationDate: '',
          },
          vigency: 'VENCIDO',
          isBlocked: false,
          isGnvBlocked: true,
          hasMultaForaDoSistema: false,
          onlyLicensing: false,
          hasPayableDebts: debitosData.hasPayableDebts,
          isLicensingOverdue: true,
          debts: debitosData.debts,
          result: debitosData.debts,
          totalDebits: formatCurrency(debitosData.totalDebits),
          multasDetail,
        }
      }

      if (err.type === 'VeiculoComMultaForaDoSistemaError') {
        const debitosData = await this.fetchDebitos(auth)
        const multasDetail = await this.fetchMultas(auth)
        return {
          vehicle: vehicleBase ?? {
            id: auth.renavam,
            renavam: auth.renavam,
            plate: auth.placa,
            title: '',
            brandModel: '',
            licensingStatus: 'VENCIDO',
            licensingExpirationDate: '',
          },
          vigency: 'VENCIDO',
          isBlocked: false,
          isGnvBlocked: false,
          hasMultaForaDoSistema: true,
          onlyLicensing: debitosData.onlyLicensing,
          hasPayableDebts: debitosData.hasPayableDebts,
          isLicensingOverdue: true,
          debts: debitosData.debts,
          result: debitosData.debts,
          totalDebits: formatCurrency(debitosData.totalDebits),
          multasDetail,
        }
      }
    }
  }

  private async fetchVehicleBase(auth: LicenciamentoVeiculoAuth): Promise<VehicleItem | null> {
    try {
      const result = await this.licenciamentoClient.buscaVeiculo(auth, auth.renavam)
      const data = result?.result
      return data ? toVehicleItemFromVerifica(data) : null
    } catch {
      return null
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
      multasDetail: { items: [], total: formatCurrency(0) },
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

  private async fetchMultas(auth: LicenciamentoVeiculoAuth): Promise<MultasDetail> {
    try {
      const result = await this.licenciamentoClient.listaMultas(auth, auth.renavam)
      const items = result?.result?.map(multa => {
        const formattedDataInfracao = multa?.dataInfracao
           ? multa?.dataInfracao?.split('T')[0]?.split('-').reverse().join('/')
           : ''
        return {
          ...multa,
          dataInfracao: formattedDataInfracao ?? '',
        }
      }) ?? []
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
