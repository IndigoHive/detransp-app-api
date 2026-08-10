export type UploadProtocolAttachmentInput = Record<string, unknown> & {
  attachment?: {
    buffer: Buffer
    originalName: string
    mimetype?: string
  }
}

export type UploadProtocolAttachmentResponse =
  | { success: true }
  | { showSnackbar: { variant: 'error'; title: string; description: string } }
