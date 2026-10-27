import React, { useState, useMemo } from 'react';
import { useGameContext } from '../../GameContext';
import { formatNum, formatNumFull } from '../../constants';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import {
  RADIO_FORMAT_DEFINITIONS,
  RadioFormatId,
  RadioChartEntry,
  generateRadioAirplayChart
} from '../../data/radioAirplayChartEngine';
import { resolveSongMetadataAndCollabCredits } from '../../data/spotifyTrackMetadataAndCollabEngine';

interface RadioAirplayChartAppProps {
  embedded?: boolean;
  onClose?: () => void;
}

export default function RadioAirplayChartApp({
  embedded = false,
  onClose
}: RadioAirplayChartAppProps) {
  const { state, setState } = useGameContext();
  const [selectedFormat, setSelectedFormat] = useState<RadioFormatId>('all');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceNotice, setServiceNotice] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<RadioChartEntry | null>(null);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setState(p => ({ ...p, activeApp: 'none' }));
    }
  };

  const chartData = useMemo(() => {
    return generateRadioAirplayChart(state, selectedFormat);
  }, [state, selectedFormat]);

  const { formatMeta, entries, playerEntries, greatestGainer, mostAdded, totalPanelSpins } =
    chartData;

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

  const handleServiceSongToRadio = (songId: number) => {
    const campaignCost = 2500;
    if (state.money < campaignCost) {
      setServiceNotice('Insufficient funds ($2,500 required for Radio Impact Servicing).');
      return;
    }

    const targetSong = state.songs.find(s => s.id === songId);
    if (!targetSong) return;

    const qualityBoost = Math.round((targetSong.quality || 65) * 18);
    const popBoost = Math.round((state.popularity || 20) * 24);
    const addedDailySpins = 320 + qualityBoost + popBoost;
    const addedWeeklySpins = addedDailySpins * 7;

    setState(prev => ({
      ...prev,
      money: prev.money - campaignCost,
      dailyExpense: (prev.dailyExpense || 0) + campaignCost,
      songs: prev.songs.map(s => {
        if (s.id !== songId) return s;
        return {
          ...s,
          radioPlays: (s.radioPlays || 0) + addedWeeklySpins,
          dailyRadioPlays: (s.dailyRadioPlays || 0) + addedDailySpins,
          weeklyRadioPlays: (s.weeklyRadioPlays || 0) + addedWeeklySpins,
          momentum: Math.min(2.5, (s.momentum || 1.0) + 0.12)
        };
      })
    }));

    setServiceNotice(
      `"${targetSong.title}" has been serviced to ${formatMeta.panelSize} radio stations (${formatMeta.shortName})! +${addedDailySpins.toLocaleString()} daily spins added.`
    );
  };

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
                  Mediabase • Published Panel
                </span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-white leading-none mt-0.5">
                Radio Airplay Charts
              </h1>
            </div>
          </div>

          <button
            onClick={() => {
              setServiceNotice(null);
              setShowServiceModal(true);
            }}
            className="px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-black font-black text-xs flex items-center space-x-1.5 transition shadow cursor-pointer active:scale-95"
          >
            <i className="ph-fill ph-broadcast text-sm"></i>
            <span>Radio Impact</span>
          </button>
        </div>
      )}

      {/* Format Selector Bar */}
      <div className="px-4 pt-3.5 pb-2 border-b border-white/8 bg-[#0E131D]">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <span
              className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
              style={{
                backgroundColor: `${formatMeta.accentColor}20`,
                color: formatMeta.accentColor,
                border: `1px solid ${formatMeta.accentColor}40`
              }}
            >
              {formatMeta.badgeText}
            </span>
            <h2 className="text-xl font-black text-white tracking-tight mt-1">
              {formatMeta.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              {formatMeta.subtitle}
            </p>
          </div>

          {embedded && (
            <button
              onClick={() => {
                setServiceNotice(null);
                setShowServiceModal(true);
              }}
              className="px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-black font-black text-xs flex items-center space-x-1 shrink-0 transition shadow cursor-pointer"
            >
              <i className="ph-fill ph-broadcast text-sm"></i>
              <span>Service Single</span>
            </button>
          )}
        </div>

        {/* Format Pills */}
        <div className="flex space-x-1.5 overflow-x-auto hide-scrollbar py-1.5 -mx-4 px-4">
          {RADIO_FORMAT_DEFINITIONS.map(fmt => {
            const active = selectedFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition cursor-pointer border ${
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

        {/* Monitored Flagship Stations Ticker */}
        <div className="flex items-center space-x-2 overflow-x-auto hide-scrollbar pt-2 pb-1 text-[10px] text-slate-400">
          <span className="font-bold uppercase tracking-wider text-slate-500 shrink-0">
            Monitored Panel ({formatMeta.panelSize} Stations):
          </span>
          {formatMeta.flagshipStations.map((st, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/5 text-slate-300 font-mono shrink-0"
            >
              {st}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* #1 AIRPLAY CHAMPION SPOTLIGHT CARD */}
        {numberOne && (
          <div className="relative rounded-2xl overflow-hidden border border-white/12 bg-gradient-to-br from-[#162032] via-[#0F1624] to-[#0A0D14] p-4 shadow-xl">
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
                  #1 AIRPLAY LEADER
                </span>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                  {numberOne.weeksOnChart} WKS ON PANEL
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

                <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2.5 border-t border-white/10 tabular-nums">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400">
                      Audience
                    </div>
                    <div className="text-sm font-black text-white">
                      {numberOne.audienceMillions.toFixed(2)}M
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400">
                      7D Spins
                    </div>
                    <div className="text-sm font-black text-sky-400">
                      {formatNumFull(numberOne.weeklySpins)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400">
                      Bullet
                    </div>
                    <div
                      className={`text-sm font-black ${
                        numberOne.spinBullet >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {numberOne.spinBullet >= 0 ? '+' : ''}
                      {formatNumFull(numberOne.spinBullet)}
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
            <div className="bg-[#121824] border border-emerald-500/25 rounded-xl p-3 flex flex-col justify-between">
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
            <div className="bg-[#121824] border border-amber-500/25 rounded-xl p-3 flex flex-col justify-between">
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
                  Highest Rank: <strong className="text-white">#{playerEntries[0].rank}</strong> ({playerEntries[0].title} • {playerEntries[0].audienceMillions.toFixed(2)}M Aud.)
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setServiceNotice(null);
                setShowServiceModal(true);
              }}
              className="text-[11px] font-black text-sky-300 hover:text-white bg-sky-500/20 px-2.5 py-1 rounded-lg border border-sky-400/30 shrink-0 cursor-pointer"
            >
              Boost Airplay
            </button>
          </div>
        )}

        {/* PUBLISHED PANEL TABLE HEADER */}
        <div className="bg-[#121824] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
          <div className="px-3.5 py-2.5 bg-[#161E2E] border-b border-white/10 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
            <div className="flex items-center space-x-3">
              <span className="w-7 text-center">TW</span>
              <span>Track / Station Rotation</span>
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
                        {item.isGreatestGainer && (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[8px] font-black px-1 rounded uppercase shrink-0">
                            🔥 GAINER
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {displayArtist}
                      </p>

                      <div className="flex items-center space-x-1.5 mt-1 text-[9px] tabular-nums">
                        <span className={`font-black px-1.5 py-0.2 rounded border ${tierBadgeStyle}`}>
                          {item.rotationTier}
                        </span>
                        <span className="text-slate-500">
                          LW {item.lastWeek ?? '-'} • PK {item.peak} • {item.weeksOnChart}w
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

      {/* TRACK BROADCAST TELEMETRY DETAIL MODAL */}
      {selectedEntry && (
        <div
          onClick={() => setSelectedEntry(null)}
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#121824] border border-white/15 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-white"
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
                    Rank #{selectedEntry.rank} • {formatMeta.shortName}
                  </span>
                  <h3 className="text-base font-black text-white truncate">
                    {selectedEntry.title}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">{selectedEntry.artist}</p>
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

              <div className="bg-black/40 border border-white/8 rounded-xl p-3">
                <div className="text-[10px] uppercase text-slate-400">7-Day Spin Bullet</div>
                <div
                  className={`text-base font-black mt-0.5 ${
                    selectedEntry.spinBullet >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {selectedEntry.spinBullet >= 0 ? '+' : ''}
                  {formatNumFull(selectedEntry.spinBullet)}
                </div>
                <div className="text-[10px] text-slate-400">
                  +{selectedEntry.newStationAdds} new station adds
                </div>
              </div>

              <div className="bg-black/40 border border-white/8 rounded-xl p-3">
                <div className="text-[10px] uppercase text-slate-400">Panel Coverage</div>
                <div className="text-base font-black text-white mt-0.5">
                  {selectedEntry.stationsOn} / {selectedEntry.totalPanelStations}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Lead: {selectedEntry.leadStation}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedEntry(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-black text-white transition cursor-pointer"
            >
              Close Telemetry Report
            </button>
          </div>
        </div>
      )}

      {/* RADIO IMPACT SERVICING MODAL */}
      {showServiceModal && (
        <div className="fixed inset-0 z-[85] bg-black/85 backdrop-blur-sm flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-[#121824] border border-white/15 w-full max-w-md h-[80vh] sm:h-[72vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#161F30] border-b border-white/10 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 block">
                  Radio Promotion Department
                </span>
                <h3 className="text-base font-black text-white">
                  Service Single to {formatMeta.shortName} Panel
                </h3>
              </div>
              <button
                onClick={() => setShowServiceModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center cursor-pointer"
              >
                <i className="ph ph-x"></i>
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <div className="bg-sky-500/10 border border-sky-400/25 rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
                <div className="font-black text-sky-300 mb-0.5 flex items-center justify-between">
                  <span>Official Radio Add Day Servicing</span>
                  <span className="tabular-nums text-white">Budget: {formatNumFull(state.money)}</span>
                </div>
                Service your official single to program directors across {formatMeta.panelSize} monitored stations ({formatMeta.flagshipStations.slice(0, 2).join(', ')}) to boost daily spin rotation and Audience Impressions.
              </div>

              {serviceNotice && (
                <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-3 text-xs font-bold text-emerald-300">
                  {serviceNotice}
                </div>
              )}

              {releasedPlayerSongs.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-10">
                  No released singles available for radio servicing yet.
                </p>
              ) : (
                releasedPlayerSongs.map(song => (
                  <div
                    key={song.id}
                    className="bg-[#182132] border border-white/8 rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <OfficialArtworkImg
                        artist={state.artist?.name || 'Artist'}
                        title={song.title}
                        explicitSrc={song.cover}
                        isPlayer={true}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 bg-slate-800"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-white truncate">{song.title}</h4>
                        <div className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                          {song.genre} • {formatNum(song.dailyRadioPlays || 0)} daily spins
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleServiceSongToRadio(song.id)}
                      className="px-3.5 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-black font-black text-xs shrink-0 transition cursor-pointer active:scale-95 tabular-nums shadow"
                    >
                      Service ($2,500)
                    </button>
                  </div>
                ))
              )}
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
