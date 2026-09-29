import type { ListaVeiculosVeiculoData, VerificaVeiculoData } from '../../clients/detran-sp-service-now-licenciamento/types'
import { normalizeSituacaoLicenciamento } from '../../clients/detran-sp-service-now-licenciamento/types'
import type { SituacaoLicenciamento } from '../../clients/detran-sp-service-now-licenciamento/types'
import type { VehicleItem, VehicleStatus } from './types'

export function mapStatus(situacao: SituacaoLicenciamento | undefined): VehicleStatus {
  if (!situacao) return 'VENCIDO'
  const normalized = normalizeSituacaoLicenciamento(situacao)
  if (normalized === 'Em dia') return 'REGULAR'
  if (normalized === 'À vencer') return 'A VENCER'
  return 'VENCIDO'
}

export function formatDateBr(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

export function formatDateTimeBr(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  })
}

export function toVehicleItemFromLista(vehicle: ListaVeiculosVeiculoData): VehicleItem {
  return {
    id: vehicle.codigoRenavamVeiculo,
    renavam: vehicle.codigoRenavamVeiculo,
    title: vehicle.marcaVeiculo,
    brandModel: vehicle.marcaVeiculo,
    plate: vehicle.placaVeiculo,
    lastIssuance: vehicle.dataUltimoExercicio,
    licensingStatus: mapStatus(vehicle.situacaoLicenciamento),
    licensingExpirationDate: formatDateBr(vehicle.dataVencimentoLicenciamento),
    lastLicensing: formatDateBr(vehicle.dataLicenciamentoVeiculo),
  }
}

export function toVehicleItemFromVerifica(vehicle: VerificaVeiculoData): VehicleItem {
  return {
    id: vehicle.codigoRenavamVeiculo,
    renavam: vehicle.codigoRenavamVeiculo,
    title: vehicle.marcaVeiculo,
    brandModel: vehicle.marcaVeiculo,
    plate: vehicle.placaVeiculo,
    lastIssuance: vehicle.dataUltimoExercicio,
    licensingStatus: mapStatus(vehicle.situacaoLicenciamento),
    licensingExpirationDate: formatDateBr(vehicle.dataVencimentoLicenciamento),
  }
}
