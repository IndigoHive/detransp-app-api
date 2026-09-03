import { describe, expect, test } from 'vitest'
import { normalizeRoute } from './normalize-route'

const LICENCIAMENTO_BASE = 'https://detran.example.com/api/x_mdpdd_lic_veic/v1/licenciamento/veiculos'
const TDV_BASE = 'https://detran.example.com/api/x_mdpdd_be_tdv/v1/tdv'

describe('normalizeRoute', () => {
  describe('when the request targets the baseURL itself', () => {
    test('uses the baseURL path', () => {
      expect(normalizeRoute('get', '', LICENCIAMENTO_BASE)).toBe('GET /api/x_mdpdd_lic_veic/v1/licenciamento/veiculos')
    })
  })

  describe('when the url is a relative path', () => {
    test('concatenates onto the baseURL path', () => {
      expect(normalizeRoute('get', '/12345678901/debitos', LICENCIAMENTO_BASE)).toBe(
        'GET /api/x_mdpdd_lic_veic/v1/licenciamento/veiculos/:id/debitos'
      )
    })
  })

  describe('when a segment is an identifier', () => {
    test('replaces a renavam', () => {
      expect(normalizeRoute('post', '/12345678901/qr-code', LICENCIAMENTO_BASE)).toBe(
        'POST /api/x_mdpdd_lic_veic/v1/licenciamento/veiculos/:id/qr-code'
      )
    })

    test('replaces a ServiceNow sys_id', () => {
      expect(normalizeRoute('patch', '/transferencias-de-veiculos/9c1f4a2b7d3e8f5a6b0c1d2e3f4a5b6c', TDV_BASE)).toBe(
        'PATCH /api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veiculos/:id'
      )
    })

    test('replaces a uuid', () => {
      expect(normalizeRoute('get', '/cidadaos/6f3a1c8e-4b2d-4f7a-9c1e-2d5b8a0f3c7e', TDV_BASE)).toBe(
        'GET /api/x_mdpdd_be_tdv/v1/tdv/cidadaos/:id'
      )
    })

    test('replaces a cpf', () => {
      expect(normalizeRoute('get', '/cidadaos/52998224725', TDV_BASE)).toBe(
        'GET /api/x_mdpdd_be_tdv/v1/tdv/cidadaos/:id'
      )
    })
  })

  describe('when a static segment resembles an identifier', () => {
    test('keeps a short versioned segment such as v1', () => {
      expect(normalizeRoute('post', '/transferencias-de-veiculos', TDV_BASE)).toBe(
        'POST /api/x_mdpdd_be_tdv/v1/tdv/transferencias-de-veiculos'
      )
    })

    test('keeps a long hyphenated segment with no digits', () => {
      expect(normalizeRoute('post', '/cidadaos/52998224725/autodeclaracao-de-residencia', TDV_BASE)).toBe(
        'POST /api/x_mdpdd_be_tdv/v1/tdv/cidadaos/:id/autodeclaracao-de-residencia'
      )
    })
  })

  describe('query strings', () => {
    test('are stripped before normalizing', () => {
      expect(normalizeRoute('get', '/cidadaos/52998224725?ativa=true', TDV_BASE)).toBe(
        'GET /api/x_mdpdd_be_tdv/v1/tdv/cidadaos/:id'
      )
    })
  })
})
