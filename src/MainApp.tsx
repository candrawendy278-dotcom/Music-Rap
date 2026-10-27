import { useGameContext } from './GameContext';
import TopHeader from './components/TopHeader';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Tabs/Dashboard';
import Studio from './components/Tabs/Studio';
import AppsTab from './components/Tabs/AppsTab';
import SettingsTab from './components/Tabs/SettingsTab';
import SpotifyApp from './components/Apps/SpotifyApp';
import YouTubeApp from './components/Apps/YouTubeApp';
import BillboardApp from './components/Apps/BillboardApp';
import ITunesApp from './components/Apps/ITunesApp';
import StatisticApp from './components/Apps/StatisticApp';
import SkillAcademyApp from './components/Apps/SkillAcademyApp';
import XApp from './components/Apps/XApp';
import JobsApp from './components/Apps/JobsApp';
import GrammyAwardsApp from './components/Apps/GrammyAwardsApp';
import MtvVmasApp from './components/Apps/MtvVmasApp';
import PitchforkApp from './components/Apps/PitchforkApp';
import MetacriticApp from './components/Apps/MetacriticApp';
import RadioAirplayChartApp from './components/Apps/RadioAirplayChartApp';
import AwardCeremonyLiveModal from './components/Modals/AwardCeremonyLiveModal';

export default function MainApp() {
  const { state, setState } = useGameContext();
  const pendingCeremony = (state as any).awardsState?.pendingLiveCeremony || null;
  const pendingNominations = (state as any).awardsState?.pendingNominationsAnnouncement || null;
  const activeModalSeason = pendingCeremony || pendingNominations;

  const handleCloseAwardModal = () => {
    setState(prev => ({
      ...prev,
      awardsState: {
        ...(prev as any).awardsState,
        pendingLiveCeremony: null,
        pendingNominationsAnnouncement: null
      }
    } as any));
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-apple-bg flex flex-col relative pb-24 overflow-y-auto overflow-x-hidden">
      <TopHeader />
      <main className="flex-1 px-4 py-4 w-full">
        {state.activeTab === 'dashboard' && <Dashboard />}
        {state.activeTab === 'studio' && <Studio />}
        {state.activeTab === 'apps' && <AppsTab />}
        {state.activeTab === 'settings' && <SettingsTab />}
      </main>
      <BottomNav />
      
      {state.activeApp === 'spotify' && <SpotifyApp />}
      {state.activeApp === 'youtube' && <YouTubeApp />}
      {state.activeApp === 'billboard' && <BillboardApp />}
      {state.activeApp === 'radio' && <RadioAirplayChartApp />}
      {state.activeApp === 'itunes' && <ITunesApp />}
      {state.activeApp === 'statistic' && <StatisticApp />}
      {state.activeApp === 'skills' && <SkillAcademyApp />}
      {state.activeApp === 'x' && <XApp />}
      {state.activeApp === 'jobs' && <JobsApp />}
      {state.activeApp === 'grammys' && <GrammyAwardsApp />}
      {state.activeApp === 'vmas' && <MtvVmasApp />}
      {state.activeApp === 'pitchfork' && <PitchforkApp />}
      {state.activeApp === 'metacritic' && <MetacriticApp />}

      {activeModalSeason && (
        <AwardCeremonyLiveModal
          season={activeModalSeason}
          onClose={handleCloseAwardModal}
        />
      )}
    </div>
  );
}
