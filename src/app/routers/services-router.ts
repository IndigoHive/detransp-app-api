import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import type { ContainerServices } from '../../container'
import type { ServiceNowFormService } from '../../services/services'

type ServiceNowFormServiceName = {
  [K in keyof ContainerServices]: ContainerServices[K] extends ServiceNowFormService ? K : never
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
  { path: '/validar-curso-teorico-da-cnh-do-brasil-no-detran-sp', serviceName: 'validarCursoTeoricoDaCNHDoBrasilNoDetranSpService' },
  { path: '/liberar-matricula-da-autoescola', serviceName: 'liberarMatriculaDaAutoescolaService' },
  { path: '/retirar-corrigir-bloqueio-beneficio-tributario', serviceName: 'retirarCorrigirBloqueioBeneficioTributarioService' },
  { path: '/solicitar-cancelamento-intencao-venda', serviceName: 'solicitarCancelamentoIntencaoVendaService' },
]

export function servicesRouter (): Router {
  const router = Router()

  for (const { path, serviceName } of SERVICE_NOW_FORM_ROUTES) {
    router.post(path, upload.single('anexos'), async (req: Request, res: Response) => {
      const service = req.scope.resolve(serviceName)

      const result = await service.run({
        ...JSON.parse(req.body.data),
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
    const service = req.scope.resolve('getServiceCaseDetailService')

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
