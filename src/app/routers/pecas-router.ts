import { Router } from 'express'

export function pecasRouter(): Router {
  const router = Router()

  router.get('/:numero', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('consultaPecaService')
    const result = await service.run(accessToken, req.params.numero)
    res.status(200).json(result)
  })

  router.post('/qrcode', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('consultaPecaService')
    const result = await service.runFromQrCode(accessToken, req.body.url)
    res.status(200).json(result)
  })

  return router
}
