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
    getMeusVeiculosService: asFunction(({ serviceNowApiClient, logger, config }) =>
      new GetMeusVeiculosService(serviceNowApiClient, logger, config),
    ).scoped(),
    getDebitosPendentesService: asFunction(({ serviceNowApiClient, logger, config }) =>
      new GetDebitosPendentesService(serviceNowApiClient, logger, config),
    ).scoped(),
    getDetalhesPontosCnhService: asFunction(({ serviceNowApiClient, logger, config }) =>
      new GetDetalhesPontosCnhService(serviceNowApiClient, logger, config),
    ).scoped(),
    getListaMultasService: asFunction(({ serviceNowApiClient, logger, config }) =>
      new GetListaMultasService(serviceNowApiClient, logger, config),
    ).scoped(),
    getDadosCondutorService: asFunction(({ serviceNowApiClient, logger, config }) =>
      new GetDadosCondutorService(serviceNowApiClient, logger, config),
    ).scoped(),
    getPontuacaoCnhService: asFunction(({ serviceNowApiClient, logger, config }) =>
      new GetPontuacaoCnhService(serviceNowApiClient, logger, config),
    ).scoped(),
    getDetalhesMultaService: asFunction(({ serviceNowApiClient, logger, config }) =>
      new GetDetalhesMultaService(serviceNowApiClient, logger, config),
    ).scoped(),
  }
}
