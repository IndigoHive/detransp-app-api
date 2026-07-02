export class DetranSpServiceNowDebRestrError extends Error {
  readonly type: string
  readonly responseData?: unknown

  constructor (type: string, message: string, responseData?: unknown) {
    super(message)
    this.name = 'DetranSpServiceNowDebRestrError'
    this.type = type
    this.responseData = responseData
  }
}
