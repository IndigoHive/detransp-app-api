export type ValidarCursoTeoricoDaCNHDoBrasilNoDetranSpInput = Record<string, unknown> & {
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

