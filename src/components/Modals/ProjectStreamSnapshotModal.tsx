import React, { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { Project, Song, GameState } from '../../types';
import {
  generateProjectStreamSnapshot,
  formatSnapshotNumber,
  formatStreamChange,
  formatStreamChangePercent
} from '../../data/projectStreamSnapshotEngine';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';

interface ProjectStreamSnapshotModalProps {
  item: Project | Song;
  state: GameState;
  onClose: () => void;
}

type SnapshotTheme = 'obsidian' | 'emerald' | 'gold';

export const ProjectStreamSnapshotModal: React.FC<ProjectStreamSnapshotModalProps> = ({
  item,
  state,
  onClose
}) => {
  const snapshot = generateProjectStreamSnapshot(item, state);
  const totalChangePercent = formatStreamChangePercent(snapshot.changePercent);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sortBy, setSortBy] = useState<'track' | 'streams' | 'gainers' | 'total'>('track');
  const [theme, setTheme] = useState<SnapshotTheme>('obsidian');
  const cardRef = useRef<HTMLDivElement>(null);

  // Sorted tracks
  const displayedTracks = [...snapshot.tracks].sort((a, b) => {
    if (sortBy === 'streams') return b.dailyStreams - a.dailyStreams;
    if (sortBy === 'gainers') return b.change - a.change;
    if (sortBy === 'total') return b.totalStreams - a.totalStreams;
    return a.trackNumber - b.trackNumber;
  });

  const maxTrackDaily = Math.max(
    1,
    ...snapshot.tracks.map(t => t.dailyStreams || 0)
  );

  const handleCopySummary = () => {
    const lines = [
      `🟢 SPOTIFY DAILY STREAMING SNAPSHOT`,
      `💿 ${snapshot.projectTitle} — ${snapshot.artistName} (${snapshot.projectTypeLabel})`,
      `📅 ${snapshot.fullDateLabel} • Day ${snapshot.daysSinceRelease}`,
      `🔥 Daily Streams: ${formatSnapshotNumber(snapshot.dailyStreams)} (${formatStreamChange(snapshot.change)} | ${totalChangePercent.label})`,
      `📈 Total Streams: ${formatSnapshotNumber(snapshot.totalStreams)}`,
      `⚡ Avg / Track: ${formatSnapshotNumber(snapshot.avgDailyPerTrack)} daily`,
      '',
      'Tracklist Breakdown:'
    ];
    displayedTracks.forEach(t => {
      const pct = formatStreamChangePercent(t.changePercent);
      lines.push(
        `#${t.trackNumber} ${t.title} — ${formatSnapshotNumber(t.dailyStreams)} (${formatStreamChange(t.change)}, ${pct.label}) • Total: ${formatSnapshotNumber(t.totalStreams)}`
      );
    });
    lines.push('\nSpotify for Artists • Official Daily Counter');

    navigator.clipboard?.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSnapshot = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#09090B'
      });
      const link = document.createElement('a');
      const sanitizedTitle = (snapshot.projectTitle || 'snapshot')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      link.download = `spotify-snapshot-${sanitizedTitle}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export snapshot image', err);
    } finally {
      setDownloading(false);
    }
  }, [snapshot.projectTitle]);

  const themeBackgroundClass =
    theme === 'emerald'
      ? 'bg-gradient-to-b from-[#082214] via-[#0B120E] to-[#08090B]'
      : theme === 'gold'
      ? 'bg-gradient-to-b from-[#231B0A] via-[#12100C] to-[#09090B]'
      : 'bg-gradient-to-b from-[#16161C] via-[#101014] to-[#09090B]';

  const accentColor =
    theme === 'gold' ? '#F59E0B' : '#1ED760';

  return (
    <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#0B0B0E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto text-white">
        {/* Top Control Toolbar (Outside Export Canvas) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[#121216] border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <i className="ph-fill ph-spotify-logo text-[#1ED760] text-lg"></i>
            <span className="text-xs font-bold tracking-wider uppercase text-zinc-200">
              Spotify Daily Snapshot
            </span>
            {/* Theme Selector */}
            <div className="hidden sm:flex items-center bg-black/50 p-0.5 rounded-lg border border-white/[0.08] ml-2">
              {([
                { id: 'obsidian', label: 'Obsidian' },
                { id: 'emerald', label: 'Emerald' },
                { id: 'gold', label: 'Gold' }
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                    theme === t.id
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadSnapshot}
              disabled={downloading}
              className="flex items-center gap-1.5 bg-[#1ED760] hover:bg-[#1fdf64] text-black px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <i
                className={`ph-bold ${
                  downloading ? 'ph-spinner animate-spin' : 'ph-download-simple'
                }`}
              ></i>
              <span>{downloading ? 'Saving...' : 'Save PNG'}</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 cursor-pointer border border-white/10"
            >
              <i
                className={`ph-bold ${
                  copied ? 'ph-check text-[#1ED760]' : 'ph-copy'
                }`}
              ></i>
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer border border-white/10"
              aria-label="Close snapshot"
            >
              <i className="ph-bold ph-x text-sm"></i>
            </button>
          </div>
        </div>

        {/* EXPORTABLE SNAPSHOT GRAPHIC CANVAS */}
        <div
          ref={cardRef}
          className={`p-4 sm:p-6 ${themeBackgroundClass} relative overflow-hidden`}
        >
          {/* Top Infographic Meta Header */}
          <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <i
                className="ph-fill ph-spotify-logo text-lg"
                style={{ color: accentColor }}
              ></i>
              <span className="text-[11px] font-black uppercase tracking-widest text-zinc-200">
                SPOTIFY DAILY DATA · STREAMING COUNTER
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <span>{snapshot.fullDateLabel}</span>
              <span className="px-2 py-0.5 rounded bg-white/[0.08] text-white font-mono">
                DAY {snapshot.daysSinceRelease}
              </span>
            </div>
          </div>

          {/* Main Release Hero Block */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-stretch sm:items-center mb-5">
            {/* Left: Official Release Cover Art */}
            <div className="relative shrink-0 w-36 sm:w-44 aspect-square rounded-xl overflow-hidden border border-white/15 shadow-2xl bg-zinc-900 mx-auto sm:mx-0">
              <OfficialArtworkImg
                artist={snapshot.artistName}
                title={snapshot.projectTitle}
                isAlbum={snapshot.projectType !== 'song'}
                isPlayer={true}
                explicitSrc={snapshot.cover}
                alt={snapshot.projectTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />

              {/* Format Tag Top-Left */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md border border-white/15 text-[9px] font-black uppercase tracking-widest text-zinc-200">
                {snapshot.projectTypeLabel}
              </div>

              {/* Artist Name Bottom Overlay */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5">
                <div className="flex items-center gap-1">
                  <span className="font-black text-xs text-white uppercase tracking-wide truncate">
                    {snapshot.artistName}
                  </span>
                  <i className="ph-fill ph-seal-check text-[#3EA6FF] text-xs shrink-0"></i>
                </div>
                <div
                  className="w-8 h-0.5 mt-0.5 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
              </div>
            </div>

            {/* Right: Title & 4-Box Telemetry Counters */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div className="mb-3 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
                  <span>{snapshot.artistName}</span>
                  <span>•</span>
                  <span>{snapshot.releaseYear}</span>
                  <span>•</span>
                  <span>
                    {snapshot.tracks.length}{' '}
                    {snapshot.tracks.length === 1 ? 'Track' : 'Tracks'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white truncate">
                  {snapshot.projectTitle}
                </h1>
              </div>

              {/* Primary Row: Daily Streams + Daily Change */}
              <div className="grid grid-cols-12 gap-2.5 mb-2.5">
                <div className="col-span-7 bg-black/55 border border-white/10 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>DAILY STREAMS</span>
                    <i
                      className="ph-fill ph-trend-up text-xs"
                      style={{ color: accentColor }}
                    ></i>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums tracking-tight leading-none">
                    {formatSnapshotNumber(snapshot.dailyStreams)}
                  </div>
                </div>

                <div
                  className={`col-span-5 rounded-xl p-3 border flex flex-col justify-between ${
                    totalChangePercent.isPositive
                      ? 'bg-[#1ED760]/10 border-[#1ED760]/30'
                      : 'bg-rose-500/10 border-rose-500/30'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                    DAILY CHANGE
                  </div>
                  <div>
                    <div
                      className={`text-base sm:text-lg font-black font-mono tabular-nums leading-none ${
                        totalChangePercent.isPositive
                          ? 'text-[#1ED760]'
                          : 'text-rose-400'
                      }`}
                    >
                      {totalChangePercent.label}
                    </div>
                    <div
                      className={`text-[11px] font-mono font-bold tabular-nums mt-0.5 ${
                        snapshot.change >= 0
                          ? 'text-emerald-300/90'
                          : 'text-rose-300/90'
                      }`}
                    >
                      {formatStreamChange(snapshot.change)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Row: Total Cumulative Streams + Average Per Track */}
              <div className="grid grid-cols-12 gap-2.5">
                <div className="col-span-7 bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
                      TOTAL STREAMS
                    </div>
                    <div className="text-base sm:text-xl font-black text-white font-mono tabular-nums tracking-tight leading-none truncate">
                      {formatSnapshotNumber(snapshot.totalStreams)}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shrink-0 ml-2 bg-zinc-800">
                    <OfficialArtworkImg
                      artist={snapshot.artistName}
                      explicitSrc={state.artist?.image || state.artist?.avatar}
                      isArtistPortrait={true}
                      isPlayer={true}
                      alt={snapshot.artistName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="col-span-5 bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2.5 flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
                    AVG / TRACK
                  </div>
                  <div className="text-sm sm:text-base font-black text-zinc-100 font-mono tabular-nums leading-none truncate">
                    {formatSnapshotNumber(snapshot.avgDailyPerTrack)}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-0.5 truncate">
                    daily avg
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sorter Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                TRACK PERFORMANCE BREAKDOWN
              </span>
            </div>

            <div className="flex items-center gap-1 text-[10px] font-bold uppercase">
              <span className="text-zinc-500 mr-1">Sort:</span>
              {(
                [
                  { id: 'track', label: '#' },
                  { id: 'streams', label: 'Daily' },
                  { id: 'gainers', label: 'Change' },
                  { id: 'total', label: 'Total' }
                ] as const
              ).map(s => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id)}
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
                    sortBy === s.id
                      ? 'bg-[#1ED760] text-black font-black'
                      : 'bg-white/[0.06] text-zinc-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* TRACKLIST TABLE (Properly Proportioned 12-Col Grid Without Wrapping) */}
          <div className="bg-black/65 border border-white/10 rounded-xl overflow-hidden shadow-inner">
            {/* Table Column Headers: 1 + 4 + 2 + 2 + 3 = 12 cols */}
            <div className="grid grid-cols-12 gap-1.5 px-3 py-2.5 bg-white/[0.05] border-b border-white/10 text-[10px] font-black text-zinc-400 uppercase tracking-wider items-center">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4 truncate">TRACK</div>
              <div className="col-span-2 text-right">DAILY</div>
              <div className="col-span-2 text-right">CHANGE</div>
              <div className="col-span-3 text-right">TOTAL</div>
            </div>

            {/* Track Rows */}
            <div className="divide-y divide-white/[0.06] max-h-[320px] overflow-y-auto">
              {displayedTracks.map(track => {
                const pct = formatStreamChangePercent(track.changePercent);
                const isPositiveChange = track.change >= 0;
                const barWidthPct = Math.min(
                  100,
                  Math.max(4, (track.dailyStreams / maxTrackDaily) * 100)
                );

                return (
                  <div
                    key={track.id}
                    className="grid grid-cols-12 gap-1.5 px-3 py-2.5 hover:bg-white/[0.04] transition items-center text-xs"
                  >
                    {/* 1 col: Track Number */}
                    <div className="col-span-1 text-center font-mono font-bold text-zinc-400 tabular-nums text-[11px]">
                      {track.trackNumber}
                    </div>

                    {/* 4 cols: Track Title + Badges + Share Bar */}
                    <div className="col-span-4 min-w-0 pr-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white truncate text-xs sm:text-[13px]">
                          {track.title}
                        </span>
                        {track.isSingle && (
                          <span className="text-[8px] bg-[#1ED760]/15 text-[#1ED760] border border-[#1ED760]/30 px-1 py-0.2 rounded font-black uppercase shrink-0">
                            {track.trackTypeLabel === 'Lead Single'
                              ? 'Lead'
                              : 'Single'}
                          </span>
                        )}
                        {track.milestoneBadge && (
                          <span className="hidden sm:inline-block text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-mono font-bold shrink-0">
                            {track.milestoneBadge}
                          </span>
                        )}
                      </div>

                      {/* Subtle relative daily stream share bar */}
                      <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${barWidthPct}%`,
                            backgroundColor: accentColor
                          }}
                        />
                      </div>
                    </div>

                    {/* 2 cols: Daily Streams */}
                    <div className="col-span-2 text-right font-mono font-bold text-white tabular-nums text-[11px] sm:text-xs">
                      {formatSnapshotNumber(track.dailyStreams)}
                    </div>

                    {/* 2 cols: Change (Numerical + %) */}
                    <div className="col-span-2 text-right font-mono tabular-nums leading-tight">
                      <div
                        className={`text-[11px] sm:text-xs font-bold ${
                          isPositiveChange ? 'text-[#1ED760]' : 'text-rose-400'
                        }`}
                      >
                        {formatStreamChange(track.change)}
                      </div>
                      <div
                        className={`text-[9px] sm:text-[10px] font-semibold ${
                          pct.isPositive
                            ? 'text-emerald-400/80'
                            : 'text-rose-400/80'
                        }`}
                      >
                        {pct.label}
                      </div>
                    </div>

                    {/* 3 cols: Total Cumulative Streams */}
                    <div className="col-span-3 text-right font-mono font-bold text-zinc-200 tabular-nums text-[11px] sm:text-xs">
                      {formatSnapshotNumber(track.totalStreams)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Row 1: TOTAL */}
            <div className="grid grid-cols-12 gap-1.5 px-3 py-2.5 bg-white/[0.07] border-t border-white/15 text-xs font-black items-center">
              <div className="col-span-1"></div>
              <div className="col-span-4 text-white uppercase tracking-wider text-[11px] sm:text-xs">
                TOTAL ({snapshot.tracks.length}{' '}
                {snapshot.tracks.length === 1 ? 'TRACK' : 'TRACKS'})
              </div>
              <div className="col-span-2 text-right font-mono text-white tabular-nums text-[11px] sm:text-xs">
                {formatSnapshotNumber(snapshot.dailyStreams)}
              </div>
              <div className="col-span-2 text-right font-mono tabular-nums leading-tight">
                <div
                  className={`text-[11px] sm:text-xs ${
                    snapshot.change >= 0 ? 'text-[#1ED760]' : 'text-rose-400'
                  }`}
                >
                  {formatStreamChange(snapshot.change)}
                </div>
                <div
                  className={`text-[9px] sm:text-[10px] ${
                    totalChangePercent.isPositive
                      ? 'text-emerald-400/90'
                      : 'text-rose-400/90'
                  }`}
                >
                  {totalChangePercent.label}
                </div>
              </div>
              <div className="col-span-3 text-right font-mono text-white tabular-nums text-[11px] sm:text-xs">
                {formatSnapshotNumber(snapshot.totalStreams)}
              </div>
            </div>

            {/* Footer Row 2: AVERAGE PER TRACK (if > 1 track) */}
            {snapshot.tracks.length > 1 && (
              <div className="grid grid-cols-12 gap-1.5 px-3 py-2 bg-black/70 border-t border-white/[0.06] text-[11px] font-bold text-zinc-400 items-center">
                <div className="col-span-1"></div>
                <div className="col-span-4 uppercase tracking-wider text-[10px]">
                  AVERAGE PER TRACK
                </div>
                <div className="col-span-2 text-right font-mono text-zinc-300 tabular-nums">
                  {formatSnapshotNumber(snapshot.avgDailyPerTrack)}
                </div>
                <div className="col-span-2 text-right font-mono text-zinc-500 tabular-nums">
                  —
                </div>
                <div className="col-span-3 text-right font-mono text-zinc-300 tabular-nums">
                  {formatSnapshotNumber(snapshot.avgTotalPerTrack)}
                </div>
              </div>
            )}
          </div>

          {/* Official Spotify Tracking Footer */}
          <div className="flex items-center justify-between pt-3.5 mt-2 text-zinc-400 text-[11px] font-semibold">
            <span>Official Spotify Daily Counter • Filtered Global Streams</span>
            <div className="flex items-center gap-1.5">
              <i
                className="ph-fill ph-spotify-logo text-sm"
                style={{ color: accentColor }}
              ></i>
              <span className="text-zinc-200 font-bold">Spotify for Artists</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

