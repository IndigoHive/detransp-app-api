import { asClass, NameAndRegistrationPair } from 'awilix'
import { GetMeusVeiculosService } from './get-meus-veiculos-service/get-meus-veiculos-service'
import { GetDadosCondutorService } from './get-dados-condutor-service/get-dados-condutor-service'
import { GetTotalPontosCNHService } from './get-total-pontos-cnh-service/get-total-pontos-cnh-service'
import { GetDebitosPendentesService } from './get-debitos-pendentes-service/get-debitos-pendentes-service'
import { GetDetalhesPontosCNHService } from './get-detalhes-pontos-cnh-service/get-detalhes-pontos-cnh-service'
import { GetListaMultasService } from './get-lista-multas-service/get-lista-multas-service'
import { GetDetalhesMultaService } from './get-detalhes-multa-service/get-detalhes-multa-service'

export type DashboardServices = {
  getMeusVeiculosService: GetMeusVeiculosService
  getDadosCondutorService: GetDadosCondutorService
  getTotalPontosCNHService: GetTotalPontosCNHService
  getDebitosPendentesService: GetDebitosPendentesService
  getDetalhesPontosCNHService: GetDetalhesPontosCNHService
  getListaMultasService: GetListaMultasService
  getDetalhesMultaService: GetDetalhesMultaService
}

export function getDashboardRegistrations (): Required<NameAndRegistrationPair<DashboardServices>> {
  return {
    getMeusVeiculosService: asClass(GetMeusVeiculosService).scoped(),
    getDadosCondutorService: asClass(GetDadosCondutorService).scoped(),
    getTotalPontosCNHService: asClass(GetTotalPontosCNHService).scoped(),
    getDebitosPendentesService: asClass(GetDebitosPendentesService).scoped(),
    getDetalhesPontosCNHService: asClass(GetDetalhesPontosCNHService).scoped(),
    getListaMultasService: asClass(GetListaMultasService).scoped(),
    getDetalhesMultaService: asClass(GetDetalhesMultaService).scoped(),
  }
}
