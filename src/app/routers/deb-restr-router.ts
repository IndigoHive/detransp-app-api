import { type Request, Router } from 'express'
import { BadRequest } from 'http-errors'
import type { PixDebitoTipo } from '../../services/deb-restr/types'

function asNonEmptyString (value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

// The editor's collapsed "Consulta Veículo" node binds `representacao` to the
// "Tipo de veículo" radio label, so the label strings are part of the contract
// alongside booleans. Any other non-empty value means the flow copy drifted —
// fail loudly instead of silently treating it as "meus veículos".
const REPRESENTACAO_TRUE = new Set<unknown>([true, 'true', 'Veículos de outras pessoas'])
const REPRESENTACAO_FALSE = new Set<unknown>([false, 'false', '', undefined, null, 'Meus Veículos'])

function parseRepresentacao (value: unknown): boolean {
  if (REPRESENTACAO_TRUE.has(value)) return true
  if (REPRESENTACAO_FALSE.has(value)) return false
  throw BadRequest('Valor de representacao não reconhecido.')
}

const PIX_DEBITO_TIPOS: PixDebitoTipo[] = ['ipva', 'multas', 'licenciamento', 'total']

function asPixDebitoTipo (value: unknown): PixDebitoTipo | undefined {
  return PIX_DEBITO_TIPOS.includes(value as PixDebitoTipo) ? (value as PixDebitoTipo) : undefined
}

function buildPixUrl (req: Request, renavam: string, placa: string, tipo: PixDebitoTipo): string {
  return `${req.protocol}://${req.get('host')}/api/deb-restr/veiculos/${renavam}/pix/${tipo}?placa=${encodeURIComponent(placa)}`
}

// Every endpoint here calls out to ServiceNow (deb-restr or pgto), whose
// clients log the request/response/error but with no idea which screen or
// vehicle triggered it. This anchors that: one line per incoming request,
// tagged by action, so a failure a few lines later in the ServiceNow logs
// can be matched back to "which vehicle, which button" by timestamp.
function logRequest (req: Request, action: string, context: Record<string, unknown> = {}): void {
  req.scope.resolve('logger').info({ action, ...context }, 'Consulta de Débitos — requisição recebida')
}

export function debRestrRouter (): Router {
  const router = Router()

  router.get('/veiculos', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    if (!userCpf) {
      throw BadRequest('Requisição inválida.')
    }
    logRequest(req, 'lista-veiculos')
    const service = req.scope.resolve('listaVeiculosDebRestrService')
    const result = await service.run({ accessToken, userCpf })
    res.status(200).json(result)
  })

  router.post('/veiculos/:renavam/consulta', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.body?.placa)
    const representacao = parseRepresentacao(req.body?.representacao)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    logRequest(req, 'consulta-veiculo', { renavam, placa, representacao })
    const service = req.scope.resolve('consultaVeiculoDebitosService')
    const result = await service.run({ accessToken, userCpf, renavam, placa, representacao })
    res.status(200).json(result)
  })

  router.post('/veiculos/:renavam/consulta/impressao', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.body?.placa)
    const representacao = parseRepresentacao(req.body?.representacao)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    logRequest(req, 'consulta-veiculo-impressao', { renavam, placa, representacao })
    const service = req.scope.resolve('consultaVeiculoImpressaoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa, representacao })
    res.status(200).json(result)
  })

  router.get('/veiculos/:renavam/debitos/ipva', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.query.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    logRequest(req, 'detalhes-ipva', { renavam, placa })
    const service = req.scope.resolve('detalhesIpvaService')
    const result = await service.run({
      accessToken,
      userCpf,
      renavam,
      placa,
      pixUrl: buildPixUrl(req, renavam, placa, 'ipva')
    })
    res.status(200).json(result)
  })

  router.get('/veiculos/:renavam/debitos/multas', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.query.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    logRequest(req, 'detalhes-multas', { renavam, placa })
    const service = req.scope.resolve('detalhesMultasService')
    const result = await service.run({
      accessToken,
      userCpf,
      renavam,
      placa,
      pixUrl: buildPixUrl(req, renavam, placa, 'multas')
    })
    res.status(200).json(result)
  })

  router.post('/veiculos/:renavam/pix/:tipo', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const tipo = asPixDebitoTipo(req.params.tipo)
    // pix_screen flow nodes POST the pixUrl we generate (placa in the query,
    // no body) — accept both carriers
    const placa = asNonEmptyString(req.body?.placa) ?? asNonEmptyString(req.query.placa)
    const parcelado = req.body?.parcelado === true
    if (!userCpf || !renavam || !placa || !tipo) {
      throw BadRequest('Requisição inválida.')
    }
    logRequest(req, 'pix-cria', { renavam, placa, tipo, parcelado })
    const service = req.scope.resolve('criaPixDebitoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa, tipo, parcelado })
    res.status(201).json(result)
  })

  router.get('/veiculos/:renavam/pix/:tipo', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const tipo = asPixDebitoTipo(req.params.tipo)
    const placa = asNonEmptyString(req.query.placa)
    const idSolServico = asNonEmptyString(req.query.id)
    if (!userCpf || !renavam || !placa || !tipo || !idSolServico) {
      throw BadRequest('Requisição inválida.')
    }
    logRequest(req, 'pix-verifica', { renavam, placa, tipo, idSolServico })
    const service = req.scope.resolve('verificaPixDebitoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa, idSolServico })
    res.status(200).json(result)
  })

  router.get('/veiculos/:renavam/certidao/vigente', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.query.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    logRequest(req, 'certidao-vigente', { renavam, placa })
    const service = req.scope.resolve('buscaCertidaoVigenteService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(200).json(result)
  })

  router.post('/veiculos/:renavam/certidao/resumo', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.body?.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    logRequest(req, 'certidao-resumo', { renavam, placa })
    const service = req.scope.resolve('resumoCertidaoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(200).json(result)
  })

  router.post('/veiculos/:renavam/verificar', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.body?.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    logRequest(req, 'verifica-veiculo', { renavam, placa })
    const service = req.scope.resolve('verificaVeiculoDebRestrService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(200).json(result)
  })

  router.post('/veiculos/:renavam/certidao/taxa', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.body?.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    logRequest(req, 'certidao-taxa', { renavam, placa })
    const service = req.scope.resolve('consultaTaxaCertidaoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(200).json(result)
  })

  router.post('/veiculos/:renavam/certidao/qr-code', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    // Also POSTed by a pix_screen node with placa in the query, no body
    const placa = asNonEmptyString(req.body?.placa) ?? asNonEmptyString(req.query.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    logRequest(req, 'certidao-qrcode-cria', { renavam, placa })
    const service = req.scope.resolve('criaQRCodeCertidaoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(200).json(result)
  })

  router.get('/veiculos/:renavam/certidao/qr-code', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.query.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    logRequest(req, 'certidao-qrcode-verifica', { renavam, placa })
    const service = req.scope.resolve('verificaQRCodeCertidaoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(200).json(result)
  })

  router.post('/veiculos/:renavam/certidao/documento', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.body?.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    logRequest(req, 'certidao-emite', { renavam, placa })
    const service = req.scope.resolve('emiteCertidaoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(201).json(result)
  })

  router.get('/veiculos/:renavam/certidao/documento', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.query.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    logRequest(req, 'certidao-documento', { renavam, placa })
    const service = req.scope.resolve('buscaDocumentoCertidaoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(200).json(result)
  })

  return router
}
