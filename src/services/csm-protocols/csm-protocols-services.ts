import { asClass, type NameAndRegistrationPair } from 'awilix'
import { ListServiceCasesService } from './list-service-cases-service/list-service-cases-service'
import { GetProtocolCaseDetailService } from './get-protocol-case-detail-service'
import { ListProtocolMessagesService } from './list-protocol-messages-service'
import { FinalizeProtocolService, UploadProtocolAttachmentService, SubmitCsmProtocolService } from './_common'

export type ProtocolsServices = {
  submitCsmProtocolService: SubmitCsmProtocolService
  listServiceCasesService: ListServiceCasesService
  getProtocolCaseDetailService: GetProtocolCaseDetailService
  uploadProtocolAttachmentService: UploadProtocolAttachmentService
  listProtocolMessagesService: ListProtocolMessagesService
  finalizeProtocolService: FinalizeProtocolService
}

export function getProtocolsRegistrations (): Required<NameAndRegistrationPair<ProtocolsServices>> {
  return {
    submitCsmProtocolService: asClass(SubmitCsmProtocolService).scoped(),
    listServiceCasesService: asClass(ListServiceCasesService).scoped(),
    getProtocolCaseDetailService: asClass(GetProtocolCaseDetailService).scoped(),
    uploadProtocolAttachmentService: asClass(UploadProtocolAttachmentService).scoped(),
    listProtocolMessagesService: asClass(ListProtocolMessagesService).scoped(),
    finalizeProtocolService: asClass(FinalizeProtocolService).scoped(),
  }
}
