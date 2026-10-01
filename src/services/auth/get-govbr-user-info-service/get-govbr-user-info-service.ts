import type { IdpSpGovBrServiceClient, GetUserInfoResult } from '../../../clients'

export type GetGovBrUserInfoInput = {
  accessToken: string
}

export type GetGovBrUserInfoResult = {
  data: GetUserInfoResult
}

type Dependencies = {
  idpSpGovBrService: IdpSpGovBrServiceClient
}

export class GetGovBrUserInfoService {
  private readonly idpSpGovBrService: IdpSpGovBrServiceClient

  constructor ({ idpSpGovBrService }: Dependencies) {
    this.idpSpGovBrService = idpSpGovBrService
  }

  async run (input: GetGovBrUserInfoInput): Promise<GetGovBrUserInfoResult> {
    const userInfo = await this.idpSpGovBrService.getUserInfo(input.accessToken)
    const confiabilidades = await this.idpSpGovBrService.listConfiabilidades(input.accessToken)
    const data = { ...userInfo, ...(confiabilidades && { confiabilidades }) }

    return { data }
  }
}
