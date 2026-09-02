import { asFunction, type NameAndRegistrationPair } from 'awilix'
import { ListaVeiculosLicenciamentoService } from './lista-veiculos-service'
import { VerificaVeiculoRepresentacaoService } from './verifica-veiculo-representacao-service'
import { VerificaVeiculoLicenciamentoService } from './verifica-veiculo-service'
import { CriaQRCodeLicenciamentoService } from './cria-qr-code-service'
import { VerificaQRCodeLicenciamentoService } from './verifica-qr-code-service'
import { BuscaCrlveLicenciamentoService } from './busca-crlve-service'

export type LicenciamentoServices = {
  listaVeiculosLicenciamentoService: ListaVeiculosLicenciamentoService
  verificaVeiculoRepresentacaoService: VerificaVeiculoRepresentacaoService
  verificaVeiculoLicenciamentoService: VerificaVeiculoLicenciamentoService
  criaQRCodeLicenciamentoService: CriaQRCodeLicenciamentoService
  verificaQRCodeLicenciamentoService: VerificaQRCodeLicenciamentoService
  buscaCrlveLicenciamentoService: BuscaCrlveLicenciamentoService
}

export function getLicenciamentoRegistrations(): Required<NameAndRegistrationPair<LicenciamentoServices>> {
  return {
    listaVeiculosLicenciamentoService: asFunction(
      ({ detranSpServiceNowLicenciamentoClient }) =>
        new ListaVeiculosLicenciamentoService(detranSpServiceNowLicenciamentoClient)
    ).scoped(),
    verificaVeiculoRepresentacaoService: asFunction(
      ({ detranSpServiceNowLicenciamentoClient }) =>
        new VerificaVeiculoRepresentacaoService(detranSpServiceNowLicenciamentoClient)
    ).scoped(),
    verificaVeiculoLicenciamentoService: asFunction(
      ({ detranSpServiceNowLicenciamentoClient }) =>
        new VerificaVeiculoLicenciamentoService(detranSpServiceNowLicenciamentoClient)
    ).scoped(),
    criaQRCodeLicenciamentoService: asFunction(
      ({ detranSpServiceNowLicenciamentoClient, logger, analyticsService }) =>
        new CriaQRCodeLicenciamentoService(detranSpServiceNowLicenciamentoClient, logger, analyticsService)
    ).scoped(),
    verificaQRCodeLicenciamentoService: asFunction(
      ({ detranSpServiceNowLicenciamentoClient, analyticsService }) =>
        new VerificaQRCodeLicenciamentoService(detranSpServiceNowLicenciamentoClient, analyticsService)
    ).scoped(),
    buscaCrlveLicenciamentoService: asFunction(
      ({ detranSpServiceNowLicenciamentoClient, analyticsService }) =>
        new BuscaCrlveLicenciamentoService(detranSpServiceNowLicenciamentoClient, analyticsService)
    ).scoped(),
  }
}
