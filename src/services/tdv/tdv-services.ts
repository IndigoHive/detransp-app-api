import { asClass, type NameAndRegistrationPair } from 'awilix'
import { ConsultaVeiculosService } from './consulta-veiculos'
import { AnaliseRequisitosService } from './analise-requisitos'
import { ValidacaoCompradorService } from './validacao-comprador'
import { CompradorCpfService } from './comprador-cpf'
import { ValidacaoVendaService } from './validacao-venda'
import { CriarTdvService } from './criar-tdv'
import { InformarDadosVendaService } from './informar-dados-venda'
import { ValidarKmService } from './validar-km'
import { ConfirmarIntencaoVendaService } from './confirmar-intencao-venda'
import { CancelarTdvService } from './cancelar-tdv'
import { ConsultaComprasService } from './consulta-compras'
import { ConfirmarCompraService } from './confirmar-compra'
import { ValidaAssinaturaService } from './valida-assinatura'
import { ConsultaDebitosService } from './consulta-debitos'
import { ProvaVidaService } from './prova-vida'
import { GerarLinkAssinaturaItiService } from './gerar-link-assinatura-iti'

export type TdvServices = {
  consultaVeiculosTdvService: ConsultaVeiculosService
  analiseRequisitosService: AnaliseRequisitosService
  validacaoCompradorService: ValidacaoCompradorService
  compradorCpfService: CompradorCpfService
  validacaoVendaService: ValidacaoVendaService
  criarTdvService: CriarTdvService
  informarDadosVendaService: InformarDadosVendaService
  validarKmService: ValidarKmService
  confirmarIntencaoVendaService: ConfirmarIntencaoVendaService
  cancelarTdvService: CancelarTdvService
  consultaComprasService: ConsultaComprasService
  confirmarCompraService: ConfirmarCompraService
  validaAssinaturaService: ValidaAssinaturaService
  consultaDebitosService: ConsultaDebitosService
  provaVidaService: ProvaVidaService
  gerarLinkAssinaturaItiService: GerarLinkAssinaturaItiService
}

export function getTdvRegistrations (): Required<NameAndRegistrationPair<TdvServices>> {
  return {
    consultaVeiculosTdvService: asClass(ConsultaVeiculosService).scoped(),
    analiseRequisitosService: asClass(AnaliseRequisitosService).scoped(),
    validacaoCompradorService: asClass(ValidacaoCompradorService).scoped(),
    compradorCpfService: asClass(CompradorCpfService).scoped(),
    validacaoVendaService: asClass(ValidacaoVendaService).scoped(),
    criarTdvService: asClass(CriarTdvService).scoped(),
    informarDadosVendaService: asClass(InformarDadosVendaService).scoped(),
    validarKmService: asClass(ValidarKmService).scoped(),
    confirmarIntencaoVendaService: asClass(ConfirmarIntencaoVendaService).scoped(),
    cancelarTdvService: asClass(CancelarTdvService).scoped(),
    consultaComprasService: asClass(ConsultaComprasService).scoped(),
    confirmarCompraService: asClass(ConfirmarCompraService).scoped(),
    validaAssinaturaService: asClass(ValidaAssinaturaService).scoped(),
    consultaDebitosService: asClass(ConsultaDebitosService).scoped(),
    provaVidaService: asClass(ProvaVidaService).scoped(),
    gerarLinkAssinaturaItiService: asClass(GerarLinkAssinaturaItiService).scoped(),
  }
}
