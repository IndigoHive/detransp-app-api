export class DetranSpServiceNowError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'DetranSpServiceNowError'
  }
}
