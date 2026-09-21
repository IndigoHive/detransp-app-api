import { asClass, NameAndRegistrationPair } from 'awilix'
import { ValidateAttestationTokenService } from './validate-attestation-token-service'

export type AttestationServices = {
  validateAttestationTokenService: ValidateAttestationTokenService
}

export function getAttestationRegistrations (): Required<NameAndRegistrationPair<AttestationServices>> {
  return {
    validateAttestationTokenService: asClass(ValidateAttestationTokenService).scoped()
  }
}
