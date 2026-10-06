import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import { gameReducer, initialGameState, type GameEvent, type GameState } from './gameMachine'

type GameContextValue = {
  state: GameState
  dispatch: Dispatch<GameEvent>
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState)
  const value = useMemo(() => ({ state, dispatch }), [state])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame must be used inside GameProvider')
  return context
}
