import { Router } from 'express'
import multer from 'multer'

const upload = multer({ storage: multer.memoryStorage() })

function parseBoolean (value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'yes'
  }

  return false
}

export function servicesRouter (): Router {
  const router = Router()

  router.get('/get-vehicles', async (req, res) => {
    const service = req.scope.resolve('getVehiclesService')

    const result = await service.run()

    res.status(200).json(result)
  })

  router.post('/solicitar-vistoria-em-transito', async (req, res) => {
    const service = req.scope.resolve('solicitarVistoriaEmTransitoService')

    const result = await service.run(req.body)

    res.status(200).json(result)
  })

  router.post('/validar-curso-teorico-da-cnh-do-brasil-no-detran-sp', upload.single('attachment'), async (req, res) => {
    const service = req.scope.resolve('validarCursoTeoricoDaCNHDoBrasilNoDetranSpService')

    const input = {
      nome: typeof req.body?.nome === 'string' ? req.body.nome : '',
      cpfOuCnpj: typeof req.body?.cpfOuCnpj === 'string' ? req.body.cpfOuCnpj : '',
      telefone: typeof req.body?.telefone === 'string' ? req.body.telefone : '',
      email: typeof req.body?.email === 'string' ? req.body.email : '',
      municipio: typeof req.body?.municipio === 'string' ? req.body.municipio : '',
      jaRealizeiEtapaIniciarProcessoPrimeiraHabilitacaoJuntoPortalDetranSP: parseBoolean(req.body?.jaRealizeiEtapaIniciarProcessoPrimeiraHabilitacaoJuntoPortalDetranSP),
      jaRealizeiExameAptidaoFisicaMentalExameMedicoAvaliacaoPsicologica: parseBoolean(req.body?.jaRealizeiExameAptidaoFisicaMentalExameMedicoAvaliacaoPsicologica),
      jaConcluiEtapaCursoTeoricoExpedicaoCertificado: parseBoolean(req.body?.jaConcluiEtapaCursoTeoricoExpedicaoCertificado),
      documentoComprovanteRepresentacao: parseBoolean(req.body?.documentoComprovanteRepresentacao),
      representation: parseBoolean(req.body?.representation),
      ...(req.file ? {
        attachment: {
          buffer: req.file.buffer,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
        },
      } : {}),
    }

    const result = await service.run(input)

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
