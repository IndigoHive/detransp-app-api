import { Router } from 'express'
import { DetranSpServiceNowLicenciamentoError } from '../../clients/detran-sp-service-now-licenciamento/errors/detran-sp-service-now-licenciamento-error'
import { normalizeSituacaoLicenciamento } from '../../clients/detran-sp-service-now-licenciamento/types/_common'
import type { SituacaoLicenciamento } from '../../clients/detran-sp-service-now-licenciamento/types/_common'
import type {
  DebitoData,
  DebitoMultaData,
  ListaMultasData,
  ListaVeiculosVeiculoData,
  VerificaVeiculoData
} from '../../clients/detran-sp-service-now-licenciamento/types'

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

export function licenciamentoRouter (): Router {
  const router = Router()

  router.get('/veiculos', async (req, res) => {
    const accessToken = getBearerToken(req.headers.authorization)
    const userCpf = asNonEmptyString(req.headers['x-cpf-usuario'])

    if (!accessToken || !userCpf) {
      res.status(400).json({ message: 'Missing required headers: Authorization and X-CPF-Usuario.' })
      return
    }

    const client = req.scope.resolve('detranSpServiceNowLicenciamentoClient')
    const result = await client.listaVeiculos({ accessToken, userCpf })
    const vehicles = (result?.result ?? []).map(toVehicleItemFromLista)
    res.status(200).json({ vehicles })
  })

  // Must be registered before /:renavam routes to avoid Express matching 'representacao' as a renavam param
  router.post('/veiculos/representacao', async (req, res) => {
    const accessToken = getBearerToken(req.headers.authorization)
    const userCpf = asNonEmptyString(req.headers['x-cpf-usuario'])
    const renavam = asNonEmptyString(req.body?.renavam)
    const placa = asNonEmptyString(req.body?.placa)

    if (!accessToken || !userCpf || !renavam || !placa) {
      res.status(400).json({ message: 'Missing required fields: Authorization, X-CPF-Usuario headers and renavam, placa in body.' })
      return
    }

    const client = req.scope.resolve('detranSpServiceNowLicenciamentoClient')
    const auth = { accessToken, userCpf, renavam, placa }

    try {
      const result = await client.verificaVeiculo(auth, renavam)
      const data = result?.result
      if (!data) {
        res.status(200).json({ vehicle: null, showSnackbar: { title: 'Veículo não encontrado', variant: 'error' } })
        return
      }

      const debitosResult = await client.listaDebitosVeiculo(auth, renavam)
      const debts: DebitoData[] = debitosResult?.result ?? []
      const totalDebits = debts.reduce((sum, d) => sum + d.valor, 0)
      const multaDebts = debts.filter((d): d is DebitoMultaData => d.tipoServico === 7 && 'autoInfracao' in d)
      const multasEntries = await Promise.all(
        multaDebts.map(async (d) => {
          const r = await client.listaMultas(auth, renavam, d.autoInfracao)
          return [d.autoInfracao, r?.result ?? []] as [string, ListaMultasData[]]
        })
      )

      res.status(200).json({
        vehicle: toVehicleItemFromVerifica(data),
        result: debts,
        totalDebits,
        multasDetail: Object.fromEntries(multasEntries)
      })
    } catch {
      res.status(200).json({ vehicle: null, showSnackbar: { title: 'Veículo não encontrado', variant: 'error' } })
    }
  })

  router.post('/veiculos/:renavam/verificar', async (req, res) => {
    const accessToken = getBearerToken(req.headers.authorization)
    const userCpf = asNonEmptyString(req.headers['x-cpf-usuario'])
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.body?.placa)

    if (!accessToken || !userCpf || !renavam || !placa) {
      res.status(400).json({ message: 'Missing required fields: Authorization, X-CPF-Usuario headers and placa in body.' })
      return
    }

    const client = req.scope.resolve('detranSpServiceNowLicenciamentoClient')
    const auth = { accessToken, userCpf, renavam, placa }

    const [verifySettled, veiculosSettled] = await Promise.allSettled([
      client.verificaVeiculo(auth, renavam),
      client.listaVeiculos({ accessToken, userCpf })
    ])

    const vehicleFromList = veiculosSettled.status === 'fulfilled'
      ? (veiculosSettled.value?.result ?? []).find((v: ListaVeiculosVeiculoData) => v.codigoRenavamVeiculo === renavam)
      : undefined
    const vehicle = vehicleFromList ? toVehicleItemFromLista(vehicleFromList) : undefined

    let hasMultaForaDoSistema = false
    let vigency: VehicleStatus = 'VENCIDO'

    if (verifySettled.status === 'rejected') {
      const err = verifySettled.reason
      if (!(err instanceof DetranSpServiceNowLicenciamentoError)) throw err

      const isLicensingOverdue = vehicle?.status === 'VENCIDO'

      if (err.type === 'VeiculoComPendenciaError') {
        res.status(200).json({ vehicle, vigency: 'VENCIDO', isBlocked: true, isGnvBlocked: false, hasMultaForaDoSistema: false, onlyLicensing: false, hasPayableDebts: false, isLicensingOverdue, result: [], totalDebits: 0, multasDetail: {} })
        return
      }
      if (err.type === 'VeiculoSemCertificadoGNVVigenteError') {
        const debitosResult = await client.listaDebitosVeiculo(auth, renavam)
        const debts: DebitoData[] = debitosResult?.result ?? []
        const totalDebits = debts.reduce((sum, d) => sum + d.valor, 0)
        const hasPayableDebts = debts.some(d => d.tipoServico === 6 || d.tipoServico === 7)
        const multaDebts = debts.filter((d): d is DebitoMultaData => d.tipoServico === 7 && 'autoInfracao' in d)
        const multasEntries = await Promise.all(
          multaDebts.map(async (d) => {
            const r = await client.listaMultas(auth, renavam, d.autoInfracao)
            return [d.autoInfracao, r?.result ?? []] as [string, ListaMultasData[]]
          })
        )
        res.status(200).json({ vehicle, vigency: 'VENCIDO', isBlocked: false, isGnvBlocked: true, hasMultaForaDoSistema: false, onlyLicensing: false, hasPayableDebts, isLicensingOverdue, result: debts, totalDebits, multasDetail: Object.fromEntries(multasEntries) })
        return
      }
      if (err.type === 'VeiculoComMultaForaDoSistemaError') {
        hasMultaForaDoSistema = true
      } else {
        throw err
      }
    } else {
      vigency = mapStatus(verifySettled.value?.result?.situacaoLicenciamento)
    }

    const debitosResult = await client.listaDebitosVeiculo(auth, renavam)
    const debts: DebitoData[] = debitosResult?.result ?? []
    const totalDebits = debts.reduce((sum, d) => sum + d.valor, 0)

    const onlyLicensing = debts.length > 0 && debts.every(d => d.tipoServico === 5)
    const hasPayableDebts = debts.some(d => d.tipoServico === 6 || d.tipoServico === 7)
    const isLicensingOverdue = hasMultaForaDoSistema ? vehicle?.status === 'VENCIDO' : vigency !== 'REGULAR'

    const multaDebts = debts.filter((d): d is DebitoMultaData => d.tipoServico === 7 && 'autoInfracao' in d)
    const multasEntries = await Promise.all(
      multaDebts.map(async (d) => {
        const result = await client.listaMultas(auth, renavam, d.autoInfracao)
        return [d.autoInfracao, result?.result ?? []] as [string, ListaMultasData[]]
      })
    )

    res.status(200).json({
      vehicle,
      vigency,
      isBlocked: false,
      isGnvBlocked: false,
      hasMultaForaDoSistema,
      onlyLicensing,
      hasPayableDebts,
      isLicensingOverdue,
      result: debts,
      totalDebits,
      multasDetail: Object.fromEntries(multasEntries)
    })
  })

  router.post('/veiculos/:renavam/qr-code', async (req, res) => {
    const accessToken = getBearerToken(req.headers.authorization)
    const userCpf = asNonEmptyString(req.headers['x-cpf-usuario'])
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.body?.placa)

    if (!accessToken || !userCpf || !renavam || !placa) {
      res.status(400).json({ message: 'Missing required fields: Authorization, X-CPF-Usuario headers and placa in body.' })
      return
    }

    const client = req.scope.resolve('detranSpServiceNowLicenciamentoClient')
    const result = await client.criaQRCode({ accessToken, userCpf, renavam, placa }, renavam)
    const data = result?.result
    res.status(200).json({
      pixCode: data?.qrCode ?? null,
      expiresAt: data?.dataExpiracaoQRCode ?? null
    })
  })

  router.get('/veiculos/:renavam/qr-code', async (req, res) => {
    const accessToken = getBearerToken(req.headers.authorization)
    const userCpf = asNonEmptyString(req.headers['x-cpf-usuario'])
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.query.placa)

    if (!accessToken || !userCpf || !renavam || !placa) {
      res.status(400).json({ message: 'Missing required fields: Authorization, X-CPF-Usuario headers and placa query param.' })
      return
    }

    const client = req.scope.resolve('detranSpServiceNowLicenciamentoClient')
    const result = await client.verificaQRCode({ accessToken, userCpf, renavam, placa }, renavam)
    const data = result?.result
    res.status(200).json({
      estado: data?.estadoQRCode ?? null,
      comprovante: data?.idPagamentoQRCode ?? null,
      confirmedDate: data?.dataPagamentoQRCode ? formatDateTimeBr(data.dataPagamentoQRCode) : null
    })
  })

  router.get('/veiculos/:renavam/crlv-e', async (req, res) => {
    const accessToken = getBearerToken(req.headers.authorization)
    const userCpf = asNonEmptyString(req.headers['x-cpf-usuario'])
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.query.placa)

    if (!accessToken || !userCpf || !renavam || !placa) {
      res.status(400).json({ message: 'Missing required fields: Authorization, X-CPF-Usuario headers and placa query param.' })
      return
    }

    const client = req.scope.resolve('detranSpServiceNowLicenciamentoClient')
    const result = await client.buscaCrlve({ accessToken, userCpf, renavam, placa }, renavam)
    res.status(200).json({ base64: result?.result?.base64 ?? null })
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
