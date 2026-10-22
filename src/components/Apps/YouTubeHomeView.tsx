import React, { useState, useMemo } from 'react';
import { GameState, Song } from '../../types';
import { formatNum } from '../../constants';
import { OfficialMvThumbnailImg } from '../Common/OfficialMvThumbnailImg';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import {
  REAL_WORLD_NPCS,
  normalizeRealArtistName,
  normalizeRealTitle
} from '../../data/realWorldArtistCatalog';
import { isNpcMatchingPlayerName } from '../../data/npcPlayerDeduplicationEngine';
import { syncNpcRealisticReleaseWorkflow } from '../../data/npcRealisticReleaseWorkflowEngine';
import { resolveNpcMvReleaseDate } from './YouTubeArtistProfileView';

interface YouTubeHomeViewProps {
  state: GameState;
  playerVideos: Song[];
  chartData: any[];
  onSelectVideo: (video: Song) => void;
  onOpenCreateMv: () => void;
  onNavigateToCharts: () => void;
  onOpenChannel: (artistName: string, isPlayer: boolean) => void;
  getTimeAgo: (releaseDate: string | undefined, currentDate: string) => string;
}

type YouTubeFeedFilter = 'all' | 'mv' | 'trending' | 'new' | 'yours';

export const YouTubeHomeView: React.FC<YouTubeHomeViewProps> = ({
  state,
  playerVideos,
  chartData,
  onSelectVideo,
  onOpenCreateMv,
  onNavigateToCharts,
  onOpenChannel,
  getTimeAgo
}) => {
  const [feedFilter, setFeedFilter] = useState<YouTubeFeedFilter>('all');

  const playerName = state.artist?.name || 'Artist';

  // Build authentic global Music Video feed items from chartData + REAL_WORLD_NPCS
  const globalMusicVideos = useMemo(() => {
    syncNpcRealisticReleaseWorkflow(state.date);

    const items: Array<{
      id: string;
      songObj: Song;
      title: string;
      displayTitle: string;
      artist: string;
      views: number;
      dailyViews: number;
      releaseDate: string;
      duration: string;
      isPlayer: boolean;
      isVevo: boolean;
      cover?: string;
      rank?: number;
    }> = [];

    // 1. Player's released MVs
    playerVideos.forEach((v, idx) => {
      const cleanTitle = v.title;
      const disp = cleanTitle.includes('Official')
        ? cleanTitle
        : `${cleanTitle} (Official Music Video)`;
      items.push({
        id: `player_mv_${v.id}`,
        songObj: { ...v, isPlayer: true } as any,
        title: cleanTitle,
        displayTitle: disp,
        artist: playerName,
        views: v.views || 0,
        dailyViews:
          (v as any).dailyViews ||
          Math.max(500, Math.round((v.views || 1000) * 0.08)),
        releaseDate: v.releaseDate || state.date.split('T')[0],
        duration: `${3 + (idx % 2)}:${String(14 + ((idx * 19) % 42)).padStart(2, '0')}`,
        isPlayer: true,
        isVevo: v.mvDistributor === 'vevo',
        cover: v.mvThumbnail || v.cover
      });
    });

    // 2. Top Charting NPC Music Videos with accurate release dates
    chartData.slice(0, 22).forEach((c: any, idx: number) => {
      if (c.isPlayer) return;
      const npcArtist = normalizeRealArtistName(c.artist);
      if (isNpcMatchingPlayerName(npcArtist, playerName)) return;
      const cleanTitle = normalizeRealTitle(c.title, npcArtist, false);
      const disp = cleanTitle.includes('Official')
        ? cleanTitle
        : `${cleanTitle} (Official Music Video)`;

      const npcMatch = REAL_WORLD_NPCS.find(
        n => n.name.toLowerCase() === npcArtist.toLowerCase()
      );
      const songMatch =
        npcMatch?.songs?.find(
          s => s.title.toLowerCase() === cleanTitle.toLowerCase()
        ) ||
        npcMatch?.albums?.[0]?.tracks?.find(
          t => t.title.toLowerCase() === cleanTitle.toLowerCase()
        );

      const totalViews = songMatch?.streams
        ? Math.max(1_500_000, Math.round(songMatch.streams * 0.62))
        : Math.max(12_000_000, (c.points || 800_000) * 38);

      const relDate = resolveNpcMvReleaseDate(
        npcArtist,
        cleanTitle,
        state.date,
        songMatch?.daysSinceRelease,
        totalViews
      );

      const syntheticSong: any = {
        id: 70000 + idx,
        title: cleanTitle,
        artist: npcArtist,
        genre: npcMatch?.genre || 'Pop',
        quality: 92,
        streams: totalViews * 1.4,
        dailyStreams: c.points || 500000,
        sales: 0,
        views: totalViews,
        hasMV: true,
        status: 'released',
        releaseDate: relDate,
        cover: c.cover,
        mvDistributor: 'vevo',
        isPlayer: false
      };

      items.push({
        id: `npc_mv_${idx}_${npcArtist}`,
        songObj: syntheticSong,
        title: cleanTitle,
        displayTitle: disp,
        artist: npcArtist,
        views: totalViews,
        dailyViews: c.points || 500000,
        releaseDate: relDate,
        duration: `${3 + (idx % 2)}:${String(18 + ((idx * 23) % 39)).padStart(2, '0')}`,
        isPlayer: false,
        isVevo: true,
        cover: c.cover,
        rank: idx + 1
      });
    });

    return items;
  }, [playerVideos, chartData, playerName, state.date]);

  const displayedVideos = useMemo(() => {
    if (feedFilter === 'yours') {
      return globalMusicVideos.filter(v => v.isPlayer);
    }
    if (feedFilter === 'trending') {
      return [...globalMusicVideos].sort((a, b) => b.dailyViews - a.dailyViews);
    }
    if (feedFilter === 'mv') {
      return [...globalMusicVideos].sort((a, b) => b.views - a.views);
    }
    if (feedFilter === 'new') {
      return [...globalMusicVideos].sort(
        (a, b) =>
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
      );
    }
    return globalMusicVideos;
  }, [globalMusicVideos, feedFilter]);

  return (
    <div className="pb-24 bg-[#0F0F0F] text-[#F1F1F1] min-h-screen">
      {/* 1. AUTHENTIC YOUTUBE STICKY CATEGORY CHIPS BAR */}
      <div className="sticky top-[53px] z-20 bg-[#0F0F0F]/95 backdrop-blur-md px-3 py-2.5 border-b border-white/[0.08] flex items-center gap-2 overflow-x-auto hide-scrollbar">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'mv', label: 'Music Videos' },
            { id: 'trending', label: 'Trending' },
            { id: 'new', label: 'Recently uploaded' },
            ...(playerVideos.length > 0
              ? [{ id: 'yours' as const, label: `Your MVs (${playerVideos.length})` }]
              : [])
          ] as const
        ).map(chip => {
          const active = feedFilter === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setFeedFilter(chip.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                active
                  ? 'bg-[#F1F1F1] text-[#0F0F0F]'
                  : 'bg-[#272727] text-[#F1F1F1] hover:bg-[#3F3F3F]'
              }`}
            >
              {chip.label}
            </button>
          );
        })}

        <button
          onClick={onNavigateToCharts}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-[#272727] text-[#F1F1F1] hover:bg-[#3F3F3F] transition cursor-pointer shrink-0 flex items-center gap-1"
        >
          <i className="ph-fill ph-fire text-[#FF0000]"></i>
          <span>Music Charts</span>
        </button>
      </div>

      {/* 2. MAIN YOUTUBE HOME VIDEO FEED */}
      <section className="pt-3">
        {feedFilter === 'yours' && playerVideos.length === 0 ? (
          <div className="text-center py-14 px-6">
            <div className="w-14 h-14 rounded-full bg-[#272727] flex items-center justify-center mx-auto mb-3 text-[#AAAAAA]">
              <i className="ph ph-video-camera text-2xl"></i>
            </div>
            <h3 className="text-white font-bold text-base">
              No Music Videos Uploaded Yet
            </h3>
            <p className="text-[#AAAAAA] text-xs max-w-xs mx-auto mt-1 mb-4 leading-relaxed">
              Film and premiere an Official Music Video for your released songs
              to grow your YouTube subscribers and chart on YouTube Trending.
            </p>
            <button
              onClick={onOpenCreateMv}
              className="px-4 py-2 rounded-full bg-[#FF0000] hover:bg-[#D90000] text-white font-semibold text-xs transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <i className="ph-bold ph-plus"></i>
              <span>Produce Music Video</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {displayedVideos.map(vid => (
              <article
                key={vid.id}
                onClick={() => onSelectVideo(vid.songObj)}
                className="cursor-pointer group"
              >
                {/* 16:9 YouTube Video Thumbnail */}
                <div className="relative w-full aspect-video bg-[#1F1F1F] sm:rounded-xl overflow-hidden mb-3">
                  <OfficialMvThumbnailImg
                    artist={vid.artist}
                    title={vid.title}
                    isPlayer={vid.isPlayer}
                    explicitSrc={vid.isPlayer ? vid.cover : undefined}
                    alt={vid.displayTitle}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />

                  {/* VEVO Watermark */}
                  {vid.isVevo && (
                    <div className="absolute bottom-2.5 left-3 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm">
                      <span className="text-white font-black text-[11px] tracking-tight lowercase">
                        vevo
                      </span>
                    </div>
                  )}

                  {/* Trending Badge if Top 10 */}
                  {vid.rank && vid.rank <= 10 && (
                    <div className="absolute top-2.5 left-3 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md flex items-center gap-1 text-[10px] font-semibold text-white">
                      <i className="ph-fill ph-fire text-[#FF0000]"></i>
                      <span>#{vid.rank} on Trending for Music</span>
                    </div>
                  )}

                  {/* Player Badge */}
                  {vid.isPlayer && (
                    <div className="absolute top-2.5 left-3 px-2 py-0.5 rounded bg-[#FF0000] text-white text-[10px] font-bold uppercase tracking-wider">
                      Your Official MV
                    </div>
                  )}

                  {/* Duration Timestamp */}
                  <span className="absolute bottom-2 right-2.5 bg-black/85 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                    {vid.duration}
                  </span>
                </div>

                {/* Video Meta Row (Channel Avatar + Title + Channel Name / Views / Time) */}
                <div className="px-3.5 flex items-start gap-3">
                  <div
                    onClick={e => {
                      e.stopPropagation();
                      onOpenChannel(vid.artist, vid.isPlayer);
                    }}
                    title={`View ${vid.artist} channel`}
                    className="shrink-0 mt-0.5 cursor-pointer hover:opacity-85 transition"
                  >
                    <OfficialArtworkImg
                      artist={vid.artist}
                      isArtistPortrait={true}
                      isPlayer={vid.isPlayer}
                      explicitSrc={
                        vid.isPlayer
                          ? state.artist?.image || state.artist?.avatar
                          : undefined
                      }
                      alt={vid.artist}
                      className="w-9 h-9 rounded-full object-cover bg-[#272727]"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-[#F1F1F1] font-semibold text-sm sm:text-[15px] leading-snug line-clamp-2 group-hover:text-[#3EA6FF] transition">
                      {vid.displayTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-1 text-xs text-[#AAAAAA] mt-1">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onOpenChannel(vid.artist, vid.isPlayer);
                        }}
                        className="inline-flex items-center gap-1 text-[#AAAAAA] hover:text-white transition cursor-pointer"
                      >
                        <span>{vid.artist}</span>
                        <i
                          className="ph-fill ph-music-note-simple text-[10px] text-[#AAAAAA]"
                          title="Official Artist Channel"
                        ></i>
                      </button>
                      <span>•</span>
                      <span>{formatNum(vid.views)} views</span>
                      <span>•</span>
                      <span>{getTimeAgo(vid.releaseDate, state.date)}</span>
                    </div>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onSelectVideo(vid.songObj);
                    }}
                    className="text-[#AAAAAA] hover:text-white p-1 shrink-0"
                    aria-label="Video options"
                  >
                    <i className="ph ph-dots-three-vertical text-lg"></i>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default YouTubeHomeView;

