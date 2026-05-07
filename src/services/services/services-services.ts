import { asClass, NameAndRegistrationPair } from 'awilix'
import { GetVehiclesService } from './get-vehicles-service'

export type ServicesServices = {
  getVehiclesService: GetVehiclesService
}

export function getServicesRegistrations (): Required<NameAndRegistrationPair<ServicesServices>> {
  return {
    getVehiclesService: asClass(GetVehiclesService).scoped(),
  }
}
