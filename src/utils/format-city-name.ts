export function formatCityName (s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
}
