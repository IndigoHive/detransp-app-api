import { asFunction, type NameAndRegistrationPair } from 'awilix'
import { CriaQRCodeVistoriaService } from './cria-qr-code-service'
import { GeraAutorizacaoVistoriaService } from './gera-autorizacao-service'
import { ListaPagamentosVistoriaService } from './lista-pagamentos-service'
import { VerificaQRCodeVistoriaService } from './verifica-qr-code-service'
import { VerificaVeiculoVistoriaService } from './verifica-veiculo-service'

export type VistoriasServices = {
  criaQRCodeVistoriaService: CriaQRCodeVistoriaService
  geraAutorizacaoVistoriaService: GeraAutorizacaoVistoriaService
  listaPagamentosVistoriaService: ListaPagamentosVistoriaService
  verificaQRCodeVistoriaService: VerificaQRCodeVistoriaService
  verificaVeiculoVistoriaService: VerificaVeiculoVistoriaService
}

export function getVistoriasRegistrations (): Required<NameAndRegistrationPair<VistoriasServices>> {
  return {
    criaQRCodeVistoriaService: asFunction(
      ({ detranSpServiceNowVistoriasClient }) =>
        new CriaQRCodeVistoriaService(detranSpServiceNowVistoriasClient)
    ).scoped(),
    geraAutorizacaoVistoriaService: asFunction(
      ({ detranSpServiceNowVistoriasClient }) =>
        new GeraAutorizacaoVistoriaService(detranSpServiceNowVistoriasClient)
    ).scoped(),
    listaPagamentosVistoriaService: asFunction(
      ({ detranSpServiceNowVistoriasClient }) =>
        new ListaPagamentosVistoriaService(detranSpServiceNowVistoriasClient)
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
