import type { DetranSpServiceNowLicenciamentoClient } from '../../../clients/detran-sp-service-now-licenciamento'
import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import { DetranSpServiceNowLicenciamentoError } from '../../../clients/detran-sp-service-now-licenciamento/errors/detran-sp-service-now-licenciamento-error'
import type { DebitoData, ListaMultasData, ListaVeiculosVeiculoData } from '../../../clients/detran-sp-service-now-licenciamento/types'
import { formatCurrency } from '../../../utils/currency'
import type {
  LicenciamentoVeiculoAuth,
  VehicleItem,
  VehicleAttributes,
  VehicleRestrictions,
  VerificacaoVeiculoResult,
  VehicleStatus,
} from '../types'
import { toVehicleItemFromLista, mapStatus } from '../utils'

export class VerificaVeiculoLicenciamentoService {
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
          : {}
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
      } else if (err.type === 'FalhaNaOperacaoError') {
        return this.buildResult(vehicle, 'VENCIDO', { isBlocked: false, isGnvBlocked: false, hasMultaForaDoSistema: false, isLicensingOverdue })
      } else {
        return this.buildResult(vehicle, 'VENCIDO', { isBlocked: true, isGnvBlocked: false, hasMultaForaDoSistema: false, isLicensingOverdue })
      }
    }

    const debitosData = await this.fetchDebitos(auth)
    const multasDetail = hasMultaForaDoSistema ? await this.fetchMultas(auth) : {}
    const { vehicleAttributes, restrictions } = await this.fetchDebRestrData(auth)

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
      vehicleAttributes,
      restrictions,
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
