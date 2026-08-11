import { asFunction, NameAndRegistrationPair } from 'awilix'
import { GetMeusVeiculosService } from './get-meus-veiculos-service'
import { GetDebitosPendentesService } from './get-debitos-pendentes-service'
import { GetDetalhesPontosCnhService } from './get-detalhes-pontos-cnh-service'
import { GetListaMultasService } from './get-lista-multas-service'
import { GetDadosCondutorService } from './get-dados-condutor-service'
import { GetPontuacaoCnhService } from './get-pontuacao-cnh-service'
import { GetDetalhesMultaService } from './get-detalhes-multa-service'

export type DashboardServices = {
  getMeusVeiculosService: GetMeusVeiculosService
  getDebitosPendentesService: GetDebitosPendentesService
  getDetalhesPontosCnhService: GetDetalhesPontosCnhService
  getListaMultasService: GetListaMultasService
  getDadosCondutorService: GetDadosCondutorService
  getPontuacaoCnhService: GetPontuacaoCnhService
  getDetalhesMultaService: GetDetalhesMultaService
}

export function getDashboardRegistrations(): Required<NameAndRegistrationPair<DashboardServices>> {
  return {
    getMeusVeiculosService: asFunction(({ detranSpServiceNowDashboard, logger }) =>
      new GetMeusVeiculosService(detranSpServiceNowDashboard, logger),
    ).scoped(),
    getDebitosPendentesService: asFunction(({ detranSpServiceNowDashboard }) =>
      new GetDebitosPendentesService(detranSpServiceNowDashboard),
    ).scoped(),
    getDetalhesPontosCnhService: asFunction(({ detranSpServiceNowDashboard }) =>
      new GetDetalhesPontosCnhService(detranSpServiceNowDashboard),
    ).scoped(),
    getListaMultasService: asFunction(({ detranSpServiceNowDashboard }) =>
      new GetListaMultasService(detranSpServiceNowDashboard),
    ).scoped(),
    getDadosCondutorService: asFunction(({ detranSpServiceNowDashboard }) =>
      new GetDadosCondutorService(detranSpServiceNowDashboard),
    ).scoped(),
    getPontuacaoCnhService: asFunction(({ detranSpServiceNowDashboard }) =>
      new GetPontuacaoCnhService(detranSpServiceNowDashboard),
    ).scoped(),
    getDetalhesMultaService: asFunction(({ detranSpServiceNowDashboard }) =>
      new GetDetalhesMultaService(detranSpServiceNowDashboard),
    ).scoped(),
  }
}
