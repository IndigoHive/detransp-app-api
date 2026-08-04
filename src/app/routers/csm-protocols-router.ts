import { Router, type Request, type Response } from 'express'
import multer from 'multer'

// O app anexa vários arquivos de uma vez (DocumentPicker com `multiple: true`), todos no
// mesmo campo `anexos` — por isso `upload.array` e não `upload.single`.
// Como o storage é em memória, os limites abaixo são o que impede N buffers arbitrários na heap;
// `files` é a única fonte de verdade da quantidade (por isso `array()` vai sem maxCount).
const MAX_ANEXOS = 10
const MAX_ANEXO_BYTES = 10 * 1024 * 1024

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: MAX_ANEXOS, fileSize: MAX_ANEXO_BYTES },
})

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

function attachmentsFromRequest (req: Request) {
  const files = Array.isArray(req.files) ? req.files : []

  return files.map((file) => ({
    buffer: file.buffer,
    originalName: decodeFileName(file.originalname),
    mimetype: file.mimetype,
  }))
}

export function csmProtocolsRouter (): Router {
  const router = Router()

  router.get('/protocols', async (req, res) => {
    const { cpf } = req.session!
    const service = req.scope.resolve('listServiceCasesService')

    const result = await service.run(cpf)

    res.status(200).json(result)
  })

  router.post('/protocols/attachment', upload.array('anexos'), async (req, res) => {
    const service = req.scope.resolve('uploadProtocolAttachmentService')

    const result = await service.run({
      ...req.body,
      attachments: attachmentsFromRequest(req),
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
    const userInfo = req.session?.userInfo as { name?: unknown } | undefined
    const userName = typeof userInfo?.name === 'string' ? userInfo.name : undefined

    const result = await service.run(sysId, userName)

    res.status(200).json(result)
  })

  router.post('/protocols/finalize', async (req, res) => {
    const service = req.scope.resolve('finalizeProtocolService')

    const result = await service.run(req.body)

    res.status(200).json(result)
  })

  // Precisa vir depois de '/protocols/attachment' e '/protocols/finalize': o Router do Express casa
  // na ordem de registro, então um ':catalogItemId' declarado antes engoliria esses dois literais
  // (também POST). O payload vem pronto do Editor — aqui é só proxy para o ServiceNow.
  router.post('/protocols/:catalogItemId', upload.array('anexos'), async (req: Request, res: Response) => {
    const service = req.scope.resolve('submitCsmProtocolService')

    // Sem anexo o app manda JSON puro; com anexo, multipart com o body em `data`.
    const payload = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body
    const catalogItemId = typeof req.params.catalogItemId === 'string' ? req.params.catalogItemId : ''

    const result = await service.run({
      catalogItemId,
      payload,
      attachments: attachmentsFromRequest(req),
    })

    res.status(200).json(result)
  })

  return router
}
