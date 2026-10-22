/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { GameProvider, useGameContext } from './GameContext';
import StartScreen from './StartScreen';
import MainMenu from './components/MainMenu';
import MainApp from './MainApp';
import InfoModal from './components/Modals/InfoModal';
import CinematicNextDayOverlay from './components/Modals/CinematicNextDayOverlay';
import { prewarmRealWorldArtworkCache } from './data/realWorldArtistCatalog';
import { syncNpcRealisticReleaseWorkflow } from './data/npcRealisticReleaseWorkflowEngine';

function AppContent() {
  const { state, nextDayLoading } = useGameContext();

  useEffect(() => {
    syncNpcRealisticReleaseWorkflow(state.date);
    prewarmRealWorldArtworkCache();
  }, []);

  useEffect(() => {
    syncNpcRealisticReleaseWorkflow(state.date);
  }, [state.date]);

  return (
    <>
      {state.isStarted ? <MainApp /> : <MainMenu />}
      <InfoModal />
      <CinematicNextDayOverlay 
        isLoading={nextDayLoading.isLoading}
        stepMessage={nextDayLoading.stepMessage}
        progressPercent={nextDayLoading.progressPercent}
        currentDate={nextDayLoading.currentDate}
        nextDate={nextDayLoading.nextDate}
      />
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
