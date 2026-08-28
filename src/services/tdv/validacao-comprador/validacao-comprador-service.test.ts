import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { ValidacaoCompradorService } from './validacao-comprador-service'

const cpf = '43682635882'
const authHeader = `Bearer h.${Buffer.from(JSON.stringify({ preferred_username: cpf })).toString('base64url')}.s`

// O comprador mudou de casa e não atualizou o BCadastro: o endereço cadastral não tem nada a
// ver com o CEP que o vendedor digitou. É o caso que expõe a divergência entre as telas.
const CIDADAO = {
  cpf: '34324084807',
  nome: 'JOSILDO ERICSON BERNARDES CABRAL',
  logradouro: 'DAS PALMEIRAS',
  tipoLogradouro: 'AVENIDA',
  numeroLogradouro: '1500',
  complemento: 'APTO 12',
  bairro: 'JARDIM PAULISTA',
  cep: '01415000',
  uf: 'SP'
}

const ENDERECO_DO_CEP = {
  cep: '01014001',
  bairro: 'CENTRO',
  tipoLogradouro: 'RUA',
  endereco: 'BOA VISTA',
  logradouro: 'RUA BOA VISTA',
  complemento: null,
  localidade: 'SAO PAULO',
  municipio: 'SAO PAULO',
  estado: 'São Paulo',
  uf: 'SP',
  numeroIBGE: 3550308,
  codigoMunicipio: 9668
}

function build (endereco: unknown = ENDERECO_DO_CEP, cidadao: unknown = CIDADAO) {
  return new ValidacaoCompradorService({
    detranSpServiceNowTdv: {
      buscaCidadao: vi.fn().mockResolvedValue(cidadao ? { result: cidadao } : undefined),
      buscaEndereco: vi.fn().mockResolvedValue(endereco ? { result: endereco } : undefined)
    } as unknown as DetranSpServiceNowTdvClient
  })
}

const input = {
  cpfComprador: '34324084807',
  cepComprador: '01014001',
  numeroComprador: '209',
  complementoComprador: 'CASA 2'
}

// Sequência pedida pelo Detran para a tela [Vendedor] Confirmação dados (s_3a0b04432a52):
// rua, número, complemento, bairro, CEP, município, estado.
describe('ValidacaoCompradorService', () => {
  it('monta o endereço só com o que veio do CEP, nunca com o do BCadastro', async () => {
    await expect(build().run(authHeader, input)).resolves.toEqual({
      nomeComprador: CIDADAO.nome,
      cpfComprador: CIDADAO.cpf,
      enderecoComprador: 'RUA BOA VISTA, 209, CASA 2, CENTRO, 01014-001, SAO PAULO, SP'
    })
  })

  it('cai para endereco quando o CEP não devolve logradouro', async () => {
    const service = build({ ...ENDERECO_DO_CEP, logradouro: null })

    await expect(service.run(authHeader, input)).resolves.toMatchObject({
      enderecoComprador: 'BOA VISTA, 209, CASA 2, CENTRO, 01014-001, SAO PAULO, SP'
    })
  })

  it('omite número e complemento quando o flow não os envia', async () => {
    const service = build()

    await expect(service.run(authHeader, {
      cpfComprador: input.cpfComprador,
      cepComprador: input.cepComprador
    })).resolves.toMatchObject({
      enderecoComprador: 'RUA BOA VISTA, CENTRO, 01014-001, SAO PAULO, SP'
    })
  })

  it('sanitiza o complemento igual ao que será gravado na TDV', async () => {
    const service = build()

    await expect(service.run(authHeader, {
      ...input,
      complementoComprador: 'Casa  2 - fundos!'
    })).resolves.toMatchObject({
      enderecoComprador: 'RUA BOA VISTA, 209, Casa 2 fundos, CENTRO, 01014-001, SAO PAULO, SP'
    })
  })

  it('erra quando o CPF não está no BCadastro', async () => {
    await expect(build(ENDERECO_DO_CEP, null).run(authHeader, input)).resolves.toMatchObject({
      showSnackbar: { description: 'CPF do comprador não encontrado' }
    })
  })

  it('erra quando o CEP não é encontrado', async () => {
    await expect(build(null).run(authHeader, input)).resolves.toMatchObject({
      showSnackbar: { description: 'CEP não encontrado' }
    })
  })
})
