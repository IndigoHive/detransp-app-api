// Rich-text-migrated flow fields (radio_card_buttons/radio_buttons/dropdown labels)
// are stored as sanitized HTML, but several endpoints compare a bound label against
// literal Portuguese business terms baked into the contract (e.g. "Meus Veículos").
// Strips at the comparison point, not the source, so the raw value stays available
// to callers that don't need it stripped. No DOM available in Node — regex strip +
// decode of the entity set the editor's sanitizer actually emits.
export function stripHtml (value: string): string {
  if (!/<[^>]+>/.test(value)) return value
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}
