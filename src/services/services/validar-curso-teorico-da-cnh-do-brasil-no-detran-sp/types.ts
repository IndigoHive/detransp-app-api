export type ValidarCursoTeoricoDaCNHDoBrasilNoDetranSpInput = {
  nome: string
  cpfOuCnpj: string
  telefone: string
  email: string
  municipio: string
  jaRealizeiEtapaIniciarProcessoPrimeiraHabilitacaoJuntoPortalDetranSP: boolean
  jaRealizeiExameAptidaoFisicaMentalExameMedicoAvaliacaoPsicologica: boolean
  jaConcluiEtapaCursoTeoricoExpedicaoCertificado: boolean
  documentoComprovanteRepresentacao?: boolean
  representation: boolean
  attachment?: {
    buffer: Buffer
    originalName: string
    mimetype?: string
  }
}

export type ValidarCursoTeoricoDaCNHDoBrasilNoDetranSpResponse =
  | {
      protocol: string
    }
  | {
      showSnackbar: {
        variant: 'error'
        title: string
        description: string
      }
    }

