import { type Request, Router } from 'express'
import { BadRequest, Unauthorized } from 'http-errors'
import { isOtherProcessLabel, isProcessLabel } from '../../services/vistorias/verifica-veiculo-service'
import type { VistoriasAuth } from '../../services/vistorias'
import { stripHtml } from '../../utils/strip-html'

const PLATE_PATTERN = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/
const RENAVAM_PATTERN = /^\d{9,11}$/
const WITHOUT_VEHICLE_DATA_PATH_VALUE = 'sem-identificacao'
const PEV_NUMBER_PATTERN = /^PEV\d+$/
const DOCUMENT_PATTERN = /^(?:\d{11}|\d{14})$/
const VISTORIA_TOKEN_PATTERN = /^[A-Z0-9]{4}(?:-[A-Z0-9]{4}){3}$/
const DOC_PROPRIETARIO_BY_PAYMENT_LABEL = {
  'Meus pagamentos': false,
  'Meus veiculos': true,
  'Meus veículos': true,
  'Meus Veiculos': true,
  'Meus Veículos': true
} as const

function asNonEmptyString (value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function asOptionalBoolean (value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === '') return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  throw BadRequest(`${field} deve ser true ou false.`)
}

export function getDocProprietarioByPaymentLabel (label: string | undefined): boolean | undefined {
  const normalized = label ? stripHtml(label) : label
  if (!normalized || !(normalized in DOC_PROPRIETARIO_BY_PAYMENT_LABEL)) {
    return undefined
  }

  return DOC_PROPRIETARIO_BY_PAYMENT_LABEL[normalized as keyof typeof DOC_PROPRIETARIO_BY_PAYMENT_LABEL]
}

function getAuth (req: Request): VistoriasAuth {
  if (!req.session) {
    throw Unauthorized('Sessão não encontrada.')
  }

  const token = req.session.accessToken
  const cpf = req.session.cpf

  if (!token || !cpf) {
    throw BadRequest('Informações de autenticação não encontradas na sessão.')
  }

  return { token, cpf }
}

export function vistoriasRouter (): Router {
  const router = Router()

  router.post('/veiculos/verificar', async (req, res) => {
    const auth = getAuth(req)
    const tipoProcesso = asNonEmptyString(req.body?.tipoProcesso)
    const requestedProcessSubtype = asNonEmptyString(req.body?.outroProcesso)

    if (!tipoProcesso) {
      throw BadRequest('Tipo de processo ausente.')
    }

    const processSubtype = getApplicableProcessSubtype(tipoProcesso, requestedProcessSubtype)
    const allowsMissingVehicleData = isProcessWithoutVehicleData(tipoProcesso, processSubtype)

    if (!allowsMissingVehicleData && !isProcessLabel(tipoProcesso)) {
      throw BadRequest('Tipo de processo inválido.')
    }
    if (stripHtml(tipoProcesso) === 'Outros' && (!processSubtype || !isOtherProcessLabel(processSubtype))) {
      throw BadRequest('Outro processo inválido ou ausente.')
    }

    const placa = asNonEmptyString(req.body?.placa)?.toUpperCase()
    const renavam = asNonEmptyString(req.body?.renavam)

    if (!allowsMissingVehicleData && (!placa || !renavam)) {
      throw BadRequest('Campos obrigatórios ausentes: placa e renavam.')
    }
    if (placa && !PLATE_PATTERN.test(placa)) {
      throw BadRequest('Placa inválida.')
    }
    if (renavam && !RENAVAM_PATTERN.test(renavam)) {
      throw BadRequest('RENAVAM inválido.')
    }

    const service = req.scope.resolve('verificaVeiculoVistoriaService')
    const result = await service.run({
      ...auth,
      placa: placa ?? '',
      renavam: renavam ?? '',
      tipoProcesso,
      ...(processSubtype ? { outroProcesso: processSubtype } : {})
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

    if (!isValidVehicleIdentifierPath(renavam)) {
      throw BadRequest('RENAVAM inválido.')
    }

    const service = req.scope.resolve('criaQRCodeVistoriaService')
    const result = await service.run(auth, correlationId)
    res.status(200).json(result)
  })

  router.get('/veiculos/:renavam/qr-code', async (req, res) => {
    const auth = getAuth(req)
    const renavam = asNonEmptyString(req.params.renavam)
    const paymentId = asNonEmptyString(req.query.id)

    if (!isValidVehicleIdentifierPath(renavam)) {
      throw BadRequest('RENAVAM inválido.')
    }

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

    if (!isValidVehicleIdentifierPath(renavam)) {
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
    const renavam = asNonEmptyString(req.query.renavam)
    const semPlaca = asOptionalBoolean(req.query.semPlaca, 'semPlaca')
    const semRenavam = asOptionalBoolean(req.query.semRenavam, 'semRenavam')

    if (!documento || !DOCUMENT_PATTERN.test(documento)) {
      throw BadRequest('Documento inválido.')
    }
    if (docProprietario === undefined) {
      throw BadRequest('docProprietario deve ser Meus pagamentos ou Meus Veículos.')
    }
    if (renavam && !RENAVAM_PATTERN.test(renavam)) throw BadRequest('RENAVAM inválido.')

    const service = req.scope.resolve('listaPagamentosVistoriaService')
    const result = await service.run(auth, documento, docProprietario, {
      ...(renavam ? { renavam } : {}),
      ...(semPlaca === undefined ? {} : { semPlaca }),
      ...(semRenavam === undefined ? {} : { semRenavam })
    })
    res.status(200).json(result)
  })

  router.post('/restituicoes', async (req, res) => {
    const auth = getAuth(req)
    const token = asNonEmptyString(req.body?.token)
    const documento = asNonEmptyString(req.body?.documento)

    if (!token || !VISTORIA_TOKEN_PATTERN.test(token)) {
      throw BadRequest('Token da vistoria inválido.')
    }
    if (!documento || !DOCUMENT_PATTERN.test(documento)) {
      throw BadRequest('Documento inválido.')
    }

    const service = req.scope.resolve('solicitaRestituicaoVistoriaService')
    const result = await service.run(auth, token, documento)
    res.status(200).json(result)
  })

  router.get('/restituicoes/:numeroPEV/documento', async (req, res) => {
    const auth = getAuth(req)
    const numeroPEV = asNonEmptyString(req.params.numeroPEV)

    if (!numeroPEV || !PEV_NUMBER_PATTERN.test(numeroPEV)) {
      throw BadRequest('Número PEV inválido.')
    }

    const service = req.scope.resolve('buscaDocumentoRestituicaoVistoriaService')
    const result = await service.run(auth, numeroPEV)
    res.status(200).json(result)
  })

  router.get('/documentos/:numeroPEV', async (req, res) => {
    const auth = getAuth(req)
    const numeroPEV = asNonEmptyString(req.params.numeroPEV)

    if (!numeroPEV || !PEV_NUMBER_PATTERN.test(numeroPEV)) {
      throw BadRequest('Número PEV inválido.')
    }

    const service = req.scope.resolve('buscaDocumentoVistoriaService')
    const result = await service.run(auth, numeroPEV)
    res.status(200).json(result)
  })

  return router
}

export function getApplicableProcessSubtype (processType: string, requestedSubtype: string | undefined) {
  const normalizedProcessType = stripHtml(processType)
  return normalizedProcessType === 'Outros' || isProcessWithoutVehicleData(normalizedProcessType, requestedSubtype)
    ? requestedSubtype
    : undefined
}

export function isProcessWithoutVehicleData (processType: string, processSubtype: string | undefined) {
  return stripHtml(processType) === 'SEGURANCA' && processSubtype === 'SEGURANCA_9'
}

export function isValidVehicleIdentifierPath (renavam: string | undefined) {
  return renavam === WITHOUT_VEHICLE_DATA_PATH_VALUE || Boolean(renavam && RENAVAM_PATTERN.test(renavam))
}
