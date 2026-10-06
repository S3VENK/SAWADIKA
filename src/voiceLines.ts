export const thaiVoiceLines = {
  narratorOpening: {
    text: 'ยินดีต้อนรับสู่ เจ็ดสิบเจ็ดปริศนาแห่งประเทศไทย',
    audioPath: '/audio/th/narrator-opening.mp3',
  },
  yaiKhamGreeting: {
    text: 'เมื่อคืน...ยายเห็นอะไรบางอย่าง',
    audioPath: '/audio/th/yai-kham-greeting.mp3',
  },
  yaiKhamClue: {
    text: 'มันมีสี่หู...ห้าตา',
    audioPath: '/audio/th/yai-kham-clue.mp3',
  },
  gateWarning: {
    text: 'ประตูนี้จะเปิด เมื่อได้ยินเสียงภาษาไทยที่ถูกต้อง',
    audioPath: '/audio/th/gate-warning.mp3',
  },
  caseSolved: {
    text: 'ไขปริศนาคดีที่หนึ่งแล้ว',
    audioPath: '/audio/th/case-solved.mp3',
  },
} as const

export type ThaiVoiceLineId = keyof typeof thaiVoiceLines
export type ThaiVoiceLine = (typeof thaiVoiceLines)[ThaiVoiceLineId]
