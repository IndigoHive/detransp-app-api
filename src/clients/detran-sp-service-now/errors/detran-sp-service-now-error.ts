export class DetranSpServiceNowError extends Error {
  readonly type: string
  readonly detail: string
  readonly responseData?: unknown

  constructor (type: string, detail: string, responseData?: unknown) {
    super(detail)
    this.name = 'DetranSpServiceNowError'
    this.type = type
    this.detail = detail
    this.responseData = responseData
  }
}
