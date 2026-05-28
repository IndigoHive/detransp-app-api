import type { ServiceNowCsmClient } from '../../../clients'
import type {
  SolicitarVistoriaEmTransitoInput,
  SolicitarVistoriaEmTransitoResponse,
} from './types'

type Dependencies = {
  serviceNowCsm: ServiceNowCsmClient
}

type ServiceNowCsmSubmitResult = {
  result: {
    number: string
    [key: string]: unknown
  }
}

export class SolicitarVistoriaEmTransitoService {
  private readonly serviceNowCsm: ServiceNowCsmClient

  constructor ({ serviceNowCsm }: Dependencies) {
    this.serviceNowCsm = serviceNowCsm
  }

  async run (input: SolicitarVistoriaEmTransitoInput): Promise<SolicitarVistoriaEmTransitoResponse> {
    try {
      const payload = this.mapInputToServiceNowPayload(input)

      const result = await this.serviceNowCsm.submitProducer<ServiceNowCsmSubmitResult>(
        '9ffe1f1c874b121422bdc9530cbb3570',
        payload
      )

      return {
        protocol: result.result.number,
      }
    } catch (error) {
      return {
        showSnackbar: {
          variant: 'error',
          title: 'Não foi possível enviar',
          description: this.getErrorDescription(error),
        },
      }
    }
  }

  private mapInputToServiceNowPayload (input: SolicitarVistoriaEmTransitoInput) {
    return {
      variables: {
        codigo_de_autuador: '',
        laudoitl: '',
        telefone: input.telefone,
        penalidades: 'crime_desobediencia',
        teste_campo: '',
        marca: '',
        desbloqueio_reset_de_senha: 'Desbloqueio',
        cargo: '',
        polopassivo: 'nao_reu',
        'IO:c0579d50fbbc43d0a6adf2d27eefdc40': 'false',
        doc_reconhecimento_firma: 'false',
        requester: 'true',
        label_teste: '',
        endereco_complemento: '',
        doc_alvara: 'false',
        endereco_uf: '',
        nome: input.nome,
        modelo: '',
        doc_cnh: 'false',
        laudo_de_vistoria: 'false',
        doc_credencial: 'false',
        endereco_logradouro: '',
        veiculos: '',
        endereco_cidade: input.municipioDestino,
        chassi: '',
        motor: '',
        widget: '',
        prazo: '',
        numero_do_ait: '',
        sold_product: '50268eb087a7521022bdc9530cbb3561',
        doc_contrato_social: input.documentoContratoSocial ? 'true' : 'false',
        documentos: 'false',
        doc_comprovante_pagamento: input.documentoComprovantePagemento ? 'true' : 'false',
        sei: input.numeroProcessoSei || '',
        endereco_bairro: '',
        email: input.email,
        declaracao_renuncia_suspensao: 'false',
        motivo_da_solicitacao: '',
        documento_de_identificacao_do_procurador: 'false',
        relacao_de_guinchos_para_cadastro_descadastro: 'false',
        declaracao_documentacao_cfc: 'false',
        requester_proof_of_representation: 'false',
        declaracao_responsabilidade_pela_solicitacao: 'false',
        documents: 'true',
        declaracao_lgpd: input.declaracaoLgpd ? 'true' : 'false',
        endereco_numero: '',
        endereco_cep: '',
        cor: '',
        declaracao_instalacoes_fisicas_cfc: 'false',
        cnpj: input.cpfOuCnpj.replace(/\D/g, '').length === 14 ? input.cpfOuCnpj : '',
        tipo_de_solicitacao: 'Correção ou Alteração de dados',
        declaracoes: 'false',
        doc_comprovacao_poderes: 'false',
        declaracao_responsabilidade_art_299: 'false',
        documento_de_identificacao_do_proprietario: 'false',
        doc_laudo_csv: 'false',
        cpf: input.cpfOuCnpj.replace(/\D/g, '').length === 11 ? input.cpfOuCnpj : '',
        doc_crv: 'false',
        n_ait_form: '',
        declaracao_estampadora: 'false',
        doc_identificacao_cnh: 'false',
        requester_name: input.nome,
        requester_phone: input.telefone,
        doc_certidao_narrativa_rf: 'false',
        procuracao: 'false',
        deployed_item: 'b149e2a68750669022bdc9530cbb359f',
        datas: '',
        declaracao_cassacao: 'false',
        declaracao_legislacao_pcd_cfc: 'false',
        razaosocial: '',
        'IO:cc579d50fbbc43d0a6adf2d27eefdc40': 'false',
        'IO:44579d50fbbc43d0a6adf2d27eefdc40': 'false',
        statements_documents: '',
        fields: 'true',
        crddssp: '',
        motivo: '',
        cadastro_descadastro: 'Cadastro',
        declaracao_atividade_comercial_ecv: 'false',
        declaracao_quadro_de_funcionarios_cfc: 'false',
        doc_compravante_residencial: input.documentoComprovanteResidencia ? 'true' : 'false',
        statements: 'true',
        representation: 'false',
        declaracao_junta_medica: 'false',
        oab: '',
        contact_type: 'cidadao',
        nomefantasia: '',
        crm: '',
        crp: '',
        processojudicial: '',
        categoria_de_titular: 'Cidadão',
        doc_cpf: 'false',
        comentario: '',
        municipiodestino: input.municipioDestino,
        doc_nf: 'false',
        checkbox_2: 'false',
        checkbox_1: 'false',
        optional_fields: '',
        csm: 'true',
        account: '',
        placa: input.placa,
        declaracao_responsabilidade_suspensao: input.declaracaoRespuestavelSuspensao ? 'true' : 'false',
        doc_comprovacao_representacao: input.documentoComprovanteRepresentacao ? 'true' : 'false',
      },
      get_portal_messages: 'true',
      sysparm_no_validation: 'true',
      engagement_channel: 'sp',
      referrer: null,
    }
  }

  private getErrorDescription (error: unknown): string {
    if (error instanceof Error) {
      const axiosError = error as any
      if (axiosError.response?.data?.error?.message) {
        return axiosError.response.data.error.message
      }
      return error.message
    }
    return 'Operação inválida'
  }
}
