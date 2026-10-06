export type GameScene =
  | 'start'
  | 'training-1'
  | 'training-2'
  | 'training-3'
  | 'case-intro'
  | 'witness'
  | 'clue'
  | 'voice-gate'
  | 'creature-reveal'
  | 'case-solved'
  | 'solana-claim'

export type SpeechStyle = 'ครับ' | 'คะ' | 'simple'

export type SolanaClaimStatus =
  | 'idle'
  | 'connecting'
  | 'awaiting-approval'
  | 'submitting'
  | 'succeeded'
  | 'failed'
  | 'unavailable'

export type GameState = {
  currentScene: GameScene
  selectedSpeechStyle: SpeechStyle
  phraseUnlocked: boolean
  witnessIntentPassed: boolean
  witnessTranscript: string
  clueUnlocked: boolean
  gateAttempts: number
  gateUnlocked: boolean
  caseSolved: boolean
  speakingScore: number
  toneScore: number
  solanaClaimStatus: SolanaClaimStatus
}

export type GameEvent =
  | { type: 'START' }
  | { type: 'COMPLETE_TRAINING_1' }
  | { type: 'COMPLETE_TRAINING_2' }
  | { type: 'SELECT_SPEECH_STYLE'; style: SpeechStyle }
  | { type: 'PHRASE_EVALUATED'; passed: boolean }
  | { type: 'BEGIN_CASE' }
  | { type: 'BEGIN_INVESTIGATION' }
  | { type: 'WITNESS_EVALUATED'; transcript: string; passed: boolean }
  | { type: 'OPEN_CLUE' }
  | { type: 'FOLLOW_TRACKS' }
  | { type: 'GATE_ATTEMPT' }
  | { type: 'REVEAL_CREATURE' }
  | { type: 'SOLVE_CASE'; speakingScore: number; toneScore: number }
  | { type: 'OPEN_SOLANA_CLAIM' }
  | { type: 'SET_SOLANA_CLAIM_STATUS'; status: SolanaClaimStatus }
  | { type: 'RESET_GAME' }
  | { type: 'DEV_JUMP'; scene: GameScene }

export const initialGameState: GameState = {
  currentScene: 'start',
  selectedSpeechStyle: 'simple',
  phraseUnlocked: false,
  witnessIntentPassed: false,
  witnessTranscript: '',
  clueUnlocked: false,
  gateAttempts: 0,
  gateUnlocked: false,
  caseSolved: false,
  speakingScore: 0,
  toneScore: 0,
  solanaClaimStatus: 'idle',
}

export function gameReducer(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'START':
      return state.currentScene === 'start' ? { ...state, currentScene: 'training-1' } : state
    case 'COMPLETE_TRAINING_1':
      return state.currentScene === 'training-1' ? { ...state, currentScene: 'training-2' } : state
    case 'COMPLETE_TRAINING_2':
      return state.currentScene === 'training-2' ? { ...state, currentScene: 'training-3' } : state
    case 'SELECT_SPEECH_STYLE':
      return state.currentScene === 'training-3' ? { ...state, selectedSpeechStyle: event.style } : state
    case 'PHRASE_EVALUATED':
      return state.currentScene === 'training-3' && event.passed ? { ...state, phraseUnlocked: true } : state
    case 'BEGIN_CASE':
      return state.currentScene === 'training-3' && state.phraseUnlocked
        ? { ...state, currentScene: 'case-intro' }
        : state
    case 'BEGIN_INVESTIGATION':
      return state.currentScene === 'case-intro' ? { ...state, currentScene: 'witness' } : state
    case 'WITNESS_EVALUATED':
      if (state.currentScene !== 'witness') return state
      return {
        ...state,
        witnessTranscript: event.transcript,
        witnessIntentPassed: event.passed,
        clueUnlocked: event.passed,
      }
    case 'OPEN_CLUE':
      return state.currentScene === 'witness' && state.witnessIntentPassed && state.clueUnlocked
        ? { ...state, currentScene: 'clue' }
        : state
    case 'FOLLOW_TRACKS':
      return state.currentScene === 'clue' && state.clueUnlocked
        ? { ...state, currentScene: 'voice-gate' }
        : state
    case 'GATE_ATTEMPT':
      if (state.currentScene !== 'voice-gate' || state.gateUnlocked) return state
      return {
        ...state,
        gateAttempts: Math.min(state.gateAttempts + 1, 2),
        gateUnlocked: state.gateAttempts >= 1,
      }
    case 'REVEAL_CREATURE':
      return state.currentScene === 'voice-gate' && state.gateUnlocked
        ? { ...state, currentScene: 'creature-reveal' }
        : state
    case 'SOLVE_CASE':
      return state.currentScene === 'creature-reveal'
        ? {
            ...state,
            currentScene: 'case-solved',
            caseSolved: true,
            speakingScore: event.speakingScore,
            toneScore: event.toneScore,
          }
        : state
    case 'OPEN_SOLANA_CLAIM':
      return state.currentScene === 'case-solved' && state.caseSolved
        ? { ...state, currentScene: 'solana-claim', solanaClaimStatus: 'unavailable' }
        : state
    case 'SET_SOLANA_CLAIM_STATUS':
      return state.currentScene === 'solana-claim' ? { ...state, solanaClaimStatus: event.status } : state
    case 'RESET_GAME':
      return initialGameState
    case 'DEV_JUMP':
      return import.meta.env.DEV ? { ...state, currentScene: event.scene } : state
    default:
      return state
  }
}
