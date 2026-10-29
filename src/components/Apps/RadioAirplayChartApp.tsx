import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { formatNumFull } from '../../constants';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import {
  RADIO_FORMAT_DEFINITIONS,
  RadioFormatId
} from '../../data/radioAirplayChartEngine';
import {
  RADIO_TERRITORY_DEFINITIONS,
  RADIO_DAYPART_DEFINITIONS,
  RadioTerritoryId,
  EnhancedRadioChartEntry,
  generateTerritoryRadioChart
} from '../../data/globalRadioEcosystemEngine';
import {
  StationNetworksAndDaypartsPanel,
  CalloutResearchLabPanel,
  RadioPromoAndPayolaDeskPanel
} from './RadioGlobalEcosystemPanels';
import { resolveSongMetadataAndCollabCredits } from '../../data/spotifyTrackMetadataAndCollabEngine';

interface RadioAirplayChartAppProps {
  embedded?: boolean;
  onClose?: () => void;
}

type RadioWorkspaceTab = 'charts' | 'dayparts' | 'callout' | 'promo';

export default function RadioAirplayChartApp({
  embedded = false,
  onClose
}: RadioAirplayChartAppProps) {
  const { state, setState } = useGameContext();
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<RadioWorkspaceTab>('charts');
  const [selectedTerritory, setSelectedTerritory] = useState<RadioTerritoryId>('ALL');
  const [selectedFormat, setSelectedFormat] = useState<RadioFormatId>('all');
  const [selectedEntry, setSelectedEntry] = useState<EnhancedRadioChartEntry | null>(null);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setState(p => ({ ...p, activeApp: 'none' }));
    }
  };

  const territoryChartData = useMemo(() => {
    return generateTerritoryRadioChart(state, selectedTerritory, selectedFormat);
  }, [state, selectedTerritory, selectedFormat]);

  const {
    territoryMeta,
    baseChart,
    entries,
    playerEntries,
    greatestGainer,
    mostAdded
  } = territoryChartData;

  const { formatMeta } = baseChart;
  const numberOne = entries[0] || null;

  const releasedPlayerSongs = useMemo(() => {
    return [...(state.songs || [])]
      .filter(s => s.status === 'released' && s.trackType !== 'b_side')
      .sort(
        (a, b) =>
          new Date(b.releaseDate || state.date).getTime() -
          new Date(a.releaseDate || state.date).getTime()
      );
  }, [state.songs, state.date]);

  const renderContent = () => (
    <div className={`${embedded ? 'pb-16' : 'pb-28'} bg-[#0A0D14] text-white min-h-screen`}>
      {/* Top Broadcast Header */}
      {!embedded && (
        <div className="sticky top-0 z-40 bg-[#0A0D14]/95 backdrop-blur-md border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white transition active:scale-95 cursor-pointer"
            >
              <i className="ph ph-arrow-left text-lg"></i>
            </button>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400">
                  {territoryMeta.monitoringBody}
                </span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-white leading-none mt-0.5">
                Global Radio Broadcast Terminal
              </h1>
            </div>
          </div>

          <button
            onClick={() => setActiveWorkspaceTab('promo')}
            className="px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-black font-black text-xs flex items-center space-x-1.5 transition shadow cursor-pointer active:scale-95"
          >
            <i className="ph-fill ph-broadcast text-sm"></i>
            <span>Promo & Payola</span>
          </button>
        </div>
      )}

      {/* 4 Workspace Navigation Tabs */}
      <div className="px-4 pt-3 pb-2.5 bg-[#0E131D] border-b border-white/10">
        <div className="grid grid-cols-4 gap-1.5 bg-[#090C12] p-1 rounded-xl border border-white/8">
          <button
            onClick={() => setActiveWorkspaceTab('charts')}
            className={`py-2 px-2 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center justify-center space-x-1 ${
              activeWorkspaceTab === 'charts'
                ? 'bg-sky-400 text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="ph-fill ph-chart-bar"></i>
            <span>Charts</span>
          </button>
          <button
            onClick={() => setActiveWorkspaceTab('dayparts')}
            className={`py-2 px-2 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center justify-center space-x-1 ${
              activeWorkspaceTab === 'dayparts'
                ? 'bg-emerald-400 text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="ph-fill ph-clock"></i>
            <span>Dayparts</span>
          </button>
          <button
            onClick={() => setActiveWorkspaceTab('callout')}
            className={`py-2 px-2 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center justify-center space-x-1 ${
              activeWorkspaceTab === 'callout'
                ? 'bg-fuchsia-400 text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="ph-fill ph-users-three"></i>
            <span>Callout</span>
          </button>
          <button
            onClick={() => setActiveWorkspaceTab('promo')}
            className={`py-2 px-2 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center justify-center space-x-1 ${
              activeWorkspaceTab === 'promo'
                ? 'bg-amber-400 text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="ph-fill ph-microphone-stage"></i>
            <span>Promo/Payola</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AIRPLAY CHARTS (8 TERRITORIES + 5 FORMATS) */}
      {activeWorkspaceTab === 'charts' && (
        <>
          <div className="px-4 pt-3.5 pb-2.5 border-b border-white/8 bg-[#0E131D] space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center space-x-1.5">
                  <span
                    className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${formatMeta.accentColor}20`,
                      color: formatMeta.accentColor,
                      border: `1px solid ${formatMeta.accentColor}40`
                    }}
                  >
                    {territoryMeta.flag} {territoryMeta.shortName} • {formatMeta.badgeText}
                  </span>
                </div>
                <h2 className="text-lg font-black text-white tracking-tight mt-1">
                  {formatMeta.name} ({territoryMeta.shortName})
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Monitored by {territoryMeta.monitoringBody} • Regulator: {territoryMeta.regulatoryWatchdog}
                </p>
              </div>

              {embedded && (
                <button
                  onClick={() => setActiveWorkspaceTab('promo')}
                  className="px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-black font-black text-xs flex items-center space-x-1 shrink-0 transition shadow cursor-pointer"
                >
                  <i className="ph-fill ph-broadcast text-sm"></i>
                  <span>Promo Desk</span>
                </button>
              )}
            </div>

            {/* 8 Broadcast Territories Selector */}
            <div>
              <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Broadcast Territory (8 Countries & Global Panel)
              </div>
              <div className="flex space-x-1.5 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4">
                {RADIO_TERRITORY_DEFINITIONS.map(terr => {
                  const active = selectedTerritory === terr.id;
                  return (
                    <button
                      key={terr.id}
                      onClick={() => setSelectedTerritory(terr.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition cursor-pointer border flex items-center space-x-1.5 ${
                        active
                          ? 'bg-sky-400 text-black border-sky-400 font-black shadow'
                          : 'bg-[#161D2B] text-slate-300 border-white/8 hover:bg-[#1E2738]'
                      }`}
                    >
                      <span>{terr.flag}</span>
                      <span>{terr.shortName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5 Format Pills */}
            <div>
              <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Radio Format Panel
              </div>
              <div className="flex space-x-1.5 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4">
                {RADIO_FORMAT_DEFINITIONS.map(fmt => {
                  const active = selectedFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => setSelectedFormat(fmt.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition cursor-pointer border ${
                        active
                          ? 'bg-white text-black border-white font-black shadow'
                          : 'bg-[#161D2B] text-slate-300 border-white/8 hover:bg-[#1E2738]'
                      }`}
                    >
                      {fmt.shortName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monitored Flagship Stations Ticker */}
            <div className="flex items-center space-x-2 overflow-x-auto hide-scrollbar pt-1 text-[10px] text-slate-400">
              <span className="font-bold uppercase tracking-wider text-slate-500 shrink-0">
                Flagship Panel ({territoryMeta.panelStationsCount} Stns):
              </span>
              {territoryMeta.flagshipStations.map(st => (
                <span
                  key={st.id}
                  className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/5 text-slate-300 font-mono shrink-0"
                >
                  {st.name} ({st.callSignOrFreq})
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* #1 AIRPLAY CHAMPION SPOTLIGHT CARD */}
            {numberOne && (
              <div
                onClick={() => setSelectedEntry(numberOne)}
                className="relative rounded-2xl overflow-hidden border border-white/12 bg-gradient-to-br from-[#162032] via-[#0F1624] to-[#0A0D14] p-4 shadow-xl cursor-pointer"
              >
                <div
                  className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-25 pointer-events-none"
                  style={{ backgroundColor: formatMeta.accentColor }}
                />

                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className="flex items-center space-x-2">
                    <span
                      className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full text-black"
                      style={{ backgroundColor: formatMeta.accentColor }}
                    >
                      #1 AIRPLAY LEADER ({territoryMeta.shortName})
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                      {numberOne.weeksOnChart} WKS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Lead: <strong className="text-white">{numberOne.leadStation}</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-3.5 relative z-10">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 shadow-2xl border border-white/15 relative bg-slate-900">
                    <OfficialArtworkImg
                      artist={numberOne.artist}
                      title={numberOne.title}
                      explicitSrc={numberOne.cover || undefined}
                      isPlayer={numberOne.isPlayer}
                      alt={numberOne.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[9px] font-black px-1.5 py-0.2 rounded tabular-nums">
                      #1
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <h3 className="text-lg font-black text-white truncate leading-tight">
                        {numberOne.title}
                      </h3>
                      {numberOne.isPlayer && (
                        <span className="bg-sky-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded uppercase shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-300 truncate mt-0.5">
                      {numberOne.artist}
                    </p>

                    <div className="grid grid-cols-4 gap-2 mt-2.5 pt-2.5 border-t border-white/10 tabular-nums">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">
                          Audience
                        </div>
                        <div className="text-xs font-black text-white">
                          {numberOne.audienceMillions.toFixed(2)}M
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">
                          7D Spins
                        </div>
                        <div className="text-xs font-black text-sky-400">
                          {formatNumFull(numberOne.weeklySpins)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">
                          Bullet
                        </div>
                        <div
                          className={`text-xs font-black ${
                            numberOne.spinBullet >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {numberOne.spinBullet >= 0 ? '+' : ''}
                          {formatNumFull(numberOne.spinBullet)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">
                          MScore
                        </div>
                        <div className="text-xs font-black text-fuchsia-400">
                          {numberOne.callout.mScore} (Net +{numberOne.callout.netPositiveScore})
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WEEKLY RADIO HONORS: GREATEST GAINER & MOST ADDED */}
            <div className="grid grid-cols-2 gap-2.5">
              {greatestGainer && (
                <div
                  onClick={() => setSelectedEntry(greatestGainer)}
                  className="bg-[#121824] border border-emerald-500/25 rounded-xl p-3 flex flex-col justify-between cursor-pointer hover:bg-[#161E2E] transition"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded">
                      ▲ Greatest Gainer
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 tabular-nums">
                      +{formatNumFull(greatestGainer.spinBullet)} spins
                    </span>
                  </div>
                  <div className="flex items-center space-x-2.5 mt-1">
                    <OfficialArtworkImg
                      artist={greatestGainer.artist}
                      title={greatestGainer.title}
                      explicitSrc={greatestGainer.cover || undefined}
                      isPlayer={greatestGainer.isPlayer}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-800"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-white truncate">
                        {greatestGainer.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {greatestGainer.artist} • #{greatestGainer.rank}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mostAdded && (
                <div
                  onClick={() => setSelectedEntry(mostAdded)}
                  className="bg-[#121824] border border-amber-500/25 rounded-xl p-3 flex flex-col justify-between cursor-pointer hover:bg-[#161E2E] transition"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded">
                      ★ Most Added
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-300 tabular-nums">
                      +{mostAdded.newStationAdds} stations
                    </span>
                  </div>
                  <div className="flex items-center space-x-2.5 mt-1">
                    <OfficialArtworkImg
                      artist={mostAdded.artist}
                      title={mostAdded.title}
                      explicitSrc={mostAdded.cover || undefined}
                      isPlayer={mostAdded.isPlayer}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-800"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-white truncate">
                        {mostAdded.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {mostAdded.artist} • #{mostAdded.rank}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PLAYER ACTIVE RADIO ENTRIES SUMMARY */}
            {playerEntries.length > 0 && (
              <div className="bg-sky-500/10 border border-sky-400/30 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-sky-400/20 text-sky-300 flex items-center justify-center shrink-0">
                    <i className="ph-fill ph-radio text-lg"></i>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-wider text-sky-300">
                      Your Active Airplay Entries ({playerEntries.length})
                    </div>
                    <div className="text-xs text-slate-300 truncate tabular-nums">
                      Peak in {territoryMeta.shortName}: <strong className="text-white">#{playerEntries[0].rank}</strong> ({playerEntries[0].title} • MScore {playerEntries[0].callout.mScore})
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveWorkspaceTab('promo')}
                  className="text-[11px] font-black text-sky-300 hover:text-white bg-sky-500/20 px-2.5 py-1 rounded-lg border border-sky-400/30 shrink-0 cursor-pointer"
                >
                  Promo Desk
                </button>
              </div>
            )}

            {/* PUBLISHED PANEL TABLE HEADER */}
            <div className="bg-[#121824] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
              <div className="px-3.5 py-2.5 bg-[#161E2E] border-b border-white/10 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                <div className="flex items-center space-x-3">
                  <span className="w-7 text-center">TW</span>
                  <span>Track / Rotation & Callout</span>
                </div>
                <div className="flex items-center space-x-4 text-right">
                  <span>Spins / Bullet</span>
                  <span className="w-16">Audience</span>
                </div>
              </div>

              <div className="divide-y divide-white/6">
                {entries.map(item => {
                  const meta = resolveSongMetadataAndCollabCredits(item as any, item.artist, state);
                  const displayArtist = meta.primaryArtist;
                  const displayTitle = meta.cleanTitle;

                  const rankDelta =
                    item.lastWeek === null ? null : item.lastWeek - item.rank;

                  let tierBadgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';
                  if (item.rotationTier === 'POWER ROTATION') {
                    tierBadgeStyle = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
                  } else if (item.rotationTier === 'HEAVY ROTATION') {
                    tierBadgeStyle = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
                  } else if (item.rotationTier === 'CLIMBING') {
                    tierBadgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedEntry(item)}
                      className={`p-3 flex items-center justify-between gap-2 hover:bg-white/[0.04] transition cursor-pointer ${
                        item.isPlayer ? 'bg-sky-500/[0.08]' : ''
                      }`}
                    >
                      {/* Rank + Movement */}
                      <div className="w-8 flex flex-col items-center justify-center shrink-0 tabular-nums">
                        <span
                          className={`text-sm font-black ${
                            item.rank === 1
                              ? 'text-amber-400'
                              : item.isPlayer
                              ? 'text-sky-400'
                              : 'text-white'
                          }`}
                        >
                          {item.rank}
                        </span>
                        {rankDelta === null ? (
                          <span className="text-[8px] font-black uppercase text-amber-300 bg-amber-500/15 px-1 rounded mt-0.5">
                            NEW
                          </span>
                        ) : rankDelta > 0 ? (
                          <span className="text-[9px] font-bold text-emerald-400 flex items-center">
                            ▲{rankDelta}
                          </span>
                        ) : rankDelta < 0 ? (
                          <span className="text-[9px] font-bold text-rose-400 flex items-center">
                            ▼{Math.abs(rankDelta)}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-500">=</span>
                        )}
                      </div>

                      {/* Cover + Metadata */}
                      <div className="flex items-center space-x-2.5 flex-1 min-w-0 pr-1">
                        <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-slate-800 relative border border-white/10">
                          <OfficialArtworkImg
                            artist={displayArtist}
                            title={displayTitle}
                            explicitSrc={item.cover || undefined}
                            isPlayer={item.isPlayer}
                            alt={displayTitle}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <h4
                              className={`text-xs font-black truncate ${
                                item.isPlayer ? 'text-sky-300' : 'text-white'
                              }`}
                            >
                              {displayTitle}
                            </h4>
                            {item.isPlayer && (
                              <span className="bg-sky-400 text-black text-[8px] font-black px-1 rounded uppercase shrink-0">
                                YOU
                              </span>
                            )}
                            {item.isBlacklistedInTerritory && (
                              <span className="bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[8px] font-black px-1 rounded uppercase shrink-0">
                                PAYOLA SUSPENDED
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {displayArtist} • <span className="text-slate-500">{item.leadStation}</span>
                          </p>

                          <div className="flex items-center space-x-1.5 mt-1 text-[9px] tabular-nums flex-wrap">
                            <span className={`font-black px-1.5 py-0.2 rounded border ${tierBadgeStyle}`}>
                              {item.rotationTier}
                            </span>
                            <span className="text-fuchsia-300 bg-fuchsia-500/10 px-1.5 py-0.2 rounded border border-fuchsia-500/20">
                              MScore {item.callout.mScore}
                            </span>
                            <span
                              className={`${
                                item.callout.burnoutRatePct >= 32
                                  ? 'text-rose-400 font-bold'
                                  : 'text-slate-500'
                              }`}
                            >
                              Burn {item.callout.burnoutRatePct}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Spins / Bullet & Audience Impressions */}
                      <div className="flex items-center space-x-3 shrink-0 text-right tabular-nums">
                        <div>
                          <div className="text-xs font-bold text-white">
                            {formatNumFull(item.weeklySpins)}
                          </div>
                          <div
                            className={`text-[10px] font-bold ${
                              item.spinBullet >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.spinBullet >= 0 ? '+' : ''}
                            {formatNumFull(item.spinBullet)}
                          </div>
                        </div>

                        <div className="w-16 bg-white/[0.03] border border-white/8 rounded-lg py-1 px-1.5 text-right">
                          <div className="text-xs font-black text-sky-300">
                            {item.audienceMillions.toFixed(1)}M
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {item.stationsOn}/{item.totalPanelStations} stn
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: STATION NETWORKS & 5-DAYPART ROTATION MATRIX */}
      {activeWorkspaceTab === 'dayparts' && (
        <div className="p-4">
          <StationNetworksAndDaypartsPanel
            state={state}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
            entries={entries}
            playerEntries={playerEntries}
          />
        </div>
      )}

      {/* TAB 3: LISTENER CALLOUT & MSCORE RESEARCH LAB */}
      {activeWorkspaceTab === 'callout' && (
        <div className="p-4">
          <CalloutResearchLabPanel
            state={state}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
            entries={entries}
            playerEntries={playerEntries}
          />
        </div>
      )}

      {/* TAB 4: PROMO, LIVE LOUNGES & PAYOLA DESK */}
      {activeWorkspaceTab === 'promo' && (
        <div className="p-4">
          <RadioPromoAndPayolaDeskPanel
            state={state}
            setState={setState}
            releasedPlayerSongs={releasedPlayerSongs}
            defaultTerritory={selectedTerritory}
          />
        </div>
      )}

      {/* TRACK BROADCAST TELEMETRY DETAIL MODAL (WITH DAYPARTS & CALLOUT) */}
      {selectedEntry && (
        <div
          onClick={() => setSelectedEntry(null)}
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#121824] border border-white/15 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-white max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <OfficialArtworkImg
                  artist={selectedEntry.artist}
                  title={selectedEntry.title}
                  explicitSrc={selectedEntry.cover || undefined}
                  isPlayer={selectedEntry.isPlayer}
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                    Rank #{selectedEntry.rank} • {territoryMeta.shortName} ({formatMeta.shortName})
                  </span>
                  <h3 className="text-base font-black text-white truncate">
                    {selectedEntry.title}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {selectedEntry.artist} • Lead: {selectedEntry.leadStation}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
              >
                <i className="ph ph-x"></i>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 tabular-nums">
              <div className="bg-black/40 border border-white/8 rounded-xl p-3">
                <div className="text-[10px] uppercase text-slate-400">Total Audience</div>
                <div className="text-lg font-black text-white mt-0.5">
                  {selectedEntry.audienceMillions.toFixed(2)}M
                </div>
                <div
                  className={`text-[10px] font-bold ${
                    selectedEntry.audienceDeltaMillions >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {selectedEntry.audienceDeltaMillions >= 0 ? '+' : ''}
                  {selectedEntry.audienceDeltaMillions.toFixed(2)}M this week
                </div>
              </div>

              <div className="bg-black/40 border border-white/8 rounded-xl p-3">
                <div className="text-[10px] uppercase text-slate-400">Weekly Spins</div>
                <div className="text-lg font-black text-sky-400 mt-0.5">
                  {formatNumFull(selectedEntry.weeklySpins)}
                </div>
                <div className="text-[10px] text-slate-400">
                  {formatNumFull(selectedEntry.dailySpins)} spins / 24h
                </div>
              </div>
            </div>

            {/* Listener Callout & MScore Summary */}
            <div className="bg-black/40 border border-white/8 rounded-xl p-3 space-y-2 tabular-nums">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-fuchsia-400">
                  Listener Callout & MScore Research
                </span>
                <span className="text-[10px] font-black text-white">
                  {selectedEntry.callout.calloutVerdict}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div>
                  <div className="text-[9px] text-slate-400 uppercase">Net Pos</div>
                  <div className="text-xs font-black text-emerald-400">
                    +{selectedEntry.callout.netPositiveScore}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 uppercase">Familiarity</div>
                  <div className="text-xs font-black text-white">
                    {selectedEntry.callout.familiarityPct}%
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 uppercase">Burnout</div>
                  <div
                    className={`text-xs font-black ${
                      selectedEntry.callout.burnoutRatePct >= 32
                        ? 'text-rose-400'
                        : 'text-amber-300'
                    }`}
                  >
                    {selectedEntry.callout.burnoutRatePct}%
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 uppercase">MScore</div>
                  <div className="text-xs font-black text-fuchsia-400">
                    {selectedEntry.callout.mScore}
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Daypart Breakdown inside Modal */}
            <div className="bg-black/40 border border-white/8 rounded-xl p-3 space-y-2 tabular-nums">
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                5-Daypart Broadcast Clock Breakdown
              </div>
              <div className="space-y-1.5">
                {RADIO_DAYPART_DEFINITIONS.map(dp => {
                  const d = selectedEntry.dayparts.find(x => x.daypartId === dp.id);
                  return (
                    <div
                      key={dp.id}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <span className="text-slate-300">
                        {dp.shortName} <span className="text-slate-500">({dp.timeWindow})</span>
                      </span>
                      <span className="font-mono font-bold text-white">
                        {formatNumFull(d?.spins7d || 0)} sp ({d?.sharePct || 0}%) •{' '}
                        <span className="text-sky-400">{(d?.audienceMillions || 0).toFixed(2)}M</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex space-x-2">
              {selectedEntry.isPlayer && (
                <button
                  onClick={() => {
                    setSelectedEntry(null);
                    setActiveWorkspaceTab('promo');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-xs font-black text-black transition cursor-pointer"
                >
                  Promote in {territoryMeta.shortName}
                </button>
              )}
              <button
                onClick={() => setSelectedEntry(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-black text-white transition cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return renderContent();
  }

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#0A0D14] z-50 overflow-y-auto animate-in fade-in hide-scrollbar">
      {renderContent()}
    </div>
  );
}
