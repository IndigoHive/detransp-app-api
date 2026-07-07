import { Router } from 'express'
import multer from 'multer'

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

export function servicesRouter (): Router {
  const router = Router()

  router.post('/validar-curso-teorico-da-cnh-do-brasil-no-detran-sp', upload.single('anexos'), async (req, res) => {
    const service = req.scope.resolve('validarCursoTeoricoDaCNHDoBrasilNoDetranSpService')

    const body = req.body ?? {}
    const toBoolean = (value: unknown): boolean => value === true || value === 'true'
    const toString = (value: unknown): string => typeof value === 'string' ? value : ''

    const result = await service.run({
      nome: toString(body.nome),
      cpfOuCnpj: toString(body.cpfOuCnpj),
      telefone: toString(body.telefone),
      email: toString(body.email),
      municipio: toString(body.municipio),
      jaRealizeiEtapaIniciarProcessoPrimeiraHabilitacaoJuntoPortalDetranSP: toBoolean(body.jaRealizeiEtapaIniciarProcessoPrimeiraHabilitacaoJuntoPortalDetranSP),
      jaRealizeiExameAptidaoFisicaMentalExameMedicoAvaliacaoPsicologica: toBoolean(body.jaRealizeiExameAptidaoFisicaMentalExameMedicoAvaliacaoPsicologica),
      jaConcluiEtapaCursoTeoricoExpedicaoCertificado: toBoolean(body.jaConcluiEtapaCursoTeoricoExpedicaoCertificado),
      ...(body.documentoComprovanteRepresentacao === undefined ? {} : { documentoComprovanteRepresentacao: toBoolean(body.documentoComprovanteRepresentacao) }),
      representation: toBoolean(body.representation),
      ...(req.file
        ? {
            attachment: {
              buffer: req.file.buffer,
              originalName: decodeFileName(req.file.originalname),
              mimetype: req.file.mimetype,
            },
          }
        : {}),
    })

    res.status(200).json(result)
  })

  router.get('/protocols', async (req, res) => {
    const { cpf } = req.session!
    const service = req.scope.resolve('listServiceCasesService')

    const result = await service.run(cpf)

    res.status(200).json(result)
  })

  router.post('/protocols/attachment', upload.single('anexos'), async (req, res) => {
    const service = req.scope.resolve('uploadProtocolAttachmentService')

    const sysId = typeof req.body?.sys_id === 'string' ? req.body.sys_id : ''
    const comment = typeof req.body?.comment === 'string' ? req.body.comment : ''

    const result = await service.run({
      sysId,
      comment,
      ...(req.file
        ? {
            attachment: {
              buffer: req.file.buffer,
              originalName: decodeFileName(req.file.originalname),
              mimetype: req.file.mimetype,
            },
          }
        : {}),
    })

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
