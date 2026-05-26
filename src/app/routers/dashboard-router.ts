import { Router } from 'express'

export function dashboardRouter (): Router {
  const router = Router()

  router.get('/meusVeiculos', async (req, res) => {
    const service = req.scope.resolve('getMeusVeiculosService')

    const result = await service.run()

    res.status(200).json(result)
  })

  router.get('/dados-condutor', async (req, res) => {
    const payload = asNonEmptyString(req.query.payload)

    if (!payload) {
      res.status(400).json({ message: 'Query param "payload" is required.' })
      return
    }

    const service = req.scope.resolve('getDadosCondutorService')

    const result = await service.run({ payload })

    res.status(200).json(result)
  })

  router.get('/pontuacaoCnh', async (req, res) => {
    const service = req.scope.resolve('getTotalPontosCNHService')

    const result = await service.run()

    res.status(200).json(result)
  })

  router.get('/debitosPendentes', async (req, res) => {
    const cpf = asNonEmptyString(req.query.cpf)
    const veicnum = asNonEmptyString(req.query.veicnum)

    if (!cpf || !veicnum) {
      res.status(400).json({ message: 'Query params "cpf" and "veicnum" are required.' })
      return
    }

    const service = req.scope.resolve('getDebitosPendentesService')

    const result = await service.run({ cpf, veicnum })

    res.status(200).json(result)
  })

  router.get('/detalhesPontuacaoCnh', async (req, res) => {
    const meses = asNonEmptyString(req.query.meses)
    const tipoDoc = asNonEmptyString(req.query.tipoDoc)

    if (!meses || !tipoDoc) {
      res.status(400).json({ message: 'Query params "meses" and "tipoDoc" are required.' })
      return
    }

    const service = req.scope.resolve('getDetalhesPontosCNHService')

    const result = await service.run({ meses, tipoDoc })

    res.status(200).json(result)
  })

  router.get('/listaMultas', async (req, res) => {
    const cpf = asNonEmptyString(req.query.cpf)
    const ultimosmeses = asBooleanString(req.query.ultimosmeses)

    if (!cpf || ultimosmeses === undefined) {
      res.status(400).json({ message: 'Query params "cpf" and "ultimosmeses" are required.' })
      return
    }

    const service = req.scope.resolve('getListaMultasService')

    const result = await service.run({ cpf, ultimosmeses })

    res.status(200).json(result)
  })

  router.get('/multas', async (req, res) => {
    const auto = asNonEmptyString(req.query.auto)
    const cpf = asNonEmptyString(req.query.cpf)
    const idVeiculo = asNonEmptyString(req.query.idVeiculo)

    if (!auto || !cpf || !idVeiculo) {
      res.status(400).json({ message: 'Query params "auto", "cpf" and "idVeiculo" are required.' })
      return
    }

    const service = req.scope.resolve('getDetalhesMultaService')

    const result = await service.run({ auto, cpf, idVeiculo })

    res.status(200).json(result)
  })

  return router
}

function asNonEmptyString (value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function asBooleanString (value: unknown): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}
