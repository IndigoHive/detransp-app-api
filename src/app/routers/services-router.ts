import { Router } from 'express'
import multer from 'multer'

const upload = multer({ limits: { files: 10, fileSize: 10 * 1024 * 1024 } })

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

export function servicesRouter (): Router {
  const router = Router()

  router.get('/get-vehicles', async (req, res) => {
    const service = req.scope.resolve('getVehiclesService')

    const result = await service.run()

    res.status(200).json(result)
  })

  router.post('/solicitar-vistoria-em-transito', upload.any(), async (req, res) => {
    const service = req.scope.resolve('solicitarVistoriaEmTransitoService')

    const input = JSON.parse(req.body.data)
    const anexos = (req.files as Express.Multer.File[] ?? []).map(file => ({
      name: decodeFileName(file.originalname),
      mimeType: file.mimetype,
      size: file.size,
    }))

    const result = await service.run({ ...input, anexos })

    res.status(200).json(result)
  })

  router.get('/protocols', async (req, res) => {
    const service = req.scope.resolve('listServiceCasesService')

    const result = await service.run(req.headers.authorization)

    res.status(200).json(result)
  })

  router.get('/protocols/detail', async (req, res) => {
    const service = req.scope.resolve('getServiceCaseDetailService')

    const sysId = typeof req.query.sys_id === 'string' ? req.query.sys_id : ''

    const result = await service.run(sysId)

    res.status(200).json(result)
  })

  return router
}
