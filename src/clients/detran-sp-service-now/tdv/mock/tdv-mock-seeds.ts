import { randomUUID } from 'node:crypto'
import type { Config, TdvMockVersao } from '../../../../types'
import { formatCpf, formatCpfCnpj } from '../../../../utils/format-document'
import { CodigoEstadoTDV, CodigoOrigemComunicacaoVendaVeiculo, CodigoOrigemTDV } from '../types'
import type {
  BuscaTdvResultData,
  ListaTdvsResultData,
  ListaVeiculosProprietarioResultData
} from '../types'

// The real GET /{codigo} and the list endpoint return the same full object; our production
// types each declare only the subset their callers read. The mock stores the union so a seeded
// record can carry every field the real API would send.
export type MockTdvRecord = BuscaTdvResultData & ListaTdvsResultData

type TdvMockConfig = Config['tdvMock']

// Values copied from the real response examples in docs/tdv/swagger.yaml so the mock mass looks
// like production data: municipality is the DETRAN code (not IBGE), CPFs are 11 digits with no
// padding, CNPJs 14, money and mileage are plain integer strings, and every `codigo*Anexo*` /
// `codigoTransferenciaVeiculo` is a 32-char ServiceNow sys_id.
const MUNICIPIO_NOME = 'SAO PAULO'
const MUNICIPIO_CODIGO = '7107'
const MUNICIPIO_IBGE = 3550308

export const MOCK_MUNICIPIO = { nome: MUNICIPIO_NOME, codigo: MUNICIPIO_CODIGO, ibge: MUNICIPIO_IBGE }

export function sysId (): string {
  return randomUUID().replace(/-/g, '')
}

let numeroTdvSequence = 1470832
export function numeroTransferencia (): string {
  return `TDV${++numeroTdvSequence}`
}

// The dealership that stands on the other side of the Renave journeys (TDV 3.0 sells to the
// citizen, TDV 4.0 buys from them). A real CNPJ shape — 14 digits — so the CPF/CNPJ formatting
// and the "Confirmação dados loja" screen are exercised for real.
export const LOJA = {
  codigo: '16794464003768',
  nome: 'CAOA MOTOR DO BRASIL LTDA',
  email: 'contato@caoamotor.com.br',
  logradouro: 'Avenida Conselheiro Nebias',
  numero: '240',
  bairro: 'Encruzilhada',
  cep: '11045001',
  municipio: 'SANTOS',
  codigoMunicipio: '7099'
}

// Third-party seller for the journeys where the sale was registered outside the app and the
// citizen only shows up as the buyer (TDV 2.0 and 6.0).
export const VENDEDOR_EXTERNO = {
  codigo: '22231049830',
  nome: 'ZECA DO DETRAN',
  email: 'zecadetran@gmail.com'
}

export type MockVehicle = {
  placa: string
  codigoRenavam: string
  chassi: string
  descricaoMarca: string
  descricaoCor: string
  anoFabricacao: string
  anoModelo: string
}

const VEHICLE_CATALOGUE: readonly MockVehicle[] = [
  {
    placa: 'BLK7C34',
    codigoRenavam: '43833099292',
    chassi: '1HNRYNPS36KJP6477',
    descricaoMarca: 'FIAT/FIORINO ALT AMB',
    descricaoCor: 'ROXA',
    anoFabricacao: '2022',
    anoModelo: '2022'
  },
  {
    placa: 'FTG4B21',
    codigoRenavam: '31625088471',
    chassi: '9BWZZZ377VT004251',
    descricaoMarca: 'VW/GOL 1.0',
    descricaoCor: 'PRATA',
    anoFabricacao: '2019',
    anoModelo: '2020'
  }
]

// The vehicle the seller journeys operate on — driven by TDV_MOCK_VEHICLE_PLATE /
// TDV_MOCK_VEHICLE_RENAVAM so the existing env knobs keep working.
export function primaryVehicle (cfg: TdvMockConfig): MockVehicle {
  const base = VEHICLE_CATALOGUE[0]!
  return {
    ...base,
    ...(cfg.vehiclePlate ? { placa: cfg.vehiclePlate } : {}),
    ...(cfg.vehicleRenavam ? { codigoRenavam: cfg.vehicleRenavam } : {})
  }
}

export function secondaryVehicle (): MockVehicle {
  return VEHICLE_CATALOGUE[1]!
}

export function toListaVeiculos (vehicle: MockVehicle, nomeProprietario: string): ListaVeiculosProprietarioResultData {
  return {
    placa: vehicle.placa,
    placaMercosul: 'true',
    nomeProprietario,
    chassi: vehicle.chassi,
    codigoRenavam: vehicle.codigoRenavam,
    codigoMunicipio: MUNICIPIO_CODIGO,
    nomeMunicipio: MUNICIPIO_NOME,
    codigoMarca: '2002750',
    descricaoMarca: vehicle.descricaoMarca,
    anoFabricacao: vehicle.anoFabricacao,
    anoModelo: vehicle.anoModelo,
    anoExercicio: '2025',
    dataEmissao: '2023-10-01',
    uf: 'SP'
  }
}

export type Parte = {
  codigo: string
  nome: string
  email: string
  logradouro?: string
  numero?: string
  bairro?: string
  cep?: string
  municipio?: string
  codigoMunicipio?: string
}

export type SeedSpec = {
  versao: TdvMockVersao
  // 'vendedor' = the logged citizen sells (TDV 1.0 and 4.0); 'comprador' = the sale was
  // registered elsewhere and the citizen only completes the purchase (TDV 2.0, 3.0, 6.0).
  jornada: 'vendedor' | 'comprador'
  origem: CodigoOrigemTDV
  origemComunicacaoVendaVeiculo?: CodigoOrigemComunicacaoVendaVeiculo
  vehicle: MockVehicle
  vendedor: Parte
  comprador: Parte
  // Estado the record starts at when TDV_MOCK_INITIAL_ESTADO is not set. `undefined` means the
  // record is a comunicação de venda with no TDV behind it yet — no estado and no
  // codigoTransferenciaVeiculo — which is where the buyer journeys really begin.
  estadoPadrao?: CodigoEstadoTDV
  // Cartório CVs arrive reporting estado 7 (both parties already signed at the notary) while
  // still having no codigoTransferenciaVeiculo — the exact shape seen in homologação, and what
  // makes the flow call validar-tdv before creating the TDV.
  estadoSemCodigo?: boolean
}

const COMPRADOR_PADRAO: Omit<Parte, 'codigo'> = {
  nome: 'MARIA ANGELICA FONSECA VELOSO MENDES',
  email: 'maria_mendes66@gmail.com',
  logradouro: 'Rua Juvenal Lira',
  numero: '38',
  bairro: 'Jardim Elisa Maria',
  cep: '02873610',
  municipio: MUNICIPIO_NOME,
  codigoMunicipio: MUNICIPIO_CODIGO
}

const VENDEDOR_CIDADAO: Omit<Parte, 'codigo'> = {
  nome: 'ZECA DO DETRAN',
  email: 'zecadetran@gmail.com'
}

// Only the CPF of the side the citizen plays has to match the gov.br token; the counterpart is
// scenery. Falling back keeps the mass from starting empty because the other var was left unset.
const CPF_CONTRAPARTE = '05246487601'

// One entry per version — the records ServiceNow would hand back for that scenario.
export function seedSpecs (cfg: TdvMockConfig): SeedSpec[] {
  const principal = primaryVehicle(cfg)
  const secundario = secondaryVehicle()
  const comprador: Parte = { ...COMPRADOR_PADRAO, codigo: cfg.buyerCpf || CPF_CONTRAPARTE }
  const vendedorCidadao: Parte = { ...VENDEDOR_CIDADAO, codigo: cfg.sellerCpf || CPF_CONTRAPARTE }

  switch (cfg.versao) {
    // Nothing is seeded up front: the seller opens the app and creates the TDV from scratch.
    // A record only appears when TDV_MOCK_INITIAL_ESTADO asks to skip ahead.
    case '1.0':
      return [{
        versao: '1.0',
        jornada: 'vendedor',
        origem: CodigoOrigemTDV.TDV,
        vehicle: principal,
        vendedor: vendedorCidadao,
        comprador
      }]

    // Two comunicações de venda land in the buyer's list: one from the notary system
    // (e-Notariado) and one from the Carteira Digital de Trânsito. Same code path, both listed.
    case '2.0':
      return [
        {
          versao: '2.0',
          jornada: 'comprador',
          origem: CodigoOrigemTDV.E_NOTARIADO,
          origemComunicacaoVendaVeiculo: CodigoOrigemComunicacaoVendaVeiculo.E_NOTARIADO,
          vehicle: principal,
          vendedor: { ...VENDEDOR_EXTERNO },
          comprador
        },
        {
          versao: '2.0',
          jornada: 'comprador',
          origem: CodigoOrigemTDV.CDT,
          origemComunicacaoVendaVeiculo: CodigoOrigemComunicacaoVendaVeiculo.VENDA_DIGITAL,
          vehicle: secundario,
          vendedor: { ...VENDEDOR_EXTERNO },
          comprador
        }
      ]

    // Renave saída: the dealership sold to the citizen, so the seller side is a CNPJ.
    case '3.0':
      return [{
        versao: '3.0',
        jornada: 'comprador',
        origem: CodigoOrigemTDV.RENAVE,
        vehicle: principal,
        vendedor: {
          codigo: LOJA.codigo,
          nome: LOJA.nome,
          email: LOJA.email
        },
        comprador
      }]

    // Entrada Renave: the dealership already opened the intent through SERPRO, so a TDV exists
    // at estado 1 before the citizen ever opens the app — and the buyer side is the CNPJ.
    case '4.0':
      return [{
        versao: '4.0',
        jornada: 'vendedor',
        origem: CodigoOrigemTDV.ENTRADA_RENAVE,
        vehicle: principal,
        vendedor: vendedorCidadao,
        comprador: {
          codigo: LOJA.codigo,
          nome: LOJA.nome,
          email: LOJA.email,
          logradouro: LOJA.logradouro,
          numero: LOJA.numero,
          bairro: LOJA.bairro,
          cep: LOJA.cep,
          municipio: LOJA.municipio,
          codigoMunicipio: LOJA.codigoMunicipio
        },
        estadoPadrao: CodigoEstadoTDV.VEICULO_SELECIONADO
      }]

    // Cartório integrado à SEFAZ — same shape as 2.0, but origem 6, which is what makes the
    // flow call validar-tdv before anything else.
    case '6.0':
      return [{
        versao: '6.0',
        jornada: 'comprador',
        origem: CodigoOrigemTDV.CARTORIO,
        origemComunicacaoVendaVeiculo: CodigoOrigemComunicacaoVendaVeiculo.CARTORIO,
        vehicle: principal,
        vendedor: { ...VENDEDOR_EXTERNO },
        comprador,
        estadoPadrao: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
        estadoSemCodigo: true
      }]
  }
}

// Builds the TDV record for a spec. `estado` undefined produces a bare comunicação de venda:
// no estado and no codigoTransferenciaVeiculo, exactly what the buyer journeys start from.
export function buildRecord (
  spec: SeedSpec,
  estado: CodigoEstadoTDV | undefined,
  opts: { semCodigo?: boolean } = {}
): MockTdvRecord {
  const { vehicle, vendedor, comprador } = spec
  const assinado = estado !== undefined
    && Number(estado) >= Number(CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA)
    && estado !== CodigoEstadoTDV.TRANSFERENCIA_CANCELADA

  return {
    ...(estado !== undefined
      ? {
          ativa: estado === CodigoEstadoTDV.TRANSFERENCIA_CANCELADA ? '0' : '1',
          estado,
          ...(opts.semCodigo
            ? {}
            : {
                codigoTransferenciaVeiculo: sysId(),
                numeroTransferenciaVeiculo: numeroTransferencia()
              })
        }
      : { ativa: '1' as const }),
    origem: spec.origem,
    ...(spec.origemComunicacaoVendaVeiculo
      ? { origemComunicacaoVendaVeiculo: spec.origemComunicacaoVendaVeiculo }
      : {}),

    placaVeiculo: vehicle.placa,
    placaMercosul: 'true',
    codigoRenavamVeiculo: vehicle.codigoRenavam,
    chassiVeiculo: vehicle.chassi,
    codigoMarcaVeiculo: '2002750',
    descricaoMarcaVeiculo: vehicle.descricaoMarca,
    codigoCorVeiculo: '13',
    descricaoCorVeiculo: vehicle.descricaoCor,
    descricaoCategoriaVeiculo: 'PARTICULAR',
    descricaoTipoVeiculo: 'CAMIONETA',
    anoFabricacaoVeiculo: vehicle.anoFabricacao,
    anoModeloVeiculo: vehicle.anoModelo,
    anoExercicioVeiculo: '2025',
    codigoMunicipioVeiculo: MUNICIPIO_CODIGO,
    nomeMunicipioVeiculo: MUNICIPIO_NOME,
    ufVeiculo: 'SP',
    numeroCrvVeiculo: '246188083377',
    numeroEcrvVeiculo: '1157',
    dataEmissaoCrvVeiculo: '2023-10-01T00:00:00.000Z',

    // Vistoria is in place with a mileage low enough that any plausible km the seller types
    // clears InformarDadosVendaService's guard.
    numeroLaudoVistoria: 'SP676010552-82/2024',
    estadoLaudoVistoria: 'Aprovado',
    kmVistoriadaVeiculo: '32009',

    codigoVendedor: vendedor.codigo,
    nomeVendedor: vendedor.nome,
    emailVendedor: vendedor.email,

    // Origem 5 only: ServiceNow renders the TCR text and the seller screen shows it verbatim.
    ...(spec.origem === CodigoOrigemTDV.ENTRADA_RENAVE
      ? {
          termoCienciaResponsabilidade: [
            `Eu, ${vendedor.nome}, inscrito no CPF sob o nº ${formatCpf(vendedor.codigo)},`,
            ` declaro para os devidos fins que estou transferindo a propriedade do veículo de`,
            ` minha titularidade, de placa ${vehicle.placa}, marca/modelo`,
            ` ${vehicle.descricaoMarca}, ano de fabricação ${vehicle.anoFabricacao},`,
            ` Renavam ${vehicle.codigoRenavam}, para a empresa ${comprador.nome},`,
            ` inscrita no CNPJ sob o nº ${formatCpfCnpj(comprador.codigo)}.`,
            '\n\nEstou ciente de que a veracidade das informações fornecidas é de minha total',
            ' responsabilidade e que a falsidade destas informações poderá acarretar penalidades',
            ' previstas em lei.'
          ].join('')
        }
      : {}),

    codigoComprador: comprador.codigo,
    nomeComprador: comprador.nome,
    emailComprador: comprador.email,
    ...(comprador.logradouro ? { logradouroComprador: comprador.logradouro } : {}),
    ...(comprador.numero ? { numeroComprador: comprador.numero } : {}),
    complementoComprador: '',
    ...(comprador.bairro ? { bairroComprador: comprador.bairro } : {}),
    ...(comprador.cep ? { cepComprador: comprador.cep } : {}),
    ...(comprador.municipio ? { nomeMunicipioComprador: comprador.municipio } : {}),
    ...(comprador.codigoMunicipio ? { codigoMunicipioComprador: comprador.codigoMunicipio } : {}),
    ufComprador: 'SP',
    estadoComprador: 'SAO PAULO',

    valorVendaVeiculo: '87464',
    kmVeiculo: '32675',

    ...(assinado
      ? {
          numeroAtpveVeiculo: '243763996337278',
          codigoAnexoAtpve: sysId(),
          codigoAnexoAssinaturaComprador: sysId(),
          codigoAnexoAssinaturaVendedor: sysId(),
          confirmacaoAutodeclaracaoResidenciaComprador: 'true',
          dataInicialPagamento: new Date().toISOString()
        }
      : {})
  }
}
