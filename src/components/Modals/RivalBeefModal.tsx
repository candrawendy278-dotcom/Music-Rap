import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { formatNumFull, formatNum, formatMoney } from '../../constants';
import {
  getEnsuredRivalState,
  executePlayerBeefDissAction,
  executeFanbaseChartDefenseRally,
  switchActiveRivalNpc
} from '../../data/rivalBeefSystemEngine';
import { REAL_WORLD_NPCS } from '../../data/realWorldArtistCatalog';
import { isNpcMatchingPlayerName } from '../../data/npcPlayerDeduplicationEngine';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { saveGameStateSafely } from '../../utils/saveStateOptimizer';

interface RivalBeefModalProps {
  onClose: () => void;
}

export default function RivalBeefModal({ onClose }: RivalBeefModalProps) {
  const { state, setState } = useGameContext();
  const [activeSubTab, setActiveSubTab] = useState<'battle' | 'switch' | 'log'>('battle');
  const [customDissText, setCustomDissText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const rivalState = useMemo(() => getEnsuredRivalState(state), [state]);
  const playerName = state.artist?.name || 'Artist';
  const playerAvatar =
    state.artist?.image ||
    `https://placehold.co/400x400/18181B/FFFFFF?text=${encodeURIComponent(playerName.charAt(0))}`;

  const releasedPlayerSongs = useMemo(
    () => (state.songs || []).filter(s => s.status === 'released'),
    [state.songs]
  );
  const latestPlayerSong = releasedPlayerSongs[releasedPlayerSongs.length - 1];

  const liveRivalNpc = useMemo(() => {
    return REAL_WORLD_NPCS.find(
      n =>
        n.id === rivalState.rivalNpcId ||
        n.name.toLowerCase() === rivalState.rivalName.toLowerCase()
    );
  }, [rivalState.rivalNpcId, rivalState.rivalName]);

  const rivalComparedTrack = useMemo(() => {
    if (rivalState.activeCounterRelease) {
      return {
        title: rivalState.activeCounterRelease.title,
        cover: rivalState.activeCounterRelease.cover,
        dailyStreams: rivalState.activeCounterRelease.dailyStreams,
        totalStreams: rivalState.activeCounterRelease.totalStreams,
        dailySales: rivalState.activeCounterRelease.dailySales,
        totalSales: rivalState.activeCounterRelease.totalSales,
        isCounterBlock: true
      };
    }
    const topSong = liveRivalNpc?.songs?.[0];
    if (topSong) {
      return {
        title: topSong.title,
        cover: topSong.cover || rivalState.rivalAvatar,
        dailyStreams: topSong.dailyStreams || Math.floor((topSong.streams || 120000) / 14),
        totalStreams: topSong.streams || 120000,
        dailySales: topSong.dailySales || 220,
        totalSales: topSong.sales || 3200,
        isCounterBlock: false
      };
    }
    return null;
  }, [rivalState, liveRivalNpc]);

  const filteredNpcs = useMemo(() => {
    return REAL_WORLD_NPCS.filter(npc => {
      if (isNpcMatchingPlayerName(npc.name, playerName)) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        npc.name.toLowerCase().includes(q) ||
        (npc.genre || '').toLowerCase().includes(q)
      );
    }).slice(0, 48);
  }, [searchQuery, playerName]);

  const triggerNotice = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  const handlePostDiss = (e: React.FormEvent) => {
    e.preventDefault();
    const res = executePlayerBeefDissAction(state, customDissText);
    setState(res.updatedState);
    saveGameStateSafely(res.updatedState).catch(console.error);
    setCustomDissText('');
    triggerNotice(res.notification);
  };

  const handleFanbaseRally = () => {
    const res = executeFanbaseChartDefenseRally(state);
    setState(res.updatedState);
    saveGameStateSafely(res.updatedState).catch(console.error);
    triggerNotice(res.notification);
  };

  const handleSwitchRival = (npcId: string, npcName: string) => {
    const nextState = switchActiveRivalNpc(state, npcId);
    setState(nextState);
    saveGameStateSafely(nextState).catch(console.error);
    setActiveSubTab('battle');
    triggerNotice(`🔥 ${npcName} is now your primary Arch-Rival!`);
  };

  const playerDaily = latestPlayerSong?.dailyStreams || 0;
  const rivalDaily = rivalComparedTrack?.dailyStreams || 0;
  const totalBattleDaily = Math.max(1, playerDaily + rivalDaily);
  const playerSharePct = latestPlayerSong
    ? Math.max(8, Math.min(92, Math.round((playerDaily / totalBattleDaily) * 100)))
    : 50;

  return (
    <div className="fixed inset-0 bg-neutral-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F7] w-full max-w-lg rounded-[28px] shadow-2xl border border-neutral-200/90 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Executive Header */}
        <div className="px-5 py-4 bg-[#0F0F12] text-white flex items-center justify-between border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {rivalState.beefStatusLabel}
              </span>
              <span className="text-[11px] font-bold text-neutral-400 tabular-nums">
                Heat {rivalState.beefHeat}%
              </span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-white mt-1">
              Rival & Chart Beef Command
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <i className="ph-bold ph-x text-sm"></i>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 bg-white border-b border-neutral-200/80 flex items-center gap-2">
          {[
            { id: 'battle', label: 'Head-to-Head War', icon: 'ph-fire' },
            { id: 'switch', label: 'Challenge NPC Rival', icon: 'ph-users-three' },
            { id: 'log', label: 'Beef Timeline', icon: 'ph-newspaper' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-neutral-950 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
              }`}
            >
              <i className={`ph-bold ${tab.icon} text-xs`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {bannerNotice && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-rose-950 text-rose-100 border border-rose-700/50 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <i className="ph-fill ph-Megaphone text-rose-400 text-sm shrink-0"></i>
            <span>{bannerNotice}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeSubTab === 'battle' && !rivalState.hasActiveRival && (
            <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                  <i className="ph-bold ph-shield-check text-lg"></i>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    Career Rivalry Status
                  </span>
                  <h4 className="text-base font-black text-neutral-950">
                    No Active Industry Rival Yet
                  </h4>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    You don&apos;t start your career with an arbitrary rival. In the music industry, a feud only begins when there is a real cause:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/70">
                  <div className="font-black text-neutral-900">1. Organic Chart Clash</div>
                  <div className="text-neutral-500 mt-0.5">
                    When your released song climbs the daily charts and directly threatens or overtakes an established artist in your lane.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/70">
                  <div className="font-black text-neutral-900">2. High-Stakes Release Day Collision</div>
                  <div className="text-neutral-500 mt-0.5">
                    Once you build real chart stature, dropping a major project can provoke a threatened peer to counter-drop on the same day.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/70">
                  <div className="font-black text-neutral-900">3. Public Callout on X</div>
                  <div className="text-neutral-500 mt-0.5">
                    You can intentionally start a feud at any time by calling out an artist in the &ldquo;Challenge NPC Rival&rdquo; tab.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubTab('switch')}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Browse & Call Out an Artist to Start a Rivalry
              </button>
            </div>
          )}

          {activeSubTab === 'battle' && rivalState.hasActiveRival && (
            <>
              {/* VS Face-Off Banner */}
              <div className="bg-[#121216] text-white rounded-2xl p-4 border border-white/10 space-y-4">
                <div className="grid grid-cols-11 items-center gap-2">
                  {/* Player Side */}
                  <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                    <img
                      src={playerAvatar}
                      alt={playerName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 block">
                        You
                      </span>
                      <h4 className="text-sm font-black text-white truncate">{playerName}</h4>
                      <span className="text-[10px] text-neutral-400 font-semibold tabular-nums">
                        Pop {(state.popularity || 0).toFixed(0)}% · {rivalState.playerChartWins}W
                      </span>
                    </div>
                  </div>

                  {/* VS Badge */}
                  <div className="col-span-1 flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-md border border-rose-400/40">
                      VS
                    </div>
                  </div>

                  {/* Rival Side */}
                  <div className="col-span-5 flex items-center justify-end gap-2.5 min-w-0 text-right">
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400 block">
                        Arch-Rival
                      </span>
                      <h4 className="text-sm font-black text-white truncate">
                        {rivalState.rivalName}
                      </h4>
                      <span className="text-[10px] text-neutral-400 font-semibold tabular-nums">
                        Pop {rivalState.rivalPop}% · {rivalState.rivalChartWins}W
                      </span>
                    </div>
                    <OfficialArtworkImg
                      artist={rivalState.rivalName}
                      explicitSrc={rivalState.rivalAvatar}
                      isArtistPortrait={true}
                      className="w-12 h-12 rounded-full object-cover border-2 border-rose-500 shrink-0"
                    />
                  </div>
                </div>

                {/* Cause of Rivalry Badge */}
                {rivalState.rivalryOriginReason && (
                  <div className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-200 leading-snug">
                    <span className="font-black uppercase tracking-wider text-rose-400 mr-1.5">
                      Cause of Rivalry:
                    </span>
                    {rivalState.rivalryOriginReason}
                  </div>
                )}

                {/* Live Headline Ticker */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-200 leading-relaxed">
                  {rivalState.lastBeefHeadline}
                </div>

                {/* Beef Heat Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-neutral-400 uppercase tracking-wider">
                      Feud Intensity & Chart-Block Risk
                    </span>
                    <span className="text-rose-400 tabular-nums">{rivalState.beefHeat}% Heat</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, rivalState.beefHeat)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Whenever you release a Single or Project, {rivalState.rivalName} can counter-drop to try and block you from #1 on Spotify, iTunes & Billboard!
                  </p>
                </div>
              </div>

              {/* Head-to-Head Release Comparison */}
              <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Live Chart Blockade Tracker
                    </span>
                    <h4 className="text-sm font-black text-neutral-900">
                      Active Release Head-to-Head
                    </h4>
                  </div>
                  {rivalComparedTrack?.isCounterBlock && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                      Counter-Drop Active
                    </span>
                  )}
                </div>

                {latestPlayerSong && rivalComparedTrack ? (
                  <>
                    {/* Tug-of-war bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-black tabular-nums">
                        <span className="text-emerald-600">
                          {formatNumFull(playerDaily)}/d ({playerSharePct}%)
                        </span>
                        <span className="text-rose-600">
                          {formatNumFull(rivalDaily)}/d ({100 - playerSharePct}%)
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full overflow-hidden flex bg-neutral-100 gap-0.5">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${playerSharePct}%` }}
                        />
                        <div
                          className="bg-rose-500 h-full transition-all duration-500"
                          style={{ width: `${100 - playerSharePct}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* Player Track Card */}
                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/70 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={latestPlayerSong.cover || playerAvatar}
                            alt={latestPlayerSong.title}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-black text-neutral-900 truncate">
                              {latestPlayerSong.title}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-bold">Your Release</div>
                          </div>
                        </div>
                        <div className="text-[11px] space-y-1 pt-1 border-t border-neutral-200/60 tabular-nums">
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Daily:</span>
                            <span className="font-bold text-neutral-900">
                              +{formatNumFull(latestPlayerSong.dailyStreams || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Total:</span>
                            <span className="font-bold text-neutral-900">
                              {formatNum(latestPlayerSong.streams || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Daily Sales:</span>
                            <span className="font-bold text-neutral-900">
                              +{formatNumFull(latestPlayerSong.dailyPureSales || 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rival Counter Track Card */}
                      <div className="p-3 rounded-xl bg-rose-50/40 border border-rose-200/70 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <OfficialArtworkImg
                            artist={rivalState.rivalName}
                            title={rivalComparedTrack.title}
                            explicitSrc={rivalComparedTrack.cover}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-black text-neutral-900 truncate">
                              {rivalComparedTrack.title}
                            </div>
                            <div className="text-[10px] text-rose-600 font-bold truncate">
                              {rivalState.rivalName}
                            </div>
                          </div>
                        </div>
                        <div className="text-[11px] space-y-1 pt-1 border-t border-rose-200/60 tabular-nums">
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Daily:</span>
                            <span className="font-bold text-rose-700">
                              +{formatNumFull(rivalComparedTrack.dailyStreams)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Total:</span>
                            <span className="font-bold text-neutral-900">
                              {formatNum(rivalComparedTrack.totalStreams)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Daily Sales:</span>
                            <span className="font-bold text-neutral-900">
                              +{formatNumFull(rivalComparedTrack.dailySales)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-neutral-500 py-2">
                    Release a song or project to trigger a live head-to-head chart battle against {rivalState.rivalName}!
                  </p>
                )}
              </div>

              {/* Interactive Beef & Chart Defense Actions */}
              <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500">
                  Rivalry & Chart Defense Actions
                </h4>

                <form onSubmit={handlePostDiss} className="space-y-2">
                  <label className="block text-xs font-bold text-neutral-900">
                    1. Drop Subliminal Shade / Callout on X (+6.5% Hype, +20% Beef Heat)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customDissText}
                      onChange={e => setCustomDissText(e.target.value)}
                      placeholder={`Write shade at ${rivalState.rivalName} or leave blank for auto-diss...`}
                      className="flex-1 bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl shrink-0 active:scale-95 transition cursor-pointer"
                    >
                      Post Shade
                    </button>
                  </div>
                </form>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-neutral-900">
                      2. Sponsor Fanbase Chart-Block Defense Rally
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Mobilize stans on Stationhead & US iTunes to surge streams & pure sales past {rivalState.rivalName}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFanbaseRally}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shrink-0 active:scale-95 transition cursor-pointer"
                  >
                    Rally ({formatMoney(5000)})
                  </button>
                </div>
              </div>
            </>
          )}

          {activeSubTab === 'switch' && (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-black text-neutral-900">
                  Challenge Any NPC Artist as Your Arch-Rival
                </h4>
                <p className="text-xs text-neutral-500">
                  Pick any verified artist below to start a chart rivalry. They will counter-release whenever you drop!
                </p>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Taylor Swift, Drake, Kendrick Lamar, Sabrina, Billie..."
                className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
              />

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredNpcs.map(npc => {
                  const isCurrent = npc.id === rivalState.rivalNpcId;
                  return (
                    <div
                      key={npc.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-rose-50/60 border-rose-400'
                          : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <OfficialArtworkImg
                          artist={npc.name}
                          explicitSrc={npc.avatar}
                          isArtistPortrait={true}
                          className="w-11 h-11 rounded-full object-cover bg-neutral-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-black text-neutral-900 truncate">
                            {npc.name}
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            {npc.genre} · Pop {npc.pop}%
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isCurrent}
                        onClick={() => handleSwitchRival(npc.id, npc.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                          isCurrent
                            ? 'bg-rose-600 text-white cursor-default'
                            : 'bg-neutral-900 hover:bg-neutral-800 text-white active:scale-95'
                        }`}
                      >
                        {isCurrent ? 'Active Rival' : 'Start Beef'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSubTab === 'log' && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500">
                Rivalry & Chart Blockade History
              </h4>
              {(rivalState.beefHistoryLog || []).length === 0 ? (
                <div className="p-4 bg-white rounded-xl border border-neutral-200/80 text-xs text-neutral-500 leading-relaxed">
                  No industry feuds recorded yet. Once a rivalry begins from a chart clash, same-day release collision, or public callout, every inciting incident and chart block will be logged here.
                </div>
              ) : (
                (rivalState.beefHistoryLog || []).map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white rounded-xl border border-neutral-200/80 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400">
                      <span className="uppercase text-rose-600">{item.type.replace('_', ' ')}</span>
                      <span>{item.date}</span>
                    </div>
                    <p className="text-xs font-medium text-neutral-800 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
