import React, { createContext, useContext, ReactNode } from 'react';
import { useGame } from './hooks/useGame';

type GameContextType = ReturnType<typeof useGame>;
const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const game = useGame();
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGameContext must be used within GameProvider');
  return context;
}
