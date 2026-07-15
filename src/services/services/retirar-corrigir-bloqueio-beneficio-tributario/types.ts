export type RetirarCorrigirBloqueioBeneficioTributarioInput = Record<string, unknown> & {
  attachment?: {
    buffer: Buffer
    originalName: string
    mimetype?: string
  }
}

export type RetirarCorrigirBloqueioBeneficioTributarioResponse =
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

