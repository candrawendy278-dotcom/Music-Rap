import { useState } from 'react';
import { useGameContext } from '../../GameContext';
import { Song, Project } from '../../types';
import ItunesHomeView from './ItunesHomeView';
import ItunesChartsView from './ItunesChartsView';
import ItunesArtistProfileView from './ItunesArtistProfileView';
import ItunesTabTransition from './ItunesTabTransition';
import { ItunesReleaseDetailModal } from './ItunesReleaseDetailModal';

export default function ITunesApp() {
  const { state, setState } = useGameContext();
  const [activeTab, setActiveTab] = useState<'home' | 'chart' | 'profile'>('home');
  const [chartRegion, setChartRegion] = useState<string>('global');
  const [chartType, setChartType] = useState<'singles' | 'albums'>('singles');
  const [selectedArtist, setSelectedArtist] = useState<string>(state.artist?.name || 'Player Artist');
  const [selectedRelease, setSelectedRelease] = useState<Song | Project | any | null>(null);

  const handleClose = () => setState(p => ({ ...p, activeApp: 'none' }));

  const handleSelectArtist = (artistName: string) => {
    setSelectedArtist(artistName);
    setSelectedRelease(null);
    setActiveTab('profile');
  };

  return (
    <div className="fixed inset-0 bg-[#0d0d11] text-zinc-100 z-50 overflow-y-auto hide-scrollbar animate-in slide-in-from-bottom-full font-sans selection:bg-[#0a84ff]/30">
      {/* AUTHENTIC ITUNES STORE TOP CHROME */}
      <header className="sticky top-0 z-40 bg-[#16161b]/95 backdrop-blur-2xl border-b border-white/[0.08] shadow-2xl pt-9 pb-2.5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            {/* Left: iTunes Store Brand & Window Controls */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff2d55] via-[#af52de] to-[#0a84ff] p-[1px] shadow-md">
                <div className="w-full h-full bg-[#121217]/40 backdrop-blur-sm rounded-[7px] flex items-center justify-center">
                  <i className="ph-fill ph-music-notes text-white text-base"></i>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-white font-semibold text-base sm:text-lg tracking-tight leading-none">
                    iTunes Store
                  </h1>
                  <span className="text-[10px] font-medium text-zinc-400 tracking-wider uppercase">
                    Music
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 hidden sm:block">
                  Apple Digital Master · Pure Sales & Official Charts
                </p>
              </div>
            </div>

            {/* Right: Apple Segmented Navigation Tabs & Close Button */}
            <div className="flex items-center gap-2.5">
              <nav className="flex bg-[#0a0a0d] p-0.5 rounded-lg border border-white/[0.08]">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-3 sm:px-3.5 py-1 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'home'
                      ? 'bg-[#2c2c34] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Featured
                </button>

                <button
                  onClick={() => setActiveTab('chart')}
                  className={`px-3 sm:px-3.5 py-1 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'chart'
                      ? 'bg-[#2c2c34] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Top Charts
                </button>

                <button
                  onClick={() => {
                    setSelectedArtist(state.artist?.name || 'Player Artist');
                    setActiveTab('profile');
                  }}
                  className={`px-3 sm:px-3.5 py-1 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-[#2c2c34] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Artist Page
                </button>
              </nav>

              <button
                onClick={handleClose}
                aria-label="Close iTunes Store"
                className="text-zinc-400 hover:text-white transition cursor-pointer bg-white/[0.06] hover:bg-white/[0.12] w-7 h-7 rounded-full flex items-center justify-center border border-white/[0.08]"
              >
                <i className="ph ph-x text-xs"></i>
              </button>
            </div>
          </div>

          {/* Authentic iTunes Sub-Header Storefront Bar */}
          <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.05] text-[11px] text-zinc-400">
            <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setActiveTab('home')}
                className={`hover:text-white transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'home' ? 'text-white font-semibold' : ''
                }`}
              >
                Music Storefront
              </button>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <button
                onClick={() => {
                  setChartType('singles');
                  setActiveTab('chart');
                }}
                className={`hover:text-white transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'chart' && chartType === 'singles' ? 'text-[#0a84ff] font-semibold' : ''
                }`}
              >
                Top Songs ($1.29)
              </button>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <button
                onClick={() => {
                  setChartType('albums');
                  setActiveTab('chart');
                }}
                className={`hover:text-white transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'chart' && chartType === 'albums' ? 'text-[#0a84ff] font-semibold' : ''
                }`}
              >
                Top Albums ($9.99)
              </button>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <button
                onClick={() => {
                  setSelectedArtist(state.artist?.name || 'Player Artist');
                  setActiveTab('profile');
                }}
                className="hover:text-white transition cursor-pointer whitespace-nowrap"
              >
                My iTunes Catalog
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-400 shrink-0">
              <span>Mastered for iTunes</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="text-zinc-300 font-mono">
                {new Date(state.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN STOREFRONT CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5">
        <ItunesTabTransition tabKey={activeTab}>
          {activeTab === 'home' && (
            <ItunesHomeView
              state={state}
              onNavigateToChart={(type) => {
                if (type) setChartType(type);
                setActiveTab('chart');
              }}
              onSelectArtist={handleSelectArtist}
              onSelectRelease={(rel) => setSelectedRelease(rel)}
            />
          )}

          {activeTab === 'chart' && (
            <ItunesChartsView
              state={state}
              chartType={chartType}
              setChartType={setChartType}
              chartRegion={chartRegion}
              setChartRegion={setChartRegion}
              onSelectArtist={handleSelectArtist}
              onSelectRelease={(rel) => setSelectedRelease(rel)}
            />
          )}

          {activeTab === 'profile' && (
            <ItunesArtistProfileView
              state={state}
              artistName={selectedArtist}
              onSelectArtist={handleSelectArtist}
              onSelectRelease={(rel) => setSelectedRelease(rel)}
            />
          )}
        </ItunesTabTransition>
      </main>

      {/* ITUNES STORE RELEASE DETAIL MODAL (SUPPORTS BOTH PLAYER & NPC RELEASES) */}
      {selectedRelease && (
        <ItunesReleaseDetailModal
          item={selectedRelease}
          state={state}
          onClose={() => setSelectedRelease(null)}
          onSelectArtist={handleSelectArtist}
        />
      )}
    </div>
  );
}


