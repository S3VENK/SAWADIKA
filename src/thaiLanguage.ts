export type InvestigationIntent = {
  passes: boolean
  hasSeeConcept: boolean
  hasWhatConcept: boolean
}

export type PoliteParticle = 'ครับ' | 'ค่ะ' | 'คะ' | null

const normalizeThai = (text: string) => text.normalize('NFC').replace(/[\s?.!,ๆฯ]+/g, '')

/**
 * Prototype semantic evaluator.
 * TODO: Replace keyword matching with a production AI semantic evaluation service.
 */
export function evaluateInvestigationIntent(text: string): InvestigationIntent {
  const normalized = normalizeThai(text)
  const hasSeeConcept = normalized.includes('เห็น')
  const hasWhatConcept = normalized.includes('อะไร')
  return { passes: hasSeeConcept && hasWhatConcept, hasSeeConcept, hasWhatConcept }
}

export function detectPoliteParticle(text: string): PoliteParticle {
  const normalized = normalizeThai(text)
  if (normalized.includes('ครับ')) return 'ครับ'
  if (normalized.includes('ค่ะ')) return 'ค่ะ'
  if (normalized.includes('คะ')) return 'คะ'
  return null
}
