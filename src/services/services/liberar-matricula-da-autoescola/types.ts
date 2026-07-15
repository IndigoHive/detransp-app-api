export type LiberarMatriculaDaAutoescolaInput = Record<string, unknown> & {
  attachment?: {
    buffer: Buffer
    originalName: string
    mimetype?: string
  }
}

export type LiberarMatriculaDaAutoescolaResponse =
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

