import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import type { ContainerServices } from '../../container'
import type { GenerateServiceNowFormService } from '../../services/csm-protocols'

type ServiceNowFormServiceName = {
  [K in keyof ContainerServices]: ContainerServices[K] extends GenerateServiceNowFormService ? K : never
}[keyof ContainerServices]

const upload = multer({ storage: multer.memoryStorage() })

// Duas camadas de corrupção possíveis no nome do arquivo até chegar aqui:
// 1. O busboy (usado pelo multer) decodifica o header Content-Disposition como latin1 —
//    nomes enviados em UTF-8 cru (acentos) chegam "mojibake" (ex.: "á" -> "Ã¡").
// 2. O RN, por sua vez, percent-encoda o nome quando ele tem espaço/acento
//    (ex.: "Captura%20de%20Tela...") antes de mandar.
// Corrige as duas e normaliza para NFC (evita "à" como NFD/combining chegar diferente de "à" NFC).
function decodeFileName (name: string): string {
  const latin1Repaired = Buffer.from(name, 'latin1').toString('utf8')
  const candidate = latin1Repaired.includes('�') ? name : latin1Repaired

  try {
    return decodeURIComponent(candidate).normalize('NFC')
  } catch {
    return candidate.normalize('NFC')
  }
}

function attachmentFromRequest (req: Request) {
  return req.file
    ? {
        attachment: {
          buffer: req.file.buffer,
          originalName: decodeFileName(req.file.originalname),
          mimetype: req.file.mimetype,
        },
      }
    : {}
}

const SERVICE_NOW_FORM_ROUTES: Array<{ path: string, serviceName: ServiceNowFormServiceName }> = [
  { path: '/validar-curso-pratico-cnh-brasil', serviceName: 'validarCursoPraticoDaCNHDoBrasilNoDetranSpService' },
  { path: '/validar-curso-teorico-da-cnh-do-brasil-no-detran-sp', serviceName: 'validarCursoTeoricoDaCNHDoBrasilNoDetranSpService' },
  { path: '/liberar-matricula-da-autoescola', serviceName: 'liberarMatriculaDaAutoescolaService' },
  { path: '/retirar-corrigir-bloqueio-beneficio-tributario', serviceName: 'retirarCorrigirBloqueioBeneficioTributarioService' },
  { path: '/solicitar-cancelamento-intencao-venda', serviceName: 'solicitarCancelamentoIntencaoVendaService' },
  { path: '/solicitar-desbloqueio-laudo-vistoria', serviceName: 'solicitarDesbloqueioLaudoVistoriaService' },
  { path: '/alterar-tipo-processo-habilitacao', serviceName: 'alterarTipoProcessoHabilitacaoService' },
  { path: '/desistir-categoria-processo-habilitacao', serviceName: 'desistirCategoriaProcessoHabilitacaoService' },
  { path: '/retirar-restricao-infracao-transito-veiculo', serviceName: 'retirarRestricaoInfracaoTransitoVeiculoService' },
]

export function csmProtocolsRouter (): Router {
  const router = Router()

  for (const { path, serviceName } of SERVICE_NOW_FORM_ROUTES) {
    router.post(path, upload.single('anexos'), async (req: Request, res: Response) => {
      const service = req.scope.resolve(serviceName)

      // Sem anexo o app manda JSON puro; com anexo, multipart com o body em `data`.
      const data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body

      const result = await service.run({
        ...data,
        ...attachmentFromRequest(req),
      })

      res.status(200).json(result)
    })
  }

  router.get('/protocols', async (req, res) => {
    const { cpf } = req.session!
    const service = req.scope.resolve('listServiceCasesService')

    const result = await service.run(cpf)

    res.status(200).json(result)
  })

  router.post('/protocols/attachment', upload.single('anexos'), async (req, res) => {
    const service = req.scope.resolve('uploadProtocolAttachmentService')

    const result = await service.run({
      ...req.body,
      ...attachmentFromRequest(req),
    })

    res.status(200).json(result)
  })

  router.get('/protocols/detail', async (req, res) => {
    const service = req.scope.resolve('getProtocolCaseDetailService')

    const sysId = typeof req.query.sys_id === 'string' ? req.query.sys_id : ''

    const result = await service.run(sysId)

    res.status(200).json(result)
  })

  router.get('/protocols/messages', async (req, res) => {
    const service = req.scope.resolve('listProtocolMessagesService')

    const sysId = typeof req.query.sys_id === 'string' ? req.query.sys_id : ''

    const result = await service.run(sysId)

    res.status(200).json(result)
  })

  router.post('/protocols/finalize', async (req, res) => {
    const service = req.scope.resolve('finalizeProtocolService')

    const result = await service.run(req.body)

    res.status(200).json(result)
  })

  return router
}
