import { asClass, type NameAndRegistrationPair } from 'awilix'
import { VerificarEstadoTdvService } from './verificar-estado-tdv'
import { ConsultaVeiculosService } from './consulta-veiculos'
import { AnaliseRequisitosService } from './analise-requisitos'
import { ValidacaoCompradorService } from './validacao-comprador'
import { ValidacaoVendaService } from './validacao-venda'
import { CriarTdvService } from './criar-tdv'
import { CancelarTdvService } from './cancelar-tdv'
import { ConsultaComprasService } from './consulta-compras'
import { ConfirmarCompraService } from './confirmar-compra'
import { ConfirmarEnderecoService } from './confirmar-endereco'
import { CriarCompraService } from './criar-compra'
import { ConfirmarIntencaoVendaService } from './confirmar-intencao-venda'
import { ValidaAssinaturaService } from './valida-assinatura'
import { ConsultaDebitosService } from './consulta-debitos'
import { ProvaVidaService } from './prova-vida'

export type TdvServices = {
  verificarEstadoTdvService: VerificarEstadoTdvService
  consultaVeiculosTdvService: ConsultaVeiculosService
  analiseRequisitosService: AnaliseRequisitosService
  validacaoCompradorService: ValidacaoCompradorService
  validacaoVendaService: ValidacaoVendaService
  criarTdvService: CriarTdvService
  cancelarTdvService: CancelarTdvService
  consultaComprasService: ConsultaComprasService
  confirmarCompraService: ConfirmarCompraService
  confirmarEnderecoService: ConfirmarEnderecoService
  criarCompraService: CriarCompraService
  confirmarIntencaoVendaService: ConfirmarIntencaoVendaService
  validaAssinaturaService: ValidaAssinaturaService
  consultaDebitosService: ConsultaDebitosService
  provaVidaService: ProvaVidaService
}

export function getTdvRegistrations (): Required<NameAndRegistrationPair<TdvServices>> {
  return {
    verificarEstadoTdvService: asClass(VerificarEstadoTdvService).scoped(),
    consultaVeiculosTdvService: asClass(ConsultaVeiculosService).scoped(),
    analiseRequisitosService: asClass(AnaliseRequisitosService).scoped(),
    validacaoCompradorService: asClass(ValidacaoCompradorService).scoped(),
    validacaoVendaService: asClass(ValidacaoVendaService).scoped(),
    criarTdvService: asClass(CriarTdvService).scoped(),
    cancelarTdvService: asClass(CancelarTdvService).scoped(),
    consultaComprasService: asClass(ConsultaComprasService).scoped(),
    confirmarCompraService: asClass(ConfirmarCompraService).scoped(),
    confirmarEnderecoService: asClass(ConfirmarEnderecoService).scoped(),
    criarCompraService: asClass(CriarCompraService).scoped(),
    confirmarIntencaoVendaService: asClass(ConfirmarIntencaoVendaService).scoped(),
    validaAssinaturaService: asClass(ValidaAssinaturaService).scoped(),
    consultaDebitosService: asClass(ConsultaDebitosService).scoped(),
    provaVidaService: asClass(ProvaVidaService).scoped(),
  }
}
