import type { AttestationAgent } from '../clients/detran-sp-service-now-attestation'

// O device informa a plataforma via o header X-Platform, setado uma única
// vez pelo AppApiClient (client/app-api.ts no app) em toda requisição — não
// depende de nenhuma configuração feita no editor de flows. Qualquer valor
// que não seja exatamente "ios" cai em "android".
export function parseAttestationAgent (value: unknown): AttestationAgent {
  return value === 'ios' ? 'ios' : 'android'
}
