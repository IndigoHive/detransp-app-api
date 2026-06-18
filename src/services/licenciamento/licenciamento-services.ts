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
      ({ detranSpServiceNowLicenciamentoClient, detranSpServiceNowDebRestrClient }) =>
        new VerificaVeiculoRepresentacaoService(detranSpServiceNowLicenciamentoClient, detranSpServiceNowDebRestrClient)
    ).scoped(),
    verificaVeiculoLicenciamentoService: asFunction(
      ({ detranSpServiceNowLicenciamentoClient, detranSpServiceNowDebRestrClient }) =>
        new VerificaVeiculoLicenciamentoService(detranSpServiceNowLicenciamentoClient, detranSpServiceNowDebRestrClient)
    ).scoped(),
    criaQRCodeLicenciamentoService: asFunction(
      ({ detranSpServiceNowLicenciamentoClient }) =>
        new CriaQRCodeLicenciamentoService(detranSpServiceNowLicenciamentoClient)
    ).scoped(),
    verificaQRCodeLicenciamentoService: asFunction(
      ({ detranSpServiceNowLicenciamentoClient }) =>
        new VerificaQRCodeLicenciamentoService(detranSpServiceNowLicenciamentoClient)
    ).scoped(),
    buscaCrlveLicenciamentoService: asFunction(
      ({ detranSpServiceNowLicenciamentoClient }) =>
        new BuscaCrlveLicenciamentoService(detranSpServiceNowLicenciamentoClient)
    ).scoped(),
  }
}
