// ServiceNow sometimes sends datetimes as "YYYY-MM-DD HH:MM:SS" with no
// timezone marker but the value is actually UTC (confirmed against pgto's
// dataExpiracaoQRCode, 2026-08-03: the paired registro.expiracao BRT field is
// consistently exactly 3h earlier). A naive string like this gets parsed as
// LOCAL time by JS engines, silently adding Brazil's UTC-3 offset — turning a
// real 15-minute PIX expiration into ~3h15m on the client. Regex only matches
// the naive shape, so this is a no-op if the source ever starts sending a
// real marker.
export function normalizeUtcDateTime(value: string): string {
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(' ', 'T')}Z` : value
}
