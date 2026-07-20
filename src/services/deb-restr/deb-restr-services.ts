import { asFunction, type NameAndRegistrationPair } from 'awilix'
import { VerificaVeiculoDebRestrService } from './verifica-veiculo-deb-restr-service'
import { ConsultaTaxaCertidaoService } from './consulta-taxa-certidao-service'
import { CriaQRCodeCertidaoService } from './cria-qr-code-certidao-service'
import { VerificaQRCodeCertidaoService } from './verifica-qr-code-certidao-service'
import { EmiteCertidaoService } from './emite-certidao-service'
import { BuscaDocumentoCertidaoService } from './busca-documento-certidao-service'
import { ListaVeiculosDebRestrService } from './lista-veiculos-deb-restr-service'
import { ConsultaVeiculoDebitosService } from './consulta-veiculo-debitos-service'
import { DetalhesIpvaService } from './detalhes-ipva-service'
import { DetalhesMultasService } from './detalhes-multas-service'
import { TiposServicoResolverService } from './tipos-servico-resolver-service'
import { CriaPixDebitoService } from './cria-pix-debito-service'
import { VerificaPixDebitoService } from './verifica-pix-debito-service'
import { BuscaCertidaoVigenteService } from './busca-certidao-vigente-service'
import { ResumoCertidaoService } from './resumo-certidao-service'

export type DebRestrServices = {
  verificaVeiculoDebRestrService: VerificaVeiculoDebRestrService
  consultaTaxaCertidaoService: ConsultaTaxaCertidaoService
  criaQRCodeCertidaoService: CriaQRCodeCertidaoService
  verificaQRCodeCertidaoService: VerificaQRCodeCertidaoService
  emiteCertidaoService: EmiteCertidaoService
  buscaDocumentoCertidaoService: BuscaDocumentoCertidaoService
  listaVeiculosDebRestrService: ListaVeiculosDebRestrService
  consultaVeiculoDebitosService: ConsultaVeiculoDebitosService
  detalhesIpvaService: DetalhesIpvaService
  detalhesMultasService: DetalhesMultasService
  tiposServicoResolverService: TiposServicoResolverService
  criaPixDebitoService: CriaPixDebitoService
  verificaPixDebitoService: VerificaPixDebitoService
  buscaCertidaoVigenteService: BuscaCertidaoVigenteService
  resumoCertidaoService: ResumoCertidaoService
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
      ({ detranSpServiceNowDebRestrClient, logger }) =>
        new CriaQRCodeCertidaoService(detranSpServiceNowDebRestrClient, logger)
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
    listaVeiculosDebRestrService: asFunction(
      ({ detranSpServiceNowDebRestrClient }) =>
        new ListaVeiculosDebRestrService(detranSpServiceNowDebRestrClient)
    ).scoped(),
    consultaVeiculoDebitosService: asFunction(
      ({ detranSpServiceNowDebRestrClient, detranSpServiceNowPgtoClient }) =>
        new ConsultaVeiculoDebitosService(detranSpServiceNowDebRestrClient, detranSpServiceNowPgtoClient)
    ).scoped(),
    detalhesIpvaService: asFunction(
      ({ detranSpServiceNowDebRestrClient }) =>
        new DetalhesIpvaService(detranSpServiceNowDebRestrClient)
    ).scoped(),
    detalhesMultasService: asFunction(
      ({ detranSpServiceNowDebRestrClient }) =>
        new DetalhesMultasService(detranSpServiceNowDebRestrClient)
    ).scoped(),
    tiposServicoResolverService: asFunction(
      ({ detranSpServiceNowPgtoClient, logger }) =>
        new TiposServicoResolverService(detranSpServiceNowPgtoClient, logger)
    ).scoped(),
    criaPixDebitoService: asFunction(
      ({ detranSpServiceNowPgtoClient, tiposServicoResolverService, logger }) =>
        new CriaPixDebitoService(detranSpServiceNowPgtoClient, tiposServicoResolverService, logger)
    ).scoped(),
    verificaPixDebitoService: asFunction(
      ({ detranSpServiceNowPgtoClient }) =>
        new VerificaPixDebitoService(detranSpServiceNowPgtoClient)
    ).scoped(),
    buscaCertidaoVigenteService: asFunction(
      ({ detranSpServiceNowDebRestrClient }) =>
        new BuscaCertidaoVigenteService(detranSpServiceNowDebRestrClient)
    ).scoped(),
    resumoCertidaoService: asFunction(
      ({ detranSpServiceNowDebRestrClient }) =>
        new ResumoCertidaoService(detranSpServiceNowDebRestrClient)
    ).scoped(),
  }
}
