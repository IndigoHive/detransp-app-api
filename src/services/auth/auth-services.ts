import { asClass, NameAndRegistrationPair } from 'awilix'
import { GenerateGovBrAuthorizationUrlService } from './generate-govbr-authorization-url-service'
import { ExchangeGovBrAuthorizationCodeService } from './exchange-govbr-authorization-code-service'
import { GetGovBrUserInfoService } from './get-govbr-user-info-service'
import { SignOutGovBrService } from './sign-out-govbr-service'

export type AuthServices = {
  generateGovBrAuthorizationUrlService: GenerateGovBrAuthorizationUrlService
  exchangeGovBrAuthorizationCodeService: ExchangeGovBrAuthorizationCodeService
  getGovBrUserInfoService: GetGovBrUserInfoService
  signOutGovBrService: SignOutGovBrService
}

export function getAuthRegistrations (): Required<NameAndRegistrationPair<AuthServices>> {
  return {
    generateGovBrAuthorizationUrlService: asClass(GenerateGovBrAuthorizationUrlService).scoped(),
    exchangeGovBrAuthorizationCodeService: asClass(ExchangeGovBrAuthorizationCodeService).scoped(),
    getGovBrUserInfoService: asClass(GetGovBrUserInfoService).scoped(),
    signOutGovBrService: asClass(SignOutGovBrService).scoped()
  }
}
