export type GetVehiclesResult = {
  vehicles: Array<{
    id: string
    title: string
    plate: string
    status: string
    licensingExpirationDate: string
    type: string
    brandModel: string
    renavam: string
    lastLicensing: string
    yearFab: string
    yearMod: string
  }>
}

export class GetVehiclesService {
  async run (): Promise<GetVehiclesResult> {
    return {
      vehicles: [
        {
          id: '1',
          title: 'VOLKS/GOL GTI 1.0',
          plate: 'BXG3U71',
          status: 'REGULAR',
          licensingExpirationDate: '31/12/2025',
          type: 'Utilitario',
          brandModel: 'VOLKS/GOL GTI 1.0',
          renavam: '00001002003',
          lastLicensing: '03/12/2025',
          yearFab: '2014',
          yearMod: '2015'
        },
        {
          id: '3',
          title: 'FIAT/UNO MILLE',
          plate: 'RNI4Z30',
          status: 'VENCIDO',
          licensingExpirationDate: '31/07/2023',
          type: 'Utilitario',
          brandModel: 'FIAT/UNO MILLE',
          renavam: '00003004005',
          lastLicensing: '20/08/2022',
          yearFab: '2008',
          yearMod: '2009'
        }
      ]
    }
  }
}
