import { asFunction, type NameAndRegistrationPair } from 'awilix'
import { CriaQRCodeVistoriaService } from './cria-qr-code-service'
import { VerificaQRCodeVistoriaService } from './verifica-qr-code-service'
import { VerificaVeiculoVistoriaService } from './verifica-veiculo-service'

export type VistoriasServices = {
  criaQRCodeVistoriaService: CriaQRCodeVistoriaService
  verificaQRCodeVistoriaService: VerificaQRCodeVistoriaService
  verificaVeiculoVistoriaService: VerificaVeiculoVistoriaService
}

export function getVistoriasRegistrations (): Required<NameAndRegistrationPair<VistoriasServices>> {
  return {
    criaQRCodeVistoriaService: asFunction(
      ({ detranSpServiceNowVistoriasClient }) =>
        new CriaQRCodeVistoriaService(detranSpServiceNowVistoriasClient)
    ).scoped(),
    verificaQRCodeVistoriaService: asFunction(
      ({ detranSpServiceNowVistoriasClient }) =>
        new VerificaQRCodeVistoriaService(detranSpServiceNowVistoriasClient)
    ).scoped(),
    verificaVeiculoVistoriaService: asFunction(
      ({ detranSpServiceNowVistoriasClient }) =>
        new VerificaVeiculoVistoriaService(detranSpServiceNowVistoriasClient)
    ).scoped()
  }
}
