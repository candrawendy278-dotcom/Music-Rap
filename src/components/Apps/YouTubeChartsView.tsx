import React, { useState } from 'react';
import { GameState, Song } from '../../types';
import { formatNumFull, COUNTRY_NAMES } from '../../constants';
import { OfficialMvThumbnailImg } from '../Common/OfficialMvThumbnailImg';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { normalizeRealArtistName, normalizeRealTitle } from '../../data/realWorldArtistCatalog';
import { resolveNpcMvReleaseDate } from './YouTubeArtistProfileView';
import { ChartMovementBadge } from '../Common/ChartMovementBadge';
import { resolveSongMetadataAndCollabCredits } from '../../data/spotifyTrackMetadataAndCollabEngine';

interface YouTubeChartsViewProps {
  state: GameState;
  chartData: any[];
  chartRegion: string;
  setChartRegion: (region: string) => void;
  onSelectVideo: (video: Song) => void;
  onOpenChannel?: (artistName: string, isPlayer: boolean) => void;
}

export const YouTubeChartsView: React.FC<YouTubeChartsViewProps> = ({
  state,
  chartData,
  chartRegion,
  setChartRegion,
  onSelectVideo,
  onOpenChannel
}) => {
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly'>('daily');
  const countries = Object.entries(COUNTRY_NAMES).sort((a, b) => a[1].localeCompare(b[1]));
  const regionLabel = chartRegion === 'global' ? 'Global' : (COUNTRY_NAMES[chartRegion] || chartRegion);

  const quickTerritories = [
    { code: 'global', label: 'Global' },
    { code: 'US', label: 'United States' },
    { code: 'GB', label: 'United Kingdom' },
    { code: 'ID', label: 'Indonesia' },
    { code: 'KR', label: 'South Korea' },
    { code: 'JP', label: 'Japan' },
    { code: 'BR', label: 'Brazil' }
  ];

  const periodMultiplier = chartPeriod === 'weekly' ? 7 : 1;

  const openChartVideo = (item: any, idx: number) => {
    const displayArtist = item.isPlayer ? item.artist : normalizeRealArtistName(item.artist);
    const displayTitle = item.isPlayer ? item.title : normalizeRealTitle(item.title, displayArtist, false);

    if (item.isPlayer) {
      const playerSong = state.songs.find(
        s => s.title.toLowerCase() === displayTitle.toLowerCase()
      );
      if (playerSong) {
        onSelectVideo({ ...playerSong, isPlayer: true } as any);
        return;
      }
    }

    const totalViews = (item.points || 500000) * 24;
    const npcReleaseDate = item.isPlayer
      ? state.date.split('T')[0]
      : resolveNpcMvReleaseDate(displayArtist, displayTitle, state.date, undefined, totalViews);

    onSelectVideo({
      id: idx + 50000,
      title: displayTitle,
      genre: 'Pop',
      quality: 92,
      streams: (item.points || 500000) * 35,
      dailyStreams: item.points || 500000,
      sales: 0,
      views: totalViews,
      hasMV: true,
      status: 'released',
      releaseDate: npcReleaseDate,
      cover: item.cover,
      mvDistributor: 'vevo',
      ...(item.isPlayer ? { isPlayer: true } : { isPlayer: false, artist: displayArtist })
    } as any);
  };

  const numberOne = chartData[0];
  const numberOneArtist = numberOne
    ? (numberOne.isPlayer ? numberOne.artist : normalizeRealArtistName(numberOne.artist))
    : '';
  const numberOneTitle = numberOne
    ? (numberOne.isPlayer ? numberOne.title : normalizeRealTitle(numberOne.title, numberOneArtist, false))
    : '';
  const numberOneFormattedTitle = numberOneTitle
    ? (numberOneTitle.includes('Official') ? numberOneTitle : `${numberOneTitle} (Official Music Video)`)
    : '';

  return (
    <div className="pb-24 min-h-screen bg-[#0F0F0F] text-[#F1F1F1]">
      {/* 1. AUTHENTIC YOUTUBE MUSIC CHARTS HEADER */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.08] bg-gradient-to-b from-[#220909] to-[#0F0F0F]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#FF0000] flex items-center justify-center text-white shadow">
              <i className="ph-fill ph-play text-xs translate-x-[0.5px]"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                YouTube Music Charts
              </h1>
              <p className="text-[11px] text-[#AAAAAA] mt-0.5">
                Top 50 Music Videos · {regionLabel}
              </p>
            </div>
          </div>

          {/* Daily / Weekly Switch */}
          <div className="flex bg-[#272727] p-0.5 rounded-lg border border-white/[0.08]">
            <button
              onClick={() => setChartPeriod('daily')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                chartPeriod === 'daily'
                  ? 'bg-[#F1F1F1] text-[#0F0F0F]'
                  : 'text-[#AAAAAA] hover:text-white'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setChartPeriod('weekly')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                chartPeriod === 'weekly'
                  ? 'bg-[#F1F1F1] text-[#0F0F0F]'
                  : 'text-[#AAAAAA] hover:text-white'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>

        {/* Country Dropdown + Quick Territory Chips */}
        <div className="space-y-2.5">
          <div className="relative">
            <i className="ph ph-globe text-[#AAAAAA] absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"></i>
            <select
              value={chartRegion}
              onChange={e => setChartRegion(e.target.value)}
              className="bg-[#212121] text-white border border-white/10 font-semibold text-xs rounded-lg pl-8 pr-8 py-2 focus:outline-none w-full appearance-none cursor-pointer"
            >
              <option value="global">Global (Worldwide Music Videos)</option>
              <optgroup label="Top Music Markets">
                {countries.map(c => (
                  <option key={c[0]} value={c[0]}>
                    {c[1]}
                  </option>
                ))}
              </optgroup>
            </select>
            <i className="ph-fill ph-caret-down text-[#AAAAAA] absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"></i>
          </div>

          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
            {quickTerritories.map(t => (
              <button
                key={t.code}
                onClick={() => setChartRegion(t.code)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  chartRegion === t.code
                    ? 'bg-[#F1F1F1] text-[#0F0F0F]'
                    : 'bg-[#272727] text-[#F1F1F1] hover:bg-[#3F3F3F]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. #1 TRENDING MUSIC VIDEO SPOTLIGHT HERO */}
      {numberOne && (
        <section className="p-4 border-b border-white/[0.08]">
          <div
            onClick={() => openChartVideo(numberOne, 0)}
            className="rounded-xl overflow-hidden bg-[#181818] border border-white/[0.08] cursor-pointer group shadow-xl"
          >
            <div className="relative w-full aspect-video bg-black overflow-hidden">
              <OfficialMvThumbnailImg
                artist={numberOneArtist}
                title={numberOneTitle}
                isPlayer={numberOne.isPlayer}
                explicitSrc={numberOne.isPlayer ? numberOne.cover : undefined}
                alt={numberOneTitle}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#FF0000] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                <i className="ph-fill ph-fire"></i>
                <span>#1 on Trending for Music · {regionLabel}</span>
              </div>

              <span className="absolute bottom-3 right-3 bg-black/85 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                3:48
              </span>

              <div className="absolute bottom-3 left-3 right-16">
                <h2 className="text-base sm:text-lg font-bold text-white leading-snug line-clamp-1 group-hover:text-[#3EA6FF] transition">
                  {numberOneFormattedTitle}
                </h2>
                <div className="flex items-center gap-2 text-xs text-zinc-300 mt-1">
                  <OfficialArtworkImg
                    artist={numberOneArtist}
                    isArtistPortrait={true}
                    isPlayer={numberOne.isPlayer}
                    explicitSrc={numberOne.isPlayer ? (state.artist?.image || state.artist?.avatar) : undefined}
                    alt={numberOneArtist}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                  <span className="font-semibold text-white truncate">{numberOneArtist}</span>
                  <span>•</span>
                  <span className="font-mono text-zinc-200">
                    {formatNumFull((numberOne.points || 0) * periodMultiplier)} {chartPeriod} views
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. YOUTUBE TOP 50 MUSIC VIDEOS LEADERBOARD */}
      <section className="px-3 pt-3">
        <div className="flex items-center justify-between px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#AAAAAA] border-b border-white/[0.06]">
          <span>Rank &amp; Video</span>
          <span>{chartPeriod === 'weekly' ? 'Weekly Views' : 'Daily Views'}</span>
        </div>

        <div className="divide-y divide-white/[0.05]">
          {chartData.length > 0 ? (
            chartData.map((item: any, idx: number) => {
              const currPos = idx + 1;
              const meta = resolveSongMetadataAndCollabCredits(item, item.artist, state);
              const displayArtist = meta.formattedArtistCredits;
              const primaryArtworkArtist = meta.primaryArtist;
              const displayTitle = meta.cleanTitle;
              const videoTitleFormatted = displayTitle.includes('Official')
                ? displayTitle
                : `${displayTitle} (Official Music Video)`;

              const periodViews = (item.points || 0) * periodMultiplier;

              return (
                <div
                  key={`${displayTitle}_${idx}`}
                  onClick={() => openChartVideo(item, idx)}
                  className={`flex items-center py-2.5 px-1.5 rounded-xl transition group cursor-pointer ${
                    item.isPlayer
                      ? 'bg-[#FF0000]/10 hover:bg-[#FF0000]/15'
                      : 'hover:bg-white/[0.05]'
                  }`}
                >
                  {/* Rank & Trend (Up, Down, =, RE-ENTRY, NEW) */}
                  <div className="w-9 flex flex-col items-center justify-center shrink-0">
                    <span
                      className={`font-mono font-bold text-sm tabular-nums ${
                        currPos === 1
                          ? 'text-[#FF0000] font-black'
                          : currPos <= 3
                          ? 'text-white'
                          : 'text-[#AAAAAA]'
                      }`}
                    >
                      {currPos}
                    </span>
                    <ChartMovementBadge
                      item={item}
                      currentRank={currPos}
                      chartLimit={chartData.length}
                      currentDate={state.date}
                      variant="youtube"
                    />
                  </div>

                  {/* 16:9 Video Thumbnail */}
                  <div className="w-28 aspect-video bg-[#272727] rounded-lg ml-2 shrink-0 relative overflow-hidden border border-white/[0.08]">
                    <OfficialMvThumbnailImg
                      artist={primaryArtworkArtist}
                      title={displayTitle}
                      isPlayer={item.isPlayer}
                      explicitSrc={item.isPlayer ? item.cover : undefined}
                      alt={displayTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute bottom-1 left-1.5 text-[8px] font-black text-white/90 lowercase drop-shadow">
                      vevo
                    </span>
                    <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[9px] px-1 rounded font-medium">
                      {`${3 + (idx % 2)}:${String(12 + ((idx * 19) % 45)).padStart(2, '0')}`}
                    </span>
                  </div>

                  {/* Video Title, Channel & Views */}
                  <div className="ml-3 flex-1 min-w-0 pr-1">
                    <h4
                      className={`text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-[#3EA6FF] transition ${
                        item.isPlayer ? 'text-white font-bold' : 'text-[#F1F1F1] font-medium'
                      }`}
                    >
                      {videoTitleFormatted}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-[#AAAAAA] mt-0.5 truncate">
                      <span className="truncate">{displayArtist}</span>
                      <i className="ph-fill ph-music-note-simple text-[9px] shrink-0"></i>
                      {item.isPlayer && (
                        <span className="text-[#FF4E45] font-semibold shrink-0">· You</span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-zinc-300 mt-0.5 tabular-nums">
                      {formatNumFull(periodViews)} views
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-[#AAAAAA] text-sm py-10">
              Chart is calculating... Check back tomorrow.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default YouTubeChartsView;
