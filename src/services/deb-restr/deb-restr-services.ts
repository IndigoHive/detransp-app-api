import { asFunction, type NameAndRegistrationPair } from 'awilix'
import { VerificaVeiculoDebRestrService } from './verifica-veiculo-deb-restr-service'
import { ConsultaTaxaCertidaoService } from './consulta-taxa-certidao-service'
import { CriaQRCodeCertidaoService } from './cria-qr-code-certidao-service'
import { VerificaQRCodeCertidaoService } from './verifica-qr-code-certidao-service'
import { EmiteCertidaoService } from './emite-certidao-service'
import { BuscaDocumentoCertidaoService } from './busca-documento-certidao-service'

export type DebRestrServices = {
  verificaVeiculoDebRestrService: VerificaVeiculoDebRestrService
  consultaTaxaCertidaoService: ConsultaTaxaCertidaoService
  criaQRCodeCertidaoService: CriaQRCodeCertidaoService
  verificaQRCodeCertidaoService: VerificaQRCodeCertidaoService
  emiteCertidaoService: EmiteCertidaoService
  buscaDocumentoCertidaoService: BuscaDocumentoCertidaoService
}

export function getDebRestrRegistrations (): Required<NameAndRegistrationPair<DebRestrServices>> {
  return {
    verificaVeiculoDebRestrService: asFunction(
      ({ detranSpServiceNowDebRestrClient }) =>
        new VerificaVeiculoDebRestrService(detranSpServiceNowDebRestrClient)
    ).scoped(),
    consultaTaxaCertidaoService: asFunction(
      ({ detranSpServiceNowDebRestrClient }) =>
        new ConsultaTaxaCertidaoService(detranSpServiceNowDebRestrClient)
    ).scoped(),
    criaQRCodeCertidaoService: asFunction(
      ({ detranSpServiceNowDebRestrClient }) =>
        new CriaQRCodeCertidaoService(detranSpServiceNowDebRestrClient)
    ).scoped(),
    verificaQRCodeCertidaoService: asFunction(
      ({ detranSpServiceNowDebRestrClient }) =>
        new VerificaQRCodeCertidaoService(detranSpServiceNowDebRestrClient)
    ).scoped(),
    emiteCertidaoService: asFunction(
      ({ detranSpServiceNowDebRestrClient }) =>
        new EmiteCertidaoService(detranSpServiceNowDebRestrClient)
    ).scoped(),
    buscaDocumentoCertidaoService: asFunction(
      ({ detranSpServiceNowDebRestrClient }) =>
        new BuscaDocumentoCertidaoService(detranSpServiceNowDebRestrClient)
    ).scoped(),
  }
}
