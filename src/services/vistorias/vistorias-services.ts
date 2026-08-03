import { asFunction, type NameAndRegistrationPair } from 'awilix'
import { BuscaDocumentoVistoriaService } from './busca-documento-service'
import { BuscaDocumentoRestituicaoVistoriaService } from './busca-documento-restituicao-service'
import { CriaQRCodeVistoriaService } from './cria-qr-code-service'
import { GeraAutorizacaoVistoriaService } from './gera-autorizacao-service'
import { ListaPagamentosVistoriaService } from './lista-pagamentos-service'
import { SolicitaRestituicaoVistoriaService } from './solicita-restituicao-service'
import { VerificaQRCodeVistoriaService } from './verifica-qr-code-service'
import { VerificaVeiculoVistoriaService } from './verifica-veiculo-service'

export type VistoriasServices = {
  buscaDocumentoRestituicaoVistoriaService: BuscaDocumentoRestituicaoVistoriaService
  buscaDocumentoVistoriaService: BuscaDocumentoVistoriaService
  criaQRCodeVistoriaService: CriaQRCodeVistoriaService
  geraAutorizacaoVistoriaService: GeraAutorizacaoVistoriaService
  listaPagamentosVistoriaService: ListaPagamentosVistoriaService
  solicitaRestituicaoVistoriaService: SolicitaRestituicaoVistoriaService
  verificaQRCodeVistoriaService: VerificaQRCodeVistoriaService
  verificaVeiculoVistoriaService: VerificaVeiculoVistoriaService
}

export function getVistoriasRegistrations (): Required<NameAndRegistrationPair<VistoriasServices>> {
  return {
    buscaDocumentoRestituicaoVistoriaService: asFunction(
      ({ detranSpServiceNowVistoriasClient }) =>
        new BuscaDocumentoRestituicaoVistoriaService(detranSpServiceNowVistoriasClient)
    ).scoped(),
    buscaDocumentoVistoriaService: asFunction(
      ({ detranSpServiceNowVistoriasClient }) =>
        new BuscaDocumentoVistoriaService(detranSpServiceNowVistoriasClient)
    ).scoped(),
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
    solicitaRestituicaoVistoriaService: asFunction(
      ({ detranSpServiceNowVistoriasClient }) =>
        new SolicitaRestituicaoVistoriaService(detranSpServiceNowVistoriasClient)
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
