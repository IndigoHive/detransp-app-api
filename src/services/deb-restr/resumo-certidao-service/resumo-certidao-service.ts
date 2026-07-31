import type { DetranSpServiceNowDebRestrClient, VeiculoMeta } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DebRestrVeiculoAuth, ResumoCertidaoResult } from '../types'
import { formatCurrencyBr, formatDateBr } from '../utils'

const NO_RESTRICTION_RE = /nada consta|não consta/i

function deriveDebtsStatus (meta: VeiculoMeta | undefined): string | null {
  const parcels = [
    meta?.valorDebitosIPVA,
    meta?.valorDebitosMILT,
    meta?.valorDebitosRenainf,
    meta?.valorDebitosLicenciamento,
  ].filter((v): v is number => v != null)
  const total = meta?.valorDebitos ?? (parcels.length > 0 ? parcels.reduce((sum, v) => sum + v, 0) : null)
  if (total == null) return null
  return total > 0 ? 'COM DÉBITOS' : 'SEM DÉBITOS'
}

function deriveRestrictionStatus (meta: VeiculoMeta | undefined): string | null {
  const signals = [
    meta?.bloqueioFurtoRoubo,
    meta?.restricaoTributaria,
    meta?.restricaoAdministrativa,
    meta?.restricaoJudicial,
    meta?.restricaoVeiculoGuinchado,
    meta?.multas,
  ].filter((s): s is string => typeof s === 'string' && s.trim() !== '')
  if (signals.length === 0) return null
  return signals.some((s) => !NO_RESTRICTION_RE.test(s)) ? 'COM RESTRIÇÕES' : 'SEM RESTRIÇÕES'
}

export class ResumoCertidaoService {
  private readonly client: DetranSpServiceNowDebRestrClient

  constructor (client: DetranSpServiceNowDebRestrClient) {
    this.client = client
  }

  async run (auth: DebRestrVeiculoAuth): Promise<ResumoCertidaoResult> {
    const [veiculoSettled, taxaSettled] = await Promise.allSettled([
      this.client.buscaVeiculo(auth, auth.renavam),
      this.client.buscaTaxaCertidao(auth, auth.renavam)
    ])

    if (veiculoSettled.status === 'rejected' && taxaSettled.status === 'rejected') {
      throw veiculoSettled.reason
    }

    const veiculo = veiculoSettled.status === 'fulfilled' ? veiculoSettled.value : null
    const taxa = taxaSettled.status === 'fulfilled' ? taxaSettled.value : null

    const attributes = veiculo?.data?.attributes
    const meta = veiculo?.data?.meta ?? veiculo?.meta
    const taxaAttrs = taxa?.data?.attributes
    const marcaModelo = attributes?.marcaModelo?.descricao ?? null

    return {
      vehicle: {
        id: attributes?.renavam ?? null,
        plate: attributes?.placa ?? null,
        title: marcaModelo,
        brandModel: marcaModelo,
        renavam: attributes?.renavam ?? null,
        yearFab: attributes?.anoFabricacao?.toString() ?? null,
        yearMod: attributes?.anoModelo?.toString() ?? null,
        type: attributes?.tipo?.descricao ?? null,
        // deb-restr has no licensing situation field; pending licensing debt is
        // the only signal available in this scope
        licensingStatus: meta?.valorDebitosLicenciamento != null
          ? (meta.valorDebitosLicenciamento > 0 ? 'VENCIDO' : 'REGULAR')
          : null,
        debtsStatus: deriveDebtsStatus(meta),
        restrictionStatus: deriveRestrictionStatus(meta),
        lastLicensing: attributes?.dataEmissaoLicenciamento
          ? formatDateBr(attributes.dataEmissaoLicenciamento)
          : attributes?.anoExercicioLicenciamento?.toString() ?? null,
        lastIssuance: await this.buscaDataEmissaoCertidao(auth),
      },
      taxa: {
        valor: taxaAttrs?.valor ?? null,
        valorLabel: taxaAttrs?.valor != null ? formatCurrencyBr(taxaAttrs.valor) : null,
        descricao: taxaAttrs?.descricao ?? null,
        vencimento: taxaAttrs?.vencimento ? formatDateBr(taxaAttrs.vencimento) : null,
      },
    }
  }

  private async buscaDataEmissaoCertidao (auth: DebRestrVeiculoAuth): Promise<string | null> {
    try {
      const certidao = await this.client.buscaCertidao(auth, auth.renavam)
      const dataHoraEmissao = certidao?.data?.attributes?.dataHoraEmissao
      return dataHoraEmissao ? formatDateBr(dataHoraEmissao.slice(0, 10)) : null
    } catch {
      // lastIssuance is display-only enrichment — never break the resumo over it
      return null
    }
  }
}
