import type { DetranSpServiceNowLicenciamentoClient } from '../../../clients/detran-sp-service-now-licenciamento'
import type { LicenciamentoAuth, VehicleItem } from '../types'
import { toVehicleItemFromLista } from '../utils'

export class ListaVeiculosLicenciamentoService {
  private readonly client: DetranSpServiceNowLicenciamentoClient

  constructor(client: DetranSpServiceNowLicenciamentoClient) {
    this.client = client
  }

  async run(auth: LicenciamentoAuth): Promise<{ vehicles: VehicleItem[]; totalVehicles: number }> {
    const result = await this.client.listaVeiculos(auth)
    const vehicles = (result?.result ?? []).map(toVehicleItemFromLista)
    const totalVehicles = vehicles.length
    return { vehicles, totalVehicles }
  }
}
