import type { ServiceNowFormAttachment } from '../submit-csm-protocol-service/types'

export type UploadProtocolAttachmentInput = Record<string, unknown> & {
  attachments?: ServiceNowFormAttachment[]
}

export type UploadProtocolAttachmentResponse =
  | { success: true }
  | { showSnackbar: { variant: 'error'; title: string; description: string } }
