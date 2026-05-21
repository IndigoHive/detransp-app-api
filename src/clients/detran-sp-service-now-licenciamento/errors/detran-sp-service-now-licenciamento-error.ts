export class DetranSpServiceNowLicenciamentoError extends Error {
  readonly type: string

  constructor (type: string, message: string) {
    super(message)
    this.name = 'DetranSpServiceNowLicenciamentoError'
    this.type = type
  }
}
