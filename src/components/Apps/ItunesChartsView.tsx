import React, { useMemo } from 'react';
import { GameState, ChartItem } from '../../types';
import { formatNum, COUNTRY_NAMES } from '../../constants';
import { getTrackCoverArt } from '../../data/npcAssets';
import { generateAuthenticRegionalChart } from '../../data/countryMarketSystem';
import { generateRealNpcAlbumsChart } from '../../data/npcRealReleaseChartsEngine';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { normalizeRealArtistName, normalizeRealTitle } from '../../data/realWorldArtistCatalog';
import { ChartMovementBadge } from '../Common/ChartMovementBadge';
import { resolveSongMetadataAndCollabCredits } from '../../data/spotifyTrackMetadataAndCollabEngine';

interface ItunesChartsViewProps {
  state: GameState;
  chartType: 'singles' | 'albums';
  setChartType: (type: 'singles' | 'albums') => void;
  chartRegion: string;
  setChartRegion: (region: string) => void;
  onSelectArtist: (artistName: string) => void;
  onPlaySong?: (title: string, artist: string, cover: string) => void;
  onSelectRelease?: (item: any) => void;
}

export const ItunesChartsView: React.FC<ItunesChartsViewProps> = ({
  state,
  chartType,
  setChartType,
  chartRegion,
  setChartRegion,
  onSelectArtist,
  onPlaySong,
  onSelectRelease
}) => {
  const chartData: ChartItem[] = useMemo(() => {
    const key = (chartType === 'singles' ? 'daily_' : 'albums_') + chartRegion;
    if (state.itunes.charts && state.itunes.charts[key] && state.itunes.charts[key].length > 0) {
      return state.itunes.charts[key];
    }
    if (chartType === 'singles') {
      return generateAuthenticRegionalChart({
        platform: 'itunes',
        region: chartRegion,
        playerSongs: state.songs.filter(s => s.status === 'released'),
        playerName: state.artist?.name || '',
        playerCountry: state.artist?.country || 'US',
        playerPopularity: state.popularity || 2.0,
        playerHype: state.hype || 15.0,
        currentDate: new Date(state.date),
        limit: 50
      });
    }
    return generateRealNpcAlbumsChart({
      platform: 'itunes',
      region: chartRegion,
      playerProjects: state.projects,
      playerSongs: state.songs,
      playerName: state.artist?.name || '',
      playerCountry: state.artist?.country || 'US',
      currentDate: new Date(state.date),
      limit: 50
    });
  }, [state.itunes.charts, chartRegion, chartType, state.songs, state.projects, state.artist, state.popularity, state.hype, state.date]);

  const regionName = chartRegion === 'global' ? 'Worldwide' : (COUNTRY_NAMES[chartRegion] || chartRegion);
  const top1 = chartData[0];
  const top2 = chartData[1];
  const top3 = chartData[2];
  const maxSales = Math.max(1, top1?.points || 10000);

  const getDisplayArtist = (item: ChartItem) => {
    if (chartType === 'albums') {
      return item.isPlayer ? item.artist : normalizeRealArtistName(item.artist);
    }
    return resolveSongMetadataAndCollabCredits(item, item.artist, state).formattedArtistCredits;
  };
  const getDisplayTitle = (item: ChartItem) => {
    if (chartType === 'albums') {
      return item.isPlayer ? item.title : normalizeRealTitle(item.title);
    }
    return resolveSongMetadataAndCollabCredits(item, item.artist, state).cleanTitle;
  };

  const openItemDetail = (item: ChartItem, rank?: number) => {
    if (!onSelectRelease) return;
    if (item.isPlayer) {
      const playerMatch = chartType === 'albums'
        ? state.projects.find(p => p.title.toLowerCase() === item.title.toLowerCase())
        : state.songs.find(s => s.title.toLowerCase() === item.title.toLowerCase());
      if (playerMatch) {
        onSelectRelease(playerMatch);
        return;
      }
    }
    onSelectRelease({
      title: getDisplayTitle(item),
      artist: getDisplayArtist(item),
      cover: item.cover || getTrackCoverArt(getDisplayArtist(item), getDisplayTitle(item)),
      pureSales: (item.points || 1500) * 14,
      dailySales: item.points || 1500,
      isAlbum: chartType === 'albums',
      isPlayer: !!item.isPlayer,
      currentRank: rank,
      peakPosition: item.peakPosition || rank,
      weeksOnChart: item.weeksOnChart || 1
    });
  };

  return (
    <div className="space-y-6 pb-32">
      {/* 1. AUTHENTIC ITUNES TOP CHARTS TOOLBAR */}
      <section className="bg-[#14141a] p-4 sm:p-5 rounded-xl border border-white/[0.08] shadow-xl space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                iTunes Top {chartType === 'singles' ? 'Songs' : 'Albums'}
              </h2>
              <span className="text-xs text-zinc-500">·</span>
              <span className="text-xs font-medium text-[#0a84ff]">{regionName} Storefront</span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Official real-time digital purchase rankings · Updated daily
            </p>
          </div>

          {/* Segmented Control: Top Songs vs Top Albums */}
          <div className="flex bg-[#0a0a0d] p-0.5 rounded-lg border border-white/[0.08] self-start sm:self-auto shrink-0">
            <button
              onClick={() => setChartType('singles')}
              className={`px-3.5 py-1 text-xs font-medium rounded-[6px] transition cursor-pointer ${
                chartType === 'singles'
                  ? 'bg-[#2c2c34] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Top Songs ($1.29)
            </button>
            <button
              onClick={() => setChartType('albums')}
              className={`px-3.5 py-1 text-xs font-medium rounded-[6px] transition cursor-pointer ${
                chartType === 'albums'
                  ? 'bg-[#2c2c34] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Top Albums ($9.99)
            </button>
          </div>
        </div>

        {/* Country Storefront Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
          <div className="relative flex-1 max-w-md">
            <i className="ph ph-globe text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"></i>
            <select
              value={chartRegion}
              onChange={e => setChartRegion(e.target.value)}
              className="w-full bg-[#0a0a0d] text-zinc-200 rounded-lg py-1.5 pl-8 pr-8 appearance-none text-xs font-medium border border-white/[0.08] focus:border-[#0a84ff] outline-none cursor-pointer transition"
            >
              <option value="global">Worldwide iTunes Storefront (Global Top 50)</option>
              {Object.keys(COUNTRY_NAMES).map(cc => (
                <option key={cc} value={cc}>
                  {COUNTRY_NAMES[cc]} iTunes Storefront
                </option>
              ))}
            </select>
            <i className="ph-fill ph-caret-down text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"></i>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span>
              #1 Daily Volume: <strong className="text-white font-mono">{formatNum(top1?.points || 0)}</strong> units
            </span>
          </div>
        </div>
      </section>

      {/* 2. TOP 3 FEATURED STOREFRONT PODIUM */}
      {chartData.length >= 3 && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {[
            { item: top1, rank: 1, label: '#1 Best Seller' },
            { item: top2, rank: 2, label: '#2 Store Hit' },
            { item: top3, rank: 3, label: '#3 Trending' }
          ].map(({ item, rank, label }) => {
            const dispArtist = getDisplayArtist(item);
            const dispTitle = getDisplayTitle(item);
            const cov = item.isPlayer
              ? item.cover || undefined
              : item.cover || getTrackCoverArt(dispArtist, dispTitle);
            return (
              <div
                key={rank}
                onClick={() => openItemDetail(item, rank)}
                className={`p-3.5 rounded-xl border flex items-center gap-3.5 cursor-pointer transition group ${
                  rank === 1
                    ? 'bg-[#171720] border-[#0a84ff]/40 shadow-lg'
                    : 'bg-[#131318] border-white/[0.07] hover:border-white/15'
                }`}
              >
                <div className="relative shrink-0">
                  <OfficialArtworkImg
                    artist={dispArtist}
                    title={dispTitle}
                    explicitSrc={cov}
                    isAlbum={chartType === 'albums'}
                    isPlayer={item.isPlayer}
                    alt={dispTitle}
                    className="w-16 h-16 rounded-lg object-cover shadow-md border border-white/10"
                  />
                  {onPlaySong && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlaySong(dispTitle, dispArtist, cov);
                      }}
                      className="absolute inset-0 m-auto w-7 h-7 rounded-full bg-black/80 hover:bg-[#0a84ff] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      aria-label={`Preview ${dispTitle}`}
                    >
                      <i className="ph-fill ph-play text-xs ml-0.5"></i>
                    </button>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      rank === 1 ? 'text-[#0a84ff]' : 'text-zinc-400'
                    }`}>
                      {label}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {formatNum(item.points || 0)}/day
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-white group-hover:underline truncate mt-0.5">
                    {dispTitle}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectArtist(dispArtist);
                    }}
                    className="text-xs text-zinc-400 hover:text-white truncate block text-left"
                  >
                    {dispArtist}
                  </button>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">
                      {chartType === 'singles' ? 'Digital Single' : 'Studio Album'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border ${
                      item.isPlayer
                        ? 'border-zinc-700 text-zinc-400 bg-zinc-900'
                        : 'border-[#0a84ff]/80 text-[#409cff] group-hover:bg-[#0a84ff] group-hover:text-white'
                    }`}>
                      {item.isPlayer ? 'Purchased' : chartType === 'singles' ? '$1.29' : '$9.99'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* 3. AUTHENTIC ITUNES STORE TOP 50 TABLE WITH POPULARITY METER BARS */}
      <section className="bg-[#131318] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl">
        {/* Table Column Headers */}
        <div className="grid grid-cols-12 items-center px-3.5 py-2.5 bg-[#191920] border-b border-white/[0.07] text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          <div className="col-span-7 sm:col-span-6 flex items-center gap-3">
            <span className="w-7 text-center">#</span>
            <span className="w-7 text-center">Move</span>
            <span>{chartType === 'singles' ? 'Song' : 'Album'}</span>
          </div>
          <div className="hidden sm:flex sm:col-span-2 items-center justify-center">
            <span>Popularity</span>
          </div>
          <div className="hidden sm:flex sm:col-span-2 items-center justify-end pr-3">
            <span>Daily Sales</span>
          </div>
          <div className="col-span-5 sm:col-span-2 flex items-center justify-end">
            <span>Price</span>
          </div>
        </div>

        <div className="divide-y divide-white/[0.05]">
          {chartData.map((item, i) => {
            const rank = i + 1;
            const displayArtist = getDisplayArtist(item);
            const displayTitle = getDisplayTitle(item);
            const cover = item.isPlayer
              ? item.cover || undefined
              : item.cover || getTrackCoverArt(displayArtist, displayTitle);

            // Calculate 1..8 popularity bars like classic iTunes Store
            const ratio = Math.min(1, Math.max(0.15, (item.points || 500) / maxSales));
            const activeBars = Math.max(1, Math.round(ratio * 8));

            return (
              <div
                key={`${item.title}_${i}`}
                onClick={() => openItemDetail(item, rank)}
                className={`grid grid-cols-12 items-center px-3.5 py-2.5 transition cursor-pointer group ${
                  item.isPlayer
                    ? 'bg-[#0a84ff]/[0.08] hover:bg-[#0a84ff]/[0.14]'
                    : i % 2 === 0
                    ? 'bg-[#131318] hover:bg-white/[0.03]'
                    : 'bg-[#15151b] hover:bg-white/[0.03]'
                }`}
              >
                {/* Left: Rank + Trend + Artwork + Title/Artist */}
                <div className="col-span-7 sm:col-span-6 flex items-center gap-2.5 min-w-0 pr-2">
                  <span className={`w-7 text-center font-mono text-xs shrink-0 ${
                    rank <= 3 ? 'text-white font-bold' : 'text-zinc-400'
                  }`}>
                    {rank}
                  </span>

                  <div className="w-8 flex justify-center shrink-0">
                    <ChartMovementBadge
                      item={item}
                      currentRank={rank}
                      chartLimit={chartData.length}
                      currentDate={state.date}
                      variant="itunes"
                    />
                  </div>

                  <div className="relative shrink-0 group/cover">
                    <OfficialArtworkImg
                      artist={displayArtist.split(',')[0].trim()}
                      title={displayTitle}
                      explicitSrc={cover}
                      isAlbum={chartType === 'albums'}
                      isPlayer={item.isPlayer}
                      alt={displayTitle}
                      className="w-10 h-10 rounded object-cover border border-white/10"
                    />
                    {onPlaySong && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlaySong(displayTitle, displayArtist, cover);
                        }}
                        className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-black/80 hover:bg-[#0a84ff] text-white flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition cursor-pointer"
                        aria-label={`Play preview of ${displayTitle}`}
                      >
                        <i className="ph-fill ph-play text-[10px] ml-0.5"></i>
                      </button>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-medium text-xs sm:text-sm text-white group-hover:underline truncate leading-tight">
                        {displayTitle}
                      </h4>
                      {item.isPlayer && (
                        <span className="text-[9px] font-semibold text-[#409cff] shrink-0">
                          · You
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectArtist(displayArtist);
                      }}
                      className="text-[11px] text-zinc-400 hover:text-white truncate block text-left transition"
                    >
                      {displayArtist}
                    </button>
                  </div>
                </div>

                {/* Middle: Classic iTunes Popularity Bars (||||||) */}
                <div className="hidden sm:flex sm:col-span-2 items-center justify-center gap-[2px]" title={`Popularity: ${Math.round(ratio * 100)}%`}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
                    <span
                      key={bar}
                      className={`w-[3px] h-3 rounded-[1px] ${
                        bar <= activeBars ? 'bg-zinc-300' : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>

                {/* Daily Pure Sales */}
                <div className="hidden sm:flex sm:col-span-2 items-center justify-end pr-3">
                  <span className="text-xs font-mono text-zinc-300">
                    {formatNum(item.points || 0)}
                  </span>
                </div>

                {/* Right: Authentic iTunes Price Button */}
                <div className="col-span-5 sm:col-span-2 flex items-center justify-end">
                  <span
                    className={`px-2.5 py-1 rounded-[5px] text-xs font-semibold border transition ${
                      item.isPlayer
                        ? 'border-zinc-700 text-zinc-400 bg-zinc-900'
                        : 'border-[#0a84ff]/80 text-[#409cff] group-hover:bg-[#0a84ff] group-hover:text-white'
                    }`}
                  >
                    {item.isPlayer ? 'Purchased' : chartType === 'singles' ? '$1.29' : '$9.99'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {chartData.length === 0 && (
          <div className="text-center py-16">
            <p className="text-zinc-300 font-medium text-sm">No chart entries available for this storefront.</p>
            <p className="text-zinc-500 text-xs mt-1">Select Worldwide or another territory above.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ItunesChartsView;

