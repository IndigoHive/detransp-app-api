import type { DetranSpServiceNowLicenciamentoClient } from '../../../clients/detran-sp-service-now-licenciamento'
import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import { DetranSpServiceNowLicenciamentoError } from '../../../clients/detran-sp-service-now-licenciamento/errors/detran-sp-service-now-licenciamento-error'
import type { DebitoData, ListaMultasData } from '../../../clients/detran-sp-service-now-licenciamento/types'
import { formatCurrency } from '../../../utils/currency'
import type {
  LicenciamentoVeiculoAuth,
  VehicleItem,
  VehicleAttributes,
  VehicleRestrictions,
  VerificacaoVeiculoResult,
} from '../types'
import { toVehicleItemFromVerifica } from '../utils'

const EMPTY_DEBITS_RESULT = {
  debts: [] as DebitoData[],
  totalDebits: 0,
  onlyLicensing: false,
  hasPayableDebts: false,
  multasDetail: {} as Record<string, ListaMultasData[]>,
}

export class VerificaVeiculoRepresentacaoService {
  private readonly licenciamentoClient: DetranSpServiceNowLicenciamentoClient
  private readonly debRestrClient: DetranSpServiceNowDebRestrClient

  constructor(
    licenciamentoClient: DetranSpServiceNowLicenciamentoClient,
    debRestrClient: DetranSpServiceNowDebRestrClient,
  ) {
    this.licenciamentoClient = licenciamentoClient
    this.debRestrClient = debRestrClient
  }

  async run(auth: LicenciamentoVeiculoAuth): Promise<VerificacaoVeiculoResult> {
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
      const { vehicleAttributes, restrictions } = await this.fetchDebRestrData(auth)

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
        vehicleAttributes,
        restrictions,
      }
    } catch (err) {
      if (!(err instanceof DetranSpServiceNowLicenciamentoError)) throw err

      if (err.type === 'VeiculoComPendenciaError') {
        const vehicle = await this.resolveVehicleFromDebRestr(auth)
        return this.buildResult(vehicle, 'VENCIDO', { isBlocked: true, isGnvBlocked: false, hasMultaForaDoSistema: false })
      }

      if (err.type === 'VeiculoSemCertificadoGNVVigenteError') {
        const vehicle = await this.resolveVehicleFromDebRestr(auth)
        try {
          const debitosData = await this.fetchDebitos(auth)
          const multasDetail = debitosData.debts.some(d => d.tipoServico === 7)
            ? await this.fetchMultas(auth)
            : {}
          return {
            vehicle,
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
        } catch {
          return this.buildResult(vehicle, 'VENCIDO', { isBlocked: false, isGnvBlocked: true, hasMultaForaDoSistema: false })
        }
      }

      if (err.type === 'VeiculoComMultaForaDoSistemaError') {
        const vehicle = await this.resolveVehicleFromDebRestr(auth)
        try {
          const debitosData = await this.fetchDebitos(auth)
          const multasDetail = debitosData.debts.some(d => d.tipoServico === 7)
            ? await this.fetchMultas(auth)
            : {}
          return {
            vehicle,
            vigency: 'VENCIDO',
            isBlocked: false,
            isGnvBlocked: false,
            hasMultaForaDoSistema: true,
            onlyLicensing: false,
            hasPayableDebts: debitosData.hasPayableDebts,
            isLicensingOverdue: true,
            debts: debitosData.debts,
            result: debitosData.debts,
            totalDebits: formatCurrency(debitosData.totalDebits),
            multasDetail,
          }
        } catch {
          return this.buildResult(vehicle, 'VENCIDO', { isBlocked: false, isGnvBlocked: false, hasMultaForaDoSistema: true })
        }
      }

      if (err.type === 'FalhaNaOperacaoError') {
        const vehicle = await this.resolveVehicleFromDebRestr(auth)
        return this.buildResult(vehicle, 'VENCIDO', { isBlocked: false, isGnvBlocked: false, hasMultaForaDoSistema: false })
      }

      const vehicle = await this.resolveVehicleFromDebRestr(auth)
      return this.buildResult(vehicle, 'VENCIDO', { isBlocked: true, isGnvBlocked: false, hasMultaForaDoSistema: false })
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

  private async resolveVehicleFromDebRestr(auth: LicenciamentoVeiculoAuth): Promise<VehicleItem | null> {
    try {
      const result = await this.debRestrClient.consultaVeiculo(auth, auth.renavam)
      const attrs = result?.data?.attributes
      return {
        id: auth.renavam,
        renavam: auth.renavam,
        title: attrs?.marcaModelo?.descricao ?? auth.placa,
        brandModel: attrs?.marcaModelo?.descricao ?? auth.placa,
        plate: attrs?.placa ?? auth.placa,
        status: 'VENCIDO',
        licensingExpirationDate: '',
      }
    } catch {
      return null
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

  private async fetchDebRestrData(auth: LicenciamentoVeiculoAuth): Promise<{ vehicleAttributes?: VehicleAttributes | undefined; restrictions?: VehicleRestrictions | undefined }> {
    try {
      const result = await this.debRestrClient.consultaVeiculo(auth, auth.renavam)
      const attrs = result?.data?.attributes
      const meta = result?.data?.meta
      return {
        vehicleAttributes: attrs ? {
          chassi: attrs.chassi,
          yearFab: attrs.anoFabricacao?.toString(),
          yearMod: attrs.anoModelo?.toString(),
          cor: attrs.cor?.descricao,
          combustivel: attrs.combustivel?.descricao,
          tipo: attrs.tipo?.descricao,
        } : undefined,
        restrictions: meta ? {
          bloqueioFurtoRoubo: meta.bloqueioFurtoRoubo,
          restricaoTributaria: meta.restricaoTributaria,
          restricaoAdministrativa: meta.restricaoAdministrativa,
          restricaoJudicial: meta.restricaoJudicial,
          restricaoVeiculoGuinchado: meta.restricaoVeiculoGuinchado,
          nomeAgente: meta.nomeAgente,
        } : undefined,
      }
    } catch {
      return {}
    }
  }
}
