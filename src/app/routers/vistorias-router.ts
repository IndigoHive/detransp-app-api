import { Router } from 'express'
import { BadRequest } from 'http-errors'
import { isOtherProcessLabel, isProcessLabel } from '../../services/vistorias/verifica-veiculo-service'

const PLATE_PATTERN = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/
const RENAVAM_PATTERN = /^\d{9,11}$/

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function vistoriasRouter(): Router {
  const router = Router()

  router.post('/veiculos/verificar', async (req, res) => {
    const placa = asNonEmptyString(req.body?.placa)
    const renavam = asNonEmptyString(req.body?.renavam)
    const tipoProcesso = asNonEmptyString(req.body?.tipoProcesso)
    const outroProcesso = asNonEmptyString(req.body?.outroProcesso)

    if (!placa || !renavam || !tipoProcesso) {
      throw BadRequest('Campos obrigatórios ausentes: placa, renavam e tipoProcesso.')
    }
    const normalizedPlate = placa.toUpperCase()
    if (!PLATE_PATTERN.test(normalizedPlate)) {
      throw BadRequest('Placa inválida.')
    }
    if (!RENAVAM_PATTERN.test(renavam)) {
      throw BadRequest('RENAVAM inválido.')
    }
    if (!isProcessLabel(tipoProcesso)) {
      throw BadRequest('Tipo de processo inválido.')
    }
    if (tipoProcesso === 'Outros' && (!outroProcesso || !isOtherProcessLabel(outroProcesso))) {
      throw BadRequest('Outro processo inválido ou ausente.')
    }
    if (tipoProcesso !== 'Outros' && outroProcesso) {
      throw BadRequest('outroProcesso somente pode ser informado para o tipo Outros.')
    }

    const service = req.scope.resolve('verificaVeiculoVistoriaService')
    const result = await service.run({
      placa: normalizedPlate,
      renavam,
      tipoProcesso,
      ...(outroProcesso ? { outroProcesso } : {})
    })
    res.status(200).json(result)
  })

  router.post('/veiculos/:renavam/qr-code', async (req, res) => {
    const renavam = asNonEmptyString(req.params.renavam)
    const correlationId = asNonEmptyString(req.body?.correlationId)

    if (!renavam || !correlationId) {
      throw BadRequest('RENAVAM ou correlationId não encontrado.')
    }

    if (!RENAVAM_PATTERN.test(renavam)) {
      throw BadRequest('RENAVAM inválido.')
    }

    const service = req.scope.resolve('criaQRCodeVistoriaService')
    const result = await service.run(correlationId)
    res.status(200).json(result)
  })

  router.get('/qr-code', async (req, res) => {
    const paymentId = asNonEmptyString(req.query.id)

    if (!paymentId) {
      throw BadRequest('Identificador do pagamento não encontrado.')
    }

    const service = req.scope.resolve('verificaQRCodeVistoriaService')
    const result = await service.run(paymentId)
    res.status(200).json(result)
  })

  return router
}
