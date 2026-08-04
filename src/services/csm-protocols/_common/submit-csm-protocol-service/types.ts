export type ServiceNowFormAttachment = {
  buffer: Buffer
  originalName: string
  mimetype?: string
}

export type SubmitCsmProtocolInput = {
  catalogItemId: string
  payload: Record<string, unknown>
  attachments?: ServiceNowFormAttachment[]
}

export type SubmitCsmProtocolResponse =
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
