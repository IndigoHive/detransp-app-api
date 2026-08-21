import { asClass, type NameAndRegistrationPair } from 'awilix'
import { ConsultaVeiculosService } from './consulta-veiculos'
import { AnaliseRequisitosService } from './analise-requisitos'
import { ValidacaoCompradorService } from './validacao-comprador'
import { CompradorCpfService } from './comprador-cpf'
import { CompradorCepService } from './comprador-cep'
import { ValidacaoVendaService } from './validacao-venda'
import { CriarTdvService } from './criar-tdv'
import { InformarDadosVendaService } from './informar-dados-venda'
import { ValidarKmService } from './validar-km'
import { ConfirmarIntencaoVendaService } from './confirmar-intencao-venda'
import { ConfirmarTermoCienciaService } from './confirmar-termo-ciencia'
import { CancelarTdvService } from './cancelar-tdv'
import { ConsultaComprasService } from './consulta-compras'
import { ConfirmarCompraService } from './confirmar-compra'
import { CriarCompraService } from './criar-compra'
import { ValidaAssinaturaService } from './valida-assinatura'
import { ConsultaDebitosService } from './consulta-debitos'
import { BuscaEnderecoService } from './busca-endereco'
import { ProvaVidaService } from './prova-vida'
import { GerarLinkAssinaturaItiService } from './gerar-link-assinatura-iti'
import { ValidarTdvService } from './validar-tdv'

export type TdvServices = {
  consultaVeiculosTdvService: ConsultaVeiculosService
  analiseRequisitosService: AnaliseRequisitosService
  validacaoCompradorService: ValidacaoCompradorService
  compradorCpfService: CompradorCpfService
  compradorCepService: CompradorCepService
  validacaoVendaService: ValidacaoVendaService
  criarTdvService: CriarTdvService
  informarDadosVendaService: InformarDadosVendaService
  validarKmService: ValidarKmService
  confirmarIntencaoVendaService: ConfirmarIntencaoVendaService
  confirmarTermoCienciaService: ConfirmarTermoCienciaService
  cancelarTdvService: CancelarTdvService
  consultaComprasService: ConsultaComprasService
  confirmarCompraService: ConfirmarCompraService
  criarCompraService: CriarCompraService
  validaAssinaturaService: ValidaAssinaturaService
  consultaDebitosService: ConsultaDebitosService
  buscaEnderecoService: BuscaEnderecoService
  provaVidaService: ProvaVidaService
  gerarLinkAssinaturaItiService: GerarLinkAssinaturaItiService
  validarTdvService: ValidarTdvService
}

export function getTdvRegistrations (): Required<NameAndRegistrationPair<TdvServices>> {
  return {
    consultaVeiculosTdvService: asClass(ConsultaVeiculosService).scoped(),
    analiseRequisitosService: asClass(AnaliseRequisitosService).scoped(),
    validacaoCompradorService: asClass(ValidacaoCompradorService).scoped(),
    compradorCpfService: asClass(CompradorCpfService).scoped(),
    compradorCepService: asClass(CompradorCepService).scoped(),
    validacaoVendaService: asClass(ValidacaoVendaService).scoped(),
    criarTdvService: asClass(CriarTdvService).scoped(),
    informarDadosVendaService: asClass(InformarDadosVendaService).scoped(),
    validarKmService: asClass(ValidarKmService).scoped(),
    confirmarIntencaoVendaService: asClass(ConfirmarIntencaoVendaService).scoped(),
    confirmarTermoCienciaService: asClass(ConfirmarTermoCienciaService).scoped(),
    cancelarTdvService: asClass(CancelarTdvService).scoped(),
    consultaComprasService: asClass(ConsultaComprasService).scoped(),
    confirmarCompraService: asClass(ConfirmarCompraService).scoped(),
    criarCompraService: asClass(CriarCompraService).scoped(),
    validaAssinaturaService: asClass(ValidaAssinaturaService).scoped(),
    consultaDebitosService: asClass(ConsultaDebitosService).scoped(),
    buscaEnderecoService: asClass(BuscaEnderecoService).scoped(),
    provaVidaService: asClass(ProvaVidaService).scoped(),
    gerarLinkAssinaturaItiService: asClass(GerarLinkAssinaturaItiService).scoped(),
    validarTdvService: asClass(ValidarTdvService).scoped(),
  }
}
