import { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { formatNum, formatNumFull, formatMoney } from '../../constants';
import MarketDistributionView from './MarketDistributionView';
import { evaluateDistinctTrackProfile } from '../../data/bSideDistinctVelocityEngine';
import { getArtistMarketSynergySummary } from '../../data/skillMarketSynergyEngine';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';

type StatViewTab = 'overview' | 'tracks' | 'markets';

export default function StatisticApp() {
  const { state, setState } = useGameContext();
  const [activeTab, setActiveTab] = useState<StatViewTab>('overview');
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'song' | 'project'>('all');

  const marketSynergy = useMemo(() => {
    return getArtistMarketSynergySummary(state.skills);
  }, [state.skills]);

  const handleClose = () => setState(p => ({ ...p, activeApp: 'none' }));

  const releaseSongs = useMemo(() => {
    const songsWithId = state.songs
      .filter(s => s.status === 'released')
      .map(s => ({
        ...s,
        itemType: 'song' as const,
        dailyStreams: s.dailyStreams || 0,
        dailyViews: (s as any).dailyViews || 0,
        dailyPureSales: (s as any).dailyPureSales || 0
      }));

    const projsWithId = state.projects
      .filter(p => p.status === 'released')
      .map(p => {
        const pSongs = state.songs.filter(s => p.songs && p.songs.some(ps => ps.id === s.id));
        const totalStreams = pSongs.reduce((acc, s) => acc + (s.streams || 0), 0);
        const dailyStreams = pSongs.reduce((acc, s) => acc + (s.dailyStreams || 0), 0);
        const totalViews = pSongs.reduce((acc, s) => acc + (s.views || 0), 0);
        const totalRadio = pSongs.reduce((acc, s) => acc + (s.radioPlays || 0), 0);
        const totalSongSales = pSongs.reduce((acc, s) => acc + (s.pureSales || 0), 0);
        return {
          ...p,
          itemType: 'project' as const,
          streams: totalStreams,
          dailyStreams,
          views: totalViews,
          radioPlays: totalRadio,
          pureSales: (p.pureSales || 0) + totalSongSales,
        };
      });

    const all = [...songsWithId, ...projsWithId];
    return all.sort((a, b) => {
      const aTotal = (a.streams || 0) + (a.pureSales || 0) * 1500;
      const bTotal = (b.streams || 0) + (b.pureSales || 0) * 1500;
      return bTotal - aTotal;
    });
  }, [state.songs, state.projects]);

  const filteredCatalog = useMemo(() => {
    if (catalogFilter === 'all') return releaseSongs;
    return releaseSongs.filter(r => r.itemType === catalogFilter);
  }, [releaseSongs, catalogFilter]);

  const selectedSong = releaseSongs.find(s => `${s.itemType}_${s.id}` === selectedSongId) || releaseSongs[0];

  const totalStreams = useMemo(() => {
    const standaloneSongs = state.songs.filter(s => s.status === 'released' && !state.projects.some(p => p.songs && p.songs.some(ps => ps.id === s.id)));
    const projects = state.projects.filter(p => p.status === 'released');
    const projStreams = projects.reduce((acc, p) => acc + state.songs.filter(s => p.songs && p.songs.some(ps => ps.id === s.id)).reduce((a, s) => a + (s.streams || 0), 0), 0);
    const songStreams = standaloneSongs.reduce((acc, s) => acc + (s.streams || 0), 0);
    return projStreams + songStreams;
  }, [state.songs, state.projects]);

  const totalDailyStreams = useMemo(() => {
    return state.songs
      .filter(s => s.status === 'released')
      .reduce((acc, s) => acc + (s.dailyStreams || 0), 0);
  }, [state.songs]);

  const totalSales = useMemo(() => {
    const standaloneSongs = state.songs.filter(s => s.status === 'released' && !state.projects.some(p => p.songs && p.songs.some(ps => ps.id === s.id)));
    const projects = state.projects.filter(p => p.status === 'released');
    const projSales = projects.reduce((acc, p) => acc + (p.pureSales || 0) + state.songs.filter(s => p.songs && p.songs.some(ps => ps.id === s.id)).reduce((a, s) => a + (s.pureSales || 0), 0), 0);
    const songSales = standaloneSongs.reduce((acc, s) => acc + (s.pureSales || 0), 0);
    return projSales + songSales;
  }, [state.songs, state.projects]);

  const totalViews = useMemo(() => {
    const standaloneSongs = state.songs.filter(s => s.status === 'released' && !state.projects.some(p => p.songs && p.songs.some(ps => ps.id === s.id)));
    const projects = state.projects.filter(p => p.status === 'released');
    const projViews = projects.reduce((acc, p) => acc + state.songs.filter(s => p.songs && p.songs.some(ps => ps.id === s.id)).reduce((a, s) => a + (s.views || 0), 0), 0);
    const songViews = standaloneSongs.reduce((acc, s) => acc + (s.views || 0), 0);
    return projViews + songViews;
  }, [state.songs, state.projects]);

  const totalRadio = useMemo(() => {
    return state.songs
      .filter(s => s.status === 'released')
      .reduce((acc, s) => acc + (s.radioPlays || 0), 0);
  }, [state.songs]);

  // RIAA / Global Equivalent Album Units (1,500 on-demand audio/video streams = 1 unit, + pure sales)
  const careerEquivalentUnits = useMemo(() => {
    return Math.floor((totalStreams + totalViews) / 1500) + totalSales;
  }, [totalStreams, totalViews, totalSales]);

  // Gross Royalty Breakdown
  const streamingRoyalty = Math.floor(totalStreams * 0.0038);
  const youtubeRoyalty = Math.floor(totalViews * 0.0016);
  const pureSalesRoyalty = Math.floor(totalSales * 0.72);
  const estimatedRoyalties = streamingRoyalty + youtubeRoyalty + pureSalesRoyalty;

  // Platform ratios for visual progress
  const platformTotal = totalStreams + totalViews + (totalSales * 200) + 1;
  const spotifyShare = Math.round((totalStreams / platformTotal) * 100);
  const youtubeShare = Math.round((totalViews / platformTotal) * 100);
  const salesShare = Math.max(1, 100 - spotifyShare - youtubeShare);

  const artistName = state.artist?.name || 'Artist';
  const monthlyListeners = state.spotify?.listeners || 0;
  const youtubeSubs = state.youtube?.subs || 0;
  const totalFans = state.fans ?? 250;

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#0B0D12] z-50 overflow-y-auto overflow-x-hidden animate-in slide-in-from-bottom-full hide-scrollbar flex flex-col text-zinc-100 font-sans">
      {/* Top Studio Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0B0D12]/95 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 text-zinc-300 transition cursor-pointer border border-white/[0.08] shrink-0"
            title="Close Analytics"
          >
            <i className="ph ph-arrow-left text-base"></i>
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <OfficialArtworkImg
              artist={artistName}
              explicitSrc={state.artist?.image || state.artist?.avatar}
              isArtistPortrait={true}
              isPlayer={true}
              alt={artistName}
              className="w-8 h-8 rounded-full object-cover border border-white/15 bg-zinc-800 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm text-white tracking-tight truncate">
                  {artistName}
                </h1>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Live Telemetry"></span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-none mt-0.5">
                Artist Analytics · {releaseSongs.length} Releases
              </p>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block leading-none">
            SPS Units
          </span>
          <span className="text-xs font-mono font-bold text-white mt-0.5 block tabular-nums">
            {formatNum(careerEquivalentUnits)}
          </span>
        </div>
      </header>

      {/* Segmented Navigation Bar */}
      <div className="px-4 pt-3 pb-1 bg-[#0B0D12] sticky top-[57px] z-30 border-b border-white/[0.05]">
        <div className="grid grid-cols-3 bg-[#13161F] p-1 rounded-lg border border-white/[0.07]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#222736] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <i className="ph ph-chart-line-up text-sm"></i>
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('tracks')}
            className={`py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'tracks'
                ? 'bg-[#222736] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <i className="ph ph-disc text-sm"></i>
            <span>Catalog ({releaseSongs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('markets')}
            className={`py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'markets'
                ? 'bg-[#222736] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <i className="ph ph-globe-hemisphere-west text-sm"></i>
            <span>Territories</span>
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-5 pb-24 flex-1">
        {/* ==================== TAB 1: OVERVIEW ==================== */}
        {activeTab === 'overview' && (
          <div className="space-y-5 animate-in fade-in">
            {/* Primary Career Telemetry Panel */}
            <section className="rounded-xl bg-[#12151E] border border-white/[0.08] p-4 shadow-xl">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                <span className="uppercase tracking-wider font-semibold text-zinc-400">
                  Total Career Audio Streams
                </span>
                <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                  +{formatNum(totalDailyStreams)}/day
                </span>
              </div>

              <div className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight tabular-nums my-1">
                {formatNumFull(totalStreams)}
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                <span>Monthly Listeners: <strong className="text-zinc-200 font-mono">{formatNum(monthlyListeners)}</strong></span>
                <span aria-hidden="true">·</span>
                <span>YouTube Subs: <strong className="text-zinc-200 font-mono">{formatNum(youtubeSubs)}</strong></span>
              </div>

              {/* Gross Revenue & Equivalent Units Strip */}
              <div className="grid grid-cols-3 gap-2.5 mt-4 pt-3.5 border-t border-white/[0.07]">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                    Est. Gross Royalties
                  </span>
                  <span className="text-sm sm:text-base font-bold font-mono text-emerald-400 tabular-nums mt-0.5 block">
                    {formatMoney(estimatedRoyalties)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                    Album Units (SPS)
                  </span>
                  <span className="text-sm sm:text-base font-bold font-mono text-white tabular-nums mt-0.5 block">
                    {formatNumFull(careerEquivalentUnits)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                    Radio Airplay
                  </span>
                  <span className="text-sm sm:text-base font-bold font-mono text-sky-400 tabular-nums mt-0.5 block">
                    {formatNum(totalRadio)} spins
                  </span>
                </div>
              </div>
            </section>

            {/* 4-Card Platform Telemetry Matrix */}
            <section className="grid grid-cols-2 gap-2.5">
              {/* Spotify Audio */}
              <div className="bg-[#12151E] border border-white/[0.08] rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <i className="ph-fill ph-spotify-logo text-[#1DB954] text-base"></i>
                    <span className="text-xs font-semibold text-zinc-200">Spotify</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">{spotifyShare}% share</span>
                </div>
                <div className="text-lg font-bold font-mono text-white tabular-nums">
                  {formatNum(totalStreams)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1 pt-1.5 border-t border-white/[0.05]">
                  <span>Est. Payout</span>
                  <span className="font-mono text-emerald-400">{formatMoney(streamingRoyalty)}</span>
                </div>
              </div>

              {/* YouTube Video */}
              <div className="bg-[#12151E] border border-white/[0.08] rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <i className="ph-fill ph-youtube-logo text-[#FF0000] text-base"></i>
                    <span className="text-xs font-semibold text-zinc-200">YouTube</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">{youtubeShare}% share</span>
                </div>
                <div className="text-lg font-bold font-mono text-white tabular-nums">
                  {formatNum(totalViews)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1 pt-1.5 border-t border-white/[0.05]">
                  <span>AdSense Rev</span>
                  <span className="font-mono text-emerald-400">{formatMoney(youtubeRoyalty)}</span>
                </div>
              </div>

              {/* iTunes Pure Sales */}
              <div className="bg-[#12151E] border border-white/[0.08] rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <i className="ph-fill ph-apple-logo text-[#0a84ff] text-base"></i>
                    <span className="text-xs font-semibold text-zinc-200">iTunes Sales</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Pure Units</span>
                </div>
                <div className="text-lg font-bold font-mono text-white tabular-nums">
                  {formatNum(totalSales)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1 pt-1.5 border-t border-white/[0.05]">
                  <span>Store Net</span>
                  <span className="font-mono text-emerald-400">{formatMoney(pureSalesRoyalty)}</span>
                </div>
              </div>

              {/* Global Radio Airplay */}
              <div className="bg-[#12151E] border border-white/[0.08] rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <i className="ph-fill ph-broadcast text-amber-400 text-base"></i>
                    <span className="text-xs font-semibold text-zinc-200">Radio Spins</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Airplay</span>
                </div>
                <div className="text-lg font-bold font-mono text-white tabular-nums">
                  {formatNum(totalRadio)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1 pt-1.5 border-t border-white/[0.05]">
                  <span>Audience Reach</span>
                  <span className="font-mono text-zinc-300">{formatNum(totalRadio * 120)}</span>
                </div>
              </div>
            </section>

            {/* Multi-Platform Share Distribution Bar */}
            <section className="bg-[#12151E] rounded-xl p-4 border border-white/[0.08]">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Channel Volume Split
                </h3>
                <span className="text-[11px] text-zinc-400 font-mono">
                  Spotify {spotifyShare}% · YouTube {youtubeShare}% · iTunes {salesShare}%
                </span>
              </div>

              <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-[#1DB954] transition-all duration-500"
                  style={{ width: `${spotifyShare}%` }}
                />
                <div
                  className="h-full bg-[#FF0000] transition-all duration-500"
                  style={{ width: `${youtubeShare}%` }}
                />
                <div
                  className="h-full bg-[#0a84ff] transition-all duration-500"
                  style={{ width: `${salesShare}%` }}
                />
              </div>
            </section>

            {/* Top Performing Releases Table (Quick Leaderboard) */}
            {releaseSongs.length > 0 && (
              <section className="bg-[#12151E] rounded-xl border border-white/[0.08] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                      Top Performing Releases
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Ranked by total streams and digital pure sales
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('tracks')}
                    className="text-xs font-semibold text-[#3b82f6] hover:underline cursor-pointer"
                  >
                    Full Catalog &rsaquo;
                  </button>
                </div>

                <div className="divide-y divide-white/[0.05]">
                  {releaseSongs.slice(0, 5).map((item, idx) => (
                    <div
                      key={`${item.itemType}_${item.id}`}
                      onClick={() => {
                        setSelectedSongId(`${item.itemType}_${item.id}`);
                        setActiveTab('tracks');
                      }}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-4 text-center font-mono text-xs text-zinc-500 shrink-0">
                          {idx + 1}
                        </span>
                        <img
                          src={item.cover}
                          alt={item.title}
                          className="w-9 h-9 rounded object-cover border border-white/10 shrink-0 bg-zinc-800"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white truncate">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                            <span>{item.itemType === 'project' ? 'Album / EP' : 'Single'}</span>
                            <span aria-hidden="true">·</span>
                            <span>{formatNum(item.pureSales || 0)} sold</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-white tabular-nums">
                          {formatNum(item.streams || 0)}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 tabular-nums">
                          +{formatNum(item.dailyStreams || 0)}/d
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Audience Segmentation & Active Skill Multipliers */}
            <section className="grid grid-cols-1 gap-3">
              {/* Fanbase Loyalty Segmentation */}
              <div className="bg-[#12151E] border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                      Audience Loyalty &amp; Fanbase
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Core listener conversion &amp; first-week sales power
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold font-mono text-white tabular-nums">
                      {formatNumFull(totalFans)}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">Total Fans</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/[0.06]">
                  <div className="bg-[#0B0D12] p-2.5 rounded-lg border border-white/[0.05]">
                    <span className="text-[10px] text-zinc-400 block">Casual (45%)</span>
                    <span className="text-xs font-mono font-bold text-zinc-200 mt-0.5 block tabular-nums">
                      {formatNum(Math.round(totalFans * 0.45))}
                    </span>
                  </div>
                  <div className="bg-[#0B0D12] p-2.5 rounded-lg border border-white/[0.05]">
                    <span className="text-[10px] text-sky-400 block">Core Fans (40%)</span>
                    <span className="text-xs font-mono font-bold text-white mt-0.5 block tabular-nums">
                      {formatNum(Math.round(totalFans * 0.40))}
                    </span>
                  </div>
                  <div className="bg-[#0B0D12] p-2.5 rounded-lg border border-white/[0.05]">
                    <span className="text-[10px] text-emerald-400 block">Superfans (15%)</span>
                    <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block tabular-nums">
                      {formatNum(Math.round(totalFans * 0.15))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Craft Synergy Multipliers */}
              <div className="bg-[#12151E] rounded-xl p-4 border border-white/[0.08]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-semibold text-white tracking-wider uppercase">
                      Skill Synergy Multipliers
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Active career modifiers from your artist skill mastery
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#0B0D12] rounded-lg p-2.5 border border-white/[0.05]">
                    <span className="text-[10px] text-zinc-400 block">Streaming</span>
                    <span className="text-sm font-mono font-bold text-emerald-400 mt-0.5 block">
                      {marketSynergy.streamingBoost}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block truncate">
                      {marketSynergy.longevityBonus}
                    </span>
                  </div>

                  <div className="bg-[#0B0D12] rounded-lg p-2.5 border border-white/[0.05]">
                    <span className="text-[10px] text-zinc-400 block">Pure Sales</span>
                    <span className="text-sm font-mono font-bold text-sky-400 mt-0.5 block">
                      {marketSynergy.salesBoost}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block truncate">
                      Buyer conversion
                    </span>
                  </div>

                  <div className="bg-[#0B0D12] rounded-lg p-2.5 border border-white/[0.05]">
                    <span className="text-[10px] text-zinc-400 block">Radio Airplay</span>
                    <span className="text-sm font-mono font-bold text-amber-400 mt-0.5 block">
                      {marketSynergy.radioBoost}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block truncate">
                      {marketSynergy.programmerBonus}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ==================== TAB 2: CATALOG TRACKS ==================== */}
        {activeTab === 'tracks' && (
          <div className="space-y-5 animate-in fade-in">
            {releaseSongs.length > 0 ? (
              <>
                {/* Filter & Track Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex bg-[#12151E] p-0.5 rounded-lg border border-white/[0.08]">
                      {(['all', 'song', 'project'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setCatalogFilter(f)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                            catalogFilter === f
                              ? 'bg-[#222736] text-white'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {f === 'all' ? 'All Releases' : f === 'song' ? 'Singles & Cuts' : 'Albums & EPs'}
                        </button>
                      ))}
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {filteredCatalog.length} items
                    </span>
                  </div>

                  {/* Horizontal Release Picker */}
                  <div className="flex overflow-x-auto hide-scrollbar gap-2.5 pb-1">
                    {filteredCatalog.map((s, index) => {
                      const isSelected =
                        selectedSong &&
                        `${selectedSong.itemType}_${selectedSong.id}` === `${s.itemType}_${s.id}`;
                      return (
                        <button
                          key={`${s.itemType}_${s.id}`}
                          onClick={() => setSelectedSongId(`${s.itemType}_${s.id}`)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all cursor-pointer w-[195px] shrink-0 border text-left ${
                            isSelected
                              ? 'bg-[#191E2B] border-[#3b82f6] shadow-md'
                              : 'bg-[#12151E] border-white/[0.07] hover:border-white/20'
                          }`}
                        >
                          <img
                            src={s.cover}
                            alt={s.title}
                            className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/10 bg-zinc-800"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                              <span className="font-mono">#{index + 1}</span>
                              <span>·</span>
                              <span className="truncate">
                                {s.itemType === 'project'
                                  ? 'Project'
                                  : (s as any).trackType === 'b_side'
                                  ? 'B-Side'
                                  : 'Single'}
                              </span>
                            </div>
                            <p className="font-semibold text-xs text-white truncate mt-0.5">
                              {s.title}
                            </p>
                            <p className="text-[11px] font-mono text-emerald-400 truncate">
                              {formatNum(s.streams || 0)} streams
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Telemetry Inspector for Selected Release */}
                {selectedSong && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#12151E] border border-white/[0.08] flex items-center gap-3.5">
                      <img
                        src={selectedSong.cover}
                        alt={selectedSong.title}
                        className="w-16 h-16 rounded-lg object-cover shadow-md shrink-0 border border-white/10 bg-zinc-800"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                          <span className="text-sky-400 font-semibold">
                            {selectedSong.itemType === 'project'
                              ? 'Album / EP'
                              : (selectedSong as any).trackType === 'b_side'
                              ? 'Album B-Side Cut'
                              : 'Official Single'}
                          </span>
                          {selectedSong.itemType === 'song' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-zinc-300">
                                {evaluateDistinctTrackProfile(selectedSong as any).personaLabel}
                              </span>
                            </>
                          )}
                        </div>
                        <h4 className="font-bold text-base text-white truncate mt-0.5">
                          {selectedSong.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                          <span>Quality: <strong className="text-white font-mono">{selectedSong.quality || 70}/100</strong></span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Est. Rev:{' '}
                            <strong className="text-emerald-400 font-mono">
                              {formatMoney(
                                Math.floor(
                                  (selectedSong.streams || 0) * 0.0038 +
                                    (selectedSong.views || 0) * 0.0016 +
                                    (selectedSong.pureSales || 0) * 0.72
                                )
                              )}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 4-Metric Telemetry Grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-[#12151E] border border-white/[0.08] rounded-xl p-3.5">
                        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                          <span>Audio Streams</span>
                          <i className="ph-fill ph-spotify-logo text-[#1DB954]"></i>
                        </div>
                        <p className="text-white font-bold font-mono text-base tabular-nums">
                          {formatNumFull(selectedSong.streams || 0)}
                        </p>
                        <p className="text-emerald-400 text-[11px] font-mono mt-1 tabular-nums">
                          +{formatNum((selectedSong as any).dailyStreams || 0)}/day
                        </p>
                      </div>

                      <div className="bg-[#12151E] border border-white/[0.08] rounded-xl p-3.5">
                        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                          <span>Video Views</span>
                          <i className="ph-fill ph-youtube-logo text-[#FF0000]"></i>
                        </div>
                        <p className="text-white font-bold font-mono text-base tabular-nums">
                          {formatNumFull(selectedSong.views || 0)}
                        </p>
                        <p className="text-zinc-400 text-[11px] font-mono mt-1 tabular-nums">
                          {(selectedSong as any).hasMV ? 'Official MV Active' : 'Audio / Topic'}
                        </p>
                      </div>

                      <div className="bg-[#12151E] border border-white/[0.08] rounded-xl p-3.5">
                        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                          <span>iTunes Pure Sales</span>
                          <i className="ph-fill ph-apple-logo text-[#0a84ff]"></i>
                        </div>
                        <p className="text-white font-bold font-mono text-base tabular-nums">
                          {formatNumFull(selectedSong.pureSales || 0)}
                        </p>
                        <p className="text-sky-400 text-[11px] font-mono mt-1 tabular-nums">
                          Digital Units
                        </p>
                      </div>

                      <div className="bg-[#12151E] border border-white/[0.08] rounded-xl p-3.5">
                        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                          <span>Radio Airplay</span>
                          <i className="ph-fill ph-broadcast text-amber-400"></i>
                        </div>
                        <p className="text-white font-bold font-mono text-base tabular-nums">
                          {formatNumFull(selectedSong.radioPlays || 0)}
                        </p>
                        <p className="text-amber-400 text-[11px] font-mono mt-1 tabular-nums">
                          Station Spins
                        </p>
                      </div>
                    </div>

                    {/* Quick Jump to Territorial Breakdown */}
                    <button
                      onClick={() => setActiveTab('markets')}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#12151E] hover:bg-[#191E2B] border border-white/[0.08] flex items-center justify-between text-xs font-semibold text-zinc-200 transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <i className="ph ph-globe-hemisphere-west text-sky-400 text-base"></i>
                        <span>View Country-by-Country Breakdown for &ldquo;{selectedSong.title}&rdquo;</span>
                      </span>
                      <span className="text-sky-400">&rsaquo;</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyStateNotice
                onGoToStudio={() => {
                  handleClose();
                  setState(p => ({ ...p, activeTab: 'studio' }));
                }}
              />
            )}
          </div>
        )}

        {/* ==================== TAB 3: TERRITORIES / MARKETS ==================== */}
        {activeTab === 'markets' && (
          <div className="space-y-5 animate-in fade-in">
            {releaseSongs.length > 0 ? (
              <div className="space-y-4">
                {/* Horizontal Track Selector for Market Inspection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      Select Release for Territorial Analysis
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {releaseSongs.length} in Catalog
                    </span>
                  </div>

                  <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1">
                    {releaseSongs.map((s, index) => {
                      const isSelected =
                        selectedSong &&
                        `${selectedSong.itemType}_${selectedSong.id}` === `${s.itemType}_${s.id}`;
                      return (
                        <button
                          key={`market_sel_${s.itemType}_${s.id}`}
                          onClick={() => setSelectedSongId(`${s.itemType}_${s.id}`)}
                          className={`flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer shrink-0 border text-left ${
                            isSelected
                              ? 'bg-[#191E2B] border-[#3b82f6] text-white'
                              : 'bg-[#12151E] border-white/[0.07] text-zinc-400 hover:text-white'
                          }`}
                        >
                          <img
                            src={s.cover}
                            alt={s.title}
                            className="w-8 h-8 rounded object-cover shrink-0 bg-zinc-800"
                          />
                          <div className="max-w-[115px]">
                            <p className="font-semibold text-xs truncate text-white">
                              {s.title}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono">
                              #{index + 1} · {formatNum(s.streams || 0)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <MarketDistributionView
                  selectedSong={selectedSong}
                  catalogSongs={releaseSongs}
                  onSelectSong={setSelectedSongId}
                />
              </div>
            ) : (
              <EmptyStateNotice
                onGoToStudio={() => {
                  handleClose();
                  setState(p => ({ ...p, activeTab: 'studio' }));
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyStateNotice({ onGoToStudio }: { onGoToStudio: () => void }) {
  return (
    <div className="text-center py-16 flex flex-col items-center justify-center p-6 bg-[#12151E] rounded-xl border border-white/[0.08]">
      <div className="w-14 h-14 bg-white/[0.04] border border-white/[0.08] rounded-xl flex items-center justify-center mb-3 text-zinc-300">
        <i className="ph ph-chart-bar text-2xl"></i>
      </div>
      <h3 className="font-bold text-base mb-1 text-white">No Released Music Yet</h3>
      <p className="text-zinc-400 text-xs max-w-[260px] mb-5 leading-relaxed">
        Record and release singles or albums in the Studio to start tracking global streams, sales, and country analytics.
      </p>
      <button
        onClick={onGoToStudio}
        className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] active:scale-95 text-white font-semibold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
      >
        <i className="ph-bold ph-plus"></i>
        <span>Open Recording Studio</span>
      </button>
    </div>
  );
}
