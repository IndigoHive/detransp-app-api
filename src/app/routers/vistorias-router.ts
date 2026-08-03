import { type Request, Router } from 'express'
import { BadRequest } from 'http-errors'
import { isOtherProcessLabel, isProcessLabel } from '../../services/vistorias/verifica-veiculo-service'
import type { VistoriasAuth } from '../../services/vistorias'

const PLATE_PATTERN = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/
const RENAVAM_PATTERN = /^\d{9,11}$/
const PEV_NUMBER_PATTERN = /^PEV\d+$/
const DOCUMENT_PATTERN = /^(?:\d{11}|\d{14})$/
const DOC_PROPRIETARIO_BY_PAYMENT_LABEL = {
  'Meus pagamentos': false,
  'Meus veiculos': true
} as const

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function getDocProprietarioByPaymentLabel(label: string | undefined): boolean | undefined {
  if (!label || !(label in DOC_PROPRIETARIO_BY_PAYMENT_LABEL)) {
    return undefined
  }

  return DOC_PROPRIETARIO_BY_PAYMENT_LABEL[label as keyof typeof DOC_PROPRIETARIO_BY_PAYMENT_LABEL]
}

function getAuth(req: Request): VistoriasAuth {
  const token = req.session?.accessToken
  const cpf = req.session?.cpf

  if (!token || !cpf) {
    throw BadRequest('Informações de autenticação não encontradas na sessão.')
  }

  return { token, cpf }
}

export function vistoriasRouter(): Router {
  const router = Router()

  router.post('/veiculos/verificar', async (req, res) => {
    const auth = getAuth(req)
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
      ...auth,
      placa: normalizedPlate,
      renavam,
      tipoProcesso,
      ...(outroProcesso ? { outroProcesso } : {})
    })
    res.status(200).json(result)
  })

  router.post('/veiculos/:renavam/qr-code', async (req, res) => {
    const auth = getAuth(req)
    const renavam = asNonEmptyString(req.params.renavam)
    const correlationId = asNonEmptyString(req.body?.correlationId)

    if (!renavam || !correlationId) {
      throw BadRequest('RENAVAM ou correlationId não encontrado.')
    }

    if (!RENAVAM_PATTERN.test(renavam)) {
      throw BadRequest('RENAVAM inválido.')
    }

    const service = req.scope.resolve('criaQRCodeVistoriaService')
    const result = await service.run(auth, correlationId)
    res.status(200).json(result)
  })

  router.get('/qr-code', async (req, res) => {
    const auth = getAuth(req)
    const paymentId = asNonEmptyString(req.query.id)

    if (!paymentId) {
      throw BadRequest('Identificador do pagamento não encontrado.')
    }

    const service = req.scope.resolve('verificaQRCodeVistoriaService')
    const result = await service.run(auth, paymentId)
    res.status(200).json(result)
  })

  router.post('/veiculos/:renavam/autorizacao', async (req, res) => {
    const auth = getAuth(req)
    const renavam = asNonEmptyString(req.params.renavam)
    const numeroPEV = asNonEmptyString(req.body?.numeroPEV)
    const documento = asNonEmptyString(req.body?.documento)

    if (!renavam || !RENAVAM_PATTERN.test(renavam)) {
      throw BadRequest('RENAVAM inválido.')
    }
    if (!numeroPEV || !documento) {
      throw BadRequest('Campos obrigatórios ausentes: numeroPEV e documento.')
    }
    if (!PEV_NUMBER_PATTERN.test(numeroPEV)) {
      throw BadRequest('Número PEV inválido.')
    }

    const service = req.scope.resolve('geraAutorizacaoVistoriaService')
    const result = await service.run({ ...auth, numeroPEV, documento })
    res.status(200).json(result)
  })

  router.get('/pagamentos/:documento', async (req, res) => {
    const auth = getAuth(req)
    const documento = asNonEmptyString(req.params.documento)
    const paymentLabel = asNonEmptyString(req.query.docProprietario)
    const docProprietario = getDocProprietarioByPaymentLabel(paymentLabel)

    if (!documento || !DOCUMENT_PATTERN.test(documento)) {
      throw BadRequest('Documento inválido.')
    }
    if (docProprietario === undefined) {
      throw BadRequest('docProprietario deve ser Meus pagamentos ou Meus veiculos.')
    }

    const service = req.scope.resolve('listaPagamentosVistoriaService')
    const result = await service.run(auth, documento, docProprietario)
    res.status(200).json(result)
  })

  return router
}
