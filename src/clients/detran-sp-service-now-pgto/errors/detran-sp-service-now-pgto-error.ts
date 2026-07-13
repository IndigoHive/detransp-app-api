export class DetranSpServiceNowPgtoError extends Error {
  readonly type: string
  readonly responseData?: unknown

  constructor (type: string, message: string, responseData?: unknown) {
    super(message)
    this.name = 'DetranSpServiceNowPgtoError'
    this.type = type
    this.responseData = responseData
  }
}
