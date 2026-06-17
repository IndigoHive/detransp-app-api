import { Router, type Response } from 'express'
import { DetranSpServiceNowLicenciamentoError } from '../../clients/detran-sp-service-now-licenciamento/errors/detran-sp-service-now-licenciamento-error'
import { normalizeSituacaoLicenciamento } from '../../clients/detran-sp-service-now-licenciamento/types/_common'
import type { SituacaoLicenciamento } from '../../clients/detran-sp-service-now-licenciamento/types/_common'
import type {
  DebitoData,
  ListaMultasData,
  ListaVeiculosVeiculoData,
  VerificaVeiculoData
} from '../../clients/detran-sp-service-now-licenciamento/types'
import { extractCpfFromToken } from '../../utils/token'

type VehicleAttributes = {
  chassi?: string | undefined
  yearFab?: string | undefined
  yearMod?: string | undefined
  cor?: string | undefined
  combustivel?: string | undefined
  tipo?: string | undefined
}

type VehicleRestrictions = {
  bloqueioFurtoRoubo?: string | undefined
  restricaoTributaria?: string | undefined
  restricaoAdministrativa?: string | undefined
  restricaoJudicial?: string | undefined
  restricaoVeiculoGuinchado?: string | undefined
  nomeAgente?: string | null | undefined
}

type VehicleStatus = 'REGULAR' | 'A VENCER' | 'VENCIDO'

type VehicleItem = {
  id: string
  title: string
  plate: string
  status: VehicleStatus
  licensingExpirationDate: string
  brandModel: string
  renavam: string
  lastLicensing?: string
}

function handleError (res: Response, error: unknown): void {
  if (error instanceof DetranSpServiceNowLicenciamentoError) {
    res.status(422).json({ message: error.message })
    return
  }
  const message = error instanceof Error ? error.message : 'Internal server error'
  res.status(500).json({ message })
}

export function licenciamentoRouter (): Router {
  const router = Router()

  router.get('/veiculos', async (req, res) => {
    const accessToken = getBearerToken(req.headers.authorization)
    const userCpf = asNonEmptyString(req.headers['x-cpf-usuario']) ?? (accessToken ? asNonEmptyString(extractCpfFromToken(accessToken)) : undefined)

    if (!accessToken || !userCpf) {
      res.status(400).json({ message: 'Missing required fields: Authorization, X-CPF-Usuario headers.' })
      return
    }

    const client = req.scope.resolve('detranSpServiceNowLicenciamentoClient')
    const result = await client.listaVeiculos({ accessToken, userCpf })
    const vehicles = (result?.result ?? []).map(toVehicleItemFromLista)
    res.status(200).json({ vehicles })
  })

  router.post('/veiculos/representacao', async (req, res) => {
    const accessToken = getBearerToken(req.headers.authorization)
    const userCpf = asNonEmptyString(req.headers['x-cpf-usuario']) ?? (accessToken ? asNonEmptyString(extractCpfFromToken(accessToken)) : undefined)
    const renavam = asNonEmptyString(req.body?.renavam)
    const placa = asNonEmptyString(req.body?.placa)

    if (!accessToken || !userCpf || !renavam || !placa) {
      res.status(400).json({ message: 'Missing required fields: Authorization header and renavam, placa in body.' })
      return
    }

    const client = req.scope.resolve('detranSpServiceNowLicenciamentoClient')
    const auth = { accessToken, userCpf, renavam, placa }

    try {
      const result = await client.verificaVeiculo(auth, renavam)
      const data = result?.result
      if (!data) {
        res.status(200).json({ vehicle: null })
        return
      }

      const debitosResult = await client.listaDebitosVeiculo(auth, renavam)
      const debts: DebitoData[] = debitosResult?.result ?? []
      const totalDebits = debts.reduce((sum, d) => sum + d.valor, 0)
      const onlyLicensing = debts.length > 0 && debts.every(d => d.tipoServico === 5)
      const hasPayableDebts = debts.some(d => d.tipoServico === 6 || d.tipoServico === 7)
      const vehicle = toVehicleItemFromVerifica(data)
      const isLicensingOverdue = vehicle.status === 'VENCIDO'

      const hasMultas = debts.some(d => d.tipoServico === 7)
      let multasDetail: Record<string, ListaMultasData[]> = {}
      if (hasMultas) {
        try {
          const multasResult = await client.listaMultas(auth, renavam)
          for (const m of multasResult?.result ?? []) {
            const entry = multasDetail[m.autoInfracao] ?? []
            entry.push(m)
            multasDetail[m.autoInfracao] = entry
          }
        } catch (err) {
          if (!(err instanceof DetranSpServiceNowLicenciamentoError)) throw err
        }
      }

      res.status(200).json({
        vehicle,
        vigency: vehicle.status,
        isBlocked: false,
        isGnvBlocked: false,
        hasMultaForaDoSistema: false,
        onlyLicensing,
        hasPayableDebts,
        isLicensingOverdue,
        debts,
        result: debts,
        totalDebits,
        multasDetail
      })
    } catch (err) {
      if (err instanceof DetranSpServiceNowLicenciamentoError) {
        res.status(200).json({ vehicle: null })
        return
      }
      throw err
    }
  })

  router.post('/veiculos/:renavam/verificar', async (req, res) => {
    const accessToken = getBearerToken(req.headers.authorization)
    const userCpf = asNonEmptyString(req.headers['x-cpf-usuario']) ?? (accessToken ? asNonEmptyString(extractCpfFromToken(accessToken)) : undefined)
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.body?.placa)

    if (!accessToken || !userCpf || !renavam || !placa) {
      res.status(400).json({ message: 'Missing required fields: Authorization, X-CPF-Usuario headers and placa in body.' })
      return
    }

    const client = req.scope.resolve('detranSpServiceNowLicenciamentoClient')
    const auth = { accessToken, userCpf, renavam, placa }

    let vehicle: VehicleItem | undefined
    const veiculosResult = await client.listaVeiculos({ accessToken, userCpf })
    const vehicleFromList = (veiculosResult?.result ?? []).find((v: ListaVeiculosVeiculoData) => v.codigoRenavamVeiculo === renavam)
    vehicle = vehicleFromList ? toVehicleItemFromLista(vehicleFromList) : undefined

    let hasMultaForaDoSistema = false
    let vigency: VehicleStatus = 'VENCIDO'

    try {
      const verifyResult = await client.verificaVeiculo(auth, renavam)
      vigency = mapStatus(verifyResult?.result?.situacaoLicenciamento)
    } catch (err) {
      if (!(err instanceof DetranSpServiceNowLicenciamentoError)) {
        throw err
      }

      const isLicensingOverdue = vehicle?.status === 'VENCIDO'

      if (err.type === 'VeiculoComPendenciaError') {
        res.status(200).json({ vehicle, vigency: 'VENCIDO', isBlocked: true, isGnvBlocked: false, hasMultaForaDoSistema: false, onlyLicensing: false, hasPayableDebts: false, isLicensingOverdue, debts: [], result: [], totalDebits: 0, multasDetail: {} })
        return
      }
      if (err.type === 'VeiculoSemCertificadoGNVVigenteError') {
        const debitosResult = await client.listaDebitosVeiculo(auth, renavam)
        const debts: DebitoData[] = debitosResult?.result ?? []
        const totalDebits = debts.reduce((sum, d) => sum + d.valor, 0)
        const hasPayableDebts = debts.some(d => d.tipoServico === 6 || d.tipoServico === 7)
        let multasDetail: Record<string, ListaMultasData[]> = {}
        if (debts.some(d => d.tipoServico === 7)) {
          try {
            const multasResult = await client.listaMultas(auth, renavam)
            for (const m of multasResult?.result ?? []) {
              const entry = multasDetail[m.autoInfracao] ?? []
              entry.push(m)
              multasDetail[m.autoInfracao] = entry
            }
          } catch (multasErr) {
            if (!(multasErr instanceof DetranSpServiceNowLicenciamentoError)) throw multasErr
          }
        }
        res.status(200).json({ vehicle, vigency: 'VENCIDO', isBlocked: false, isGnvBlocked: true, hasMultaForaDoSistema: false, onlyLicensing: false, hasPayableDebts, isLicensingOverdue, debts, result: debts, totalDebits, multasDetail })
        return
      }
      if (err.type === 'VeiculoComMultaForaDoSistemaError') {
        hasMultaForaDoSistema = true
      } else if (err.type === 'FalhaNaOperacaoError') {
        res.status(200).json({ vehicle, vigency: 'VENCIDO', isBlocked: false, isGnvBlocked: false, hasMultaForaDoSistema: false, onlyLicensing: false, hasPayableDebts: false, isLicensingOverdue: vehicle?.status === 'VENCIDO', debts: [], result: [], totalDebits: 0, multasDetail: {} })
        return
      } else {
        res.status(200).json({ vehicle, vigency: 'VENCIDO', isBlocked: true, isGnvBlocked: false, hasMultaForaDoSistema: false, onlyLicensing: false, hasPayableDebts: false, isLicensingOverdue: vehicle?.status === 'VENCIDO', debts: [], result: [], totalDebits: 0, multasDetail: {} })
        return
      }
    }

    const debitosResult = await client.listaDebitosVeiculo(auth, renavam)
    const debts: DebitoData[] = debitosResult?.result ?? []
    const totalDebits = debts.reduce((sum, d) => sum + d.valor, 0)

    const onlyLicensing = debts.length > 0 && debts.every(d => d.tipoServico === 5)
    const hasPayableDebts = debts.some(d => d.tipoServico === 6 || d.tipoServico === 7)
    const isLicensingOverdue = hasMultaForaDoSistema ? vehicle?.status === 'VENCIDO' : vigency !== 'REGULAR'

    let multasDetail: Record<string, ListaMultasData[]> = {}
    if (hasMultaForaDoSistema) {
      try {
        const multasResult = await client.listaMultas(auth, renavam)
        for (const m of multasResult?.result ?? []) {
          const entry = multasDetail[m.autoInfracao] ?? []
          entry.push(m)
          multasDetail[m.autoInfracao] = entry
        }
      } catch (err) {
        if (!(err instanceof DetranSpServiceNowLicenciamentoError)) throw err
      }
    }

    let vehicleAttributes: VehicleAttributes | undefined
    let restrictions: VehicleRestrictions | undefined
    try {
      const debRestrClient = req.scope.resolve('detranSpServiceNowDebRestrClient')
      const consultaResult = await debRestrClient.consultaVeiculo(auth, renavam)
      const attrs = consultaResult?.data?.attributes
      const meta = consultaResult?.data?.meta

      if (attrs) {
        vehicleAttributes = {
          chassi: attrs.chassi,
          yearFab: attrs.anoFabricacao?.toString(),
          yearMod: attrs.anoModelo?.toString(),
          cor: attrs.cor?.descricao,
          combustivel: attrs.combustivel?.descricao,
          tipo: attrs.tipo?.descricao,
        }
      }
      if (meta) {
        restrictions = {
          bloqueioFurtoRoubo: meta.bloqueioFurtoRoubo,
          restricaoTributaria: meta.restricaoTributaria,
          restricaoAdministrativa: meta.restricaoAdministrativa,
          restricaoJudicial: meta.restricaoJudicial,
          restricaoVeiculoGuinchado: meta.restricaoVeiculoGuinchado,
          nomeAgente: meta.nomeAgente,
        }
      }
    } catch {
      // deb-restr is non-fatal: vehicle details still load without extra attributes
    }

    res.status(200).json({
      vehicle,
      vigency,
      isBlocked: false,
      isGnvBlocked: false,
      hasMultaForaDoSistema,
      onlyLicensing,
      hasPayableDebts,
      isLicensingOverdue,
      debts,
      result: debts,
      totalDebits,
      multasDetail,
      vehicleAttributes,
      restrictions,
    })
  })

  router.post('/veiculos/:renavam/qr-code', async (req, res) => {
    const accessToken = getBearerToken(req.headers.authorization)
    const userCpf = asNonEmptyString(req.headers['x-cpf-usuario']) ?? (accessToken ? asNonEmptyString(extractCpfFromToken(accessToken)) : undefined)
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.body?.placa)

    if (!accessToken || !userCpf || !renavam || !placa) {
      res.status(400).json({ message: 'Missing required fields: Authorization, X-CPF-Usuario headers and placa in body.' })
      return
    }

    const client = req.scope.resolve('detranSpServiceNowLicenciamentoClient')
    const auth = { accessToken, userCpf, renavam, placa }

    try {
      let qrCodeData
      try {
        const result = await client.criaQRCode(auth, renavam)
        qrCodeData = result?.result
      } catch (createErr) {
        if (!(createErr instanceof DetranSpServiceNowLicenciamentoError)) {
          throw createErr
        }

        try {
          const existing = await client.verificaQRCode(auth, renavam)
          const existingData = existing?.result
          if (existingData && existingData.estadoQRCode === 1) {
            qrCodeData = existingData
          } else {
            res.status(422).json({ message: createErr.message })
            return
          }
        } catch {
          res.status(422).json({ message: createErr.message })
          return
        }
      }

      res.status(200).json({
        qrCode: qrCodeData?.qrCode ?? null,
        expiresAt: qrCodeData?.dataExpiracaoQRCode ?? null
      })
    } catch (err) {
      handleError(res, err)
    }
  })

  router.get('/veiculos/:renavam/qr-code', async (req, res) => {
    const accessToken = getBearerToken(req.headers.authorization)
    const userCpf = asNonEmptyString(req.headers['x-cpf-usuario']) ?? (accessToken ? asNonEmptyString(extractCpfFromToken(accessToken)) : undefined)
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.query.placa)

    if (!accessToken || !userCpf || !renavam || !placa) {
      res.status(400).json({ message: 'Missing required fields: Authorization, X-CPF-Usuario headers and placa query param.' })
      return
    }

    const client = req.scope.resolve('detranSpServiceNowLicenciamentoClient')
    try {
      const result = await client.verificaQRCode({ accessToken, userCpf, renavam, placa }, renavam)
      const data = result?.result
      res.status(200).json({
        estado: data?.estadoQRCode ?? null,
        comprovante: data?.idPagamentoQRCode ?? null,
        confirmedDate: data?.dataPagamentoQRCode ? formatDateTimeBr(data.dataPagamentoQRCode) : null
      })
    } catch (err) {
      handleError(res, err)
    }
  })

  router.get('/veiculos/:renavam/crlv-e', async (req, res) => {
    const accessToken = getBearerToken(req.headers.authorization)
    const userCpf = asNonEmptyString(req.headers['x-cpf-usuario']) ?? (accessToken ? asNonEmptyString(extractCpfFromToken(accessToken)) : undefined)
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.query.placa)

    if (!accessToken || !userCpf || !renavam || !placa) {
      res.status(400).json({ message: 'Missing required fields: Authorization, X-CPF-Usuario headers and placa query param.' })
      return
    }

    const client = req.scope.resolve('detranSpServiceNowLicenciamentoClient')
    try {
      const result = await client.buscaCrlve({ accessToken, userCpf, renavam, placa }, renavam)
      res.status(200).json({ base64: result?.result?.base64 ?? null })
    } catch (err) {
      if (err instanceof DetranSpServiceNowLicenciamentoError) {
        res.status(422).json({ message: err.message })
        return
      }
      throw err
    }
  })

  return router
}

function mapStatus (situacao: SituacaoLicenciamento | undefined): VehicleStatus {
  if (!situacao) return 'VENCIDO'
  const normalized = normalizeSituacaoLicenciamento(situacao)
  if (normalized === 'Em dia') return 'REGULAR'
  if (normalized === 'À vencer') return 'A VENCER'
  return 'VENCIDO'
}

function formatDateBr (isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

function formatDateTimeBr (isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo'
  })
}

function toVehicleItemFromLista (v: ListaVeiculosVeiculoData): VehicleItem {
  return {
    id: v.codigoRenavamVeiculo,
    renavam: v.codigoRenavamVeiculo,
    title: v.marcaVeiculo,
    brandModel: v.marcaVeiculo,
    plate: v.placaVeiculo,
    status: mapStatus(v.situacaoLicenciamento),
    licensingExpirationDate: formatDateBr(v.dataVencimentoLicenciamento),
    lastLicensing: formatDateBr(v.dataLicenciamentoVeiculo)
  }
}

function toVehicleItemFromVerifica (v: VerificaVeiculoData): VehicleItem {
  return {
    id: v.codigoRenavamVeiculo,
    renavam: v.codigoRenavamVeiculo,
    title: v.marcaVeiculo,
    brandModel: v.marcaVeiculo,
    plate: v.placaVeiculo,
    status: mapStatus(v.situacaoLicenciamento),
    licensingExpirationDate: formatDateBr(v.dataVencimentoLicenciamento)
  }
}

function asNonEmptyString (value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function getBearerToken (authorizationHeader: string | undefined): string | undefined {
  if (!authorizationHeader) return undefined
  const [scheme, token] = authorizationHeader.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return undefined
  return token
}
