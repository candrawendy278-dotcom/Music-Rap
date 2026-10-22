import React, { useState, useMemo } from 'react';
import { GameState, Song } from '../../types';
import { formatNum, formatNumFull, COUNTRY_NAMES } from '../../constants';
import { OfficialMvThumbnailImg } from '../Common/OfficialMvThumbnailImg';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import {
  REAL_WORLD_NPCS,
  normalizeRealArtistName,
  normalizeRealTitle
} from '../../data/realWorldArtistCatalog';
import { syncNpcRealisticReleaseWorkflow } from '../../data/npcRealisticReleaseWorkflowEngine';

export interface YouTubeChannelTarget {
  isPlayer: boolean;
  artistName: string;
}

/**
 * Resolves an authentic, deterministic release date (YYYY-MM-DD) for an NPC Music Video
 * so NPC MVs never erroneously display "Just now" when they already have views/chart history.
 */
export function resolveNpcMvReleaseDate(
  artistName: string,
  songTitle: string,
  currentDateIso: string,
  explicitDaysSinceRelease?: number,
  estimatedViews?: number
): string {
  const currDate = new Date(currentDateIso);
  const safeBaseMs = Number.isNaN(currDate.getTime())
    ? new Date('2026-01-01T00:00:00Z').getTime()
    : currDate.getTime();

  // Deterministic hash from artist + song title
  const key = `${artistName.toLowerCase().trim()}::${songTitle.toLowerCase().trim()}`;
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const absHash = Math.abs(hash >>> 0);

  let daysAgo = explicitDaysSinceRelease;

  if (daysAgo === undefined) {
    syncNpcRealisticReleaseWorkflow(currentDateIso);
    const cleanArtist = normalizeRealArtistName(artistName);
    const cleanTitle = normalizeRealTitle(songTitle, cleanArtist, false);
    const npc = REAL_WORLD_NPCS.find(
      n => n.name.toLowerCase() === cleanArtist.toLowerCase()
    );
    const foundSong =
      npc?.songs?.find(s => s.title.toLowerCase() === cleanTitle.toLowerCase()) ||
      npc?.albums?.[0]?.tracks?.find(
        t => t.title.toLowerCase() === cleanTitle.toLowerCase()
      );
    if (foundSong && typeof foundSong.daysSinceRelease === 'number') {
      daysAgo = foundSong.daysSinceRelease;
    }
  }

  // If daysAgo is still undefined or 0 (e.g., on Jan 1 game start or catalog hit with millions of views),
  // compute a realistic staggered age so NPC MVs never say "Just now".
  if (!daysAgo || daysAgo <= 0) {
    if (estimatedViews && estimatedViews > 150_000_000) {
      daysAgo = 45 + (absHash % 240); // 1.5 to 9 months ago for massive hits
    } else if (estimatedViews && estimatedViews > 25_000_000) {
      daysAgo = 14 + (absHash % 75); // 2 weeks to 3 months ago
    } else {
      daysAgo = 3 + (absHash % 25); // 3 days to 4 weeks ago for fresh releases
    }
  }

  const releaseMs = safeBaseMs - daysAgo * 24 * 60 * 60 * 1000;
  return new Date(releaseMs).toISOString().split('T')[0];
}

interface YouTubeArtistProfileViewProps {
  state: GameState;
  channelTarget: YouTubeChannelTarget;
  playerVideos: Song[];
  chartData: any[];
  onSelectVideo: (video: Song) => void;
  onOpenCreateMv: () => void;
  onSwitchToPlayerChannel: () => void;
  getTimeAgo: (releaseDate: string | undefined, currentDate: string) => string;
}

type ChannelTab = 'home' | 'videos' | 'releases' | 'about';
type VideoSort = 'latest' | 'popular' | 'oldest';

export const YouTubeArtistProfileView: React.FC<YouTubeArtistProfileViewProps> = ({
  state,
  channelTarget,
  playerVideos,
  chartData,
  onSelectVideo,
  onOpenCreateMv,
  onSwitchToPlayerChannel,
  getTimeAgo
}) => {
  const [channelTab, setChannelTab] = useState<ChannelTab>('videos');
  const [videoSort, setVideoSort] = useState<VideoSort>('latest');
  const [isSubscribed, setIsSubscribed] = useState(true);

  const isPlayer = channelTarget.isPlayer;
  const artistName = isPlayer
    ? state.artist?.name || 'Artist'
    : normalizeRealArtistName(channelTarget.artistName);

  const artistHandle = `@${artistName.toLowerCase().replace(/[^a-z0-9]/g, '')}official`;

  // Resolve NPC data if viewing an NPC's Official Artist Channel
  const npcData = useMemo(() => {
    if (isPlayer) return null;
    syncNpcRealisticReleaseWorkflow(state.date);
    return (
      REAL_WORLD_NPCS.find(
        n => n.name.toLowerCase() === artistName.toLowerCase()
      ) || null
    );
  }, [isPlayer, artistName, state.date]);

  // Build channel's video catalog
  const channelVideos = useMemo(() => {
    if (isPlayer) {
      return playerVideos.map((v, idx) => ({
        id: `player_ch_${v.id}`,
        songObj: { ...v, isPlayer: true } as Song,
        title: v.title,
        displayTitle: v.title.includes('Official')
          ? v.title
          : `${v.title} (Official Music Video)`,
        views: v.views || 0,
        dailyViews:
          v.dailyViews || Math.max(250, Math.round((v.views || 500) * 0.06)),
        releaseDate: v.releaseDate || state.date.split('T')[0],
        duration: `${3 + (idx % 2)}:${String(15 + ((idx * 17) % 42)).padStart(2, '0')}`,
        isVevo: v.mvDistributor === 'vevo',
        cover: v.mvThumbnail || v.cover
      }));
    }

    // NPC Channel Videos
    const npcSongs = npcData?.songs || [];
    const seen = new Set<string>();
    const list: Array<{
      id: string;
      songObj: Song;
      title: string;
      displayTitle: string;
      views: number;
      dailyViews: number;
      releaseDate: string;
      duration: string;
      isVevo: boolean;
      cover?: string;
    }> = [];

    npcSongs.forEach((s, idx) => {
      const cleanTitle = normalizeRealTitle(s.title, artistName, false);
      const normKey = cleanTitle.toLowerCase();
      if (seen.has(normKey)) return;
      seen.add(normKey);

      const mvViews = Math.max(
        1_200_000,
        Math.round((s.streams || 15_000_000) * 0.64)
      );
      const dailyViews = Math.max(
        45_000,
        Math.round((s.dailyStreams || 250_000) * 0.58)
      );
      const relDate = resolveNpcMvReleaseDate(
        artistName,
        cleanTitle,
        state.date,
        s.daysSinceRelease,
        mvViews
      );

      const syntheticSong: any = {
        id: 85000 + idx,
        title: cleanTitle,
        artist: artistName,
        genre: npcData?.genre || 'Pop',
        quality: 92,
        streams: s.streams || mvViews * 1.5,
        dailyStreams: s.dailyStreams || dailyViews * 1.5,
        sales: s.sales || 0,
        views: mvViews,
        dailyViews,
        hasMV: true,
        status: 'released',
        releaseDate: relDate,
        cover: s.cover,
        mvDistributor: 'vevo',
        isPlayer: false
      };

      list.push({
        id: `npc_ch_${idx}_${cleanTitle}`,
        songObj: syntheticSong,
        title: cleanTitle,
        displayTitle: cleanTitle.includes('Official')
          ? cleanTitle
          : `${cleanTitle} (Official Music Video)`,
        views: mvViews,
        dailyViews,
        releaseDate: relDate,
        duration: `${3 + (idx % 2)}:${String(14 + ((idx * 23) % 43)).padStart(2, '0')}`,
        isVevo: true,
        cover: s.cover
      });
    });

    // Also include any chart entries by this artist if not already in list
    chartData.forEach((c, idx) => {
      if (c.isPlayer) return;
      const cArtist = normalizeRealArtistName(c.artist);
      if (cArtist.toLowerCase() !== artistName.toLowerCase()) return;
      const cleanTitle = normalizeRealTitle(c.title, artistName, false);
      if (seen.has(cleanTitle.toLowerCase())) return;
      seen.add(cleanTitle.toLowerCase());

      const mvViews = Math.max(15_000_000, (c.points || 500_000) * 34);
      const relDate = resolveNpcMvReleaseDate(
        artistName,
        cleanTitle,
        state.date,
        undefined,
        mvViews
      );

      const syntheticSong: any = {
        id: 86000 + idx,
        title: cleanTitle,
        artist: artistName,
        genre: npcData?.genre || 'Pop',
        quality: 92,
        streams: mvViews * 1.4,
        dailyStreams: c.points || 400_000,
        sales: 0,
        views: mvViews,
        dailyViews: c.points || 400_000,
        hasMV: true,
        status: 'released',
        releaseDate: relDate,
        cover: c.cover,
        mvDistributor: 'vevo',
        isPlayer: false
      };

      list.push({
        id: `npc_chart_ch_${idx}`,
        songObj: syntheticSong,
        title: cleanTitle,
        displayTitle: `${cleanTitle} (Official Music Video)`,
        views: mvViews,
        dailyViews: c.points || 400_000,
        releaseDate: relDate,
        duration: `3:${String(22 + ((idx * 13) % 35)).padStart(2, '0')}`,
        isVevo: true,
        cover: c.cover
      });
    });

    return list;
  }, [isPlayer, playerVideos, npcData, artistName, chartData, state.date]);

  const sortedVideos = useMemo(() => {
    const copy = [...channelVideos];
    if (videoSort === 'popular') {
      return copy.sort((a, b) => b.views - a.views);
    }
    if (videoSort === 'oldest') {
      return copy.sort(
        (a, b) =>
          new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
      );
    }
    return copy.sort(
      (a, b) =>
        new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );
  }, [channelVideos, videoSort]);

  const totalViews = useMemo(() => {
    return channelVideos.reduce((sum, v) => sum + (v.views || 0), 0);
  }, [channelVideos]);

  const subscriberCount = useMemo(() => {
    if (isPlayer) return state.youtube?.subs || 0;
    const pop = npcData?.pop || 82;
    return Math.max(
      1_800_000,
      Math.round(pop * 380_000 + totalViews * 0.018)
    );
  }, [isPlayer, state.youtube?.subs, npcData, totalViews]);

  const channelReleases = useMemo(() => {
    if (isPlayer) {
      return state.projects
        .filter(p => p.status === 'released')
        .map(p => ({
          id: `proj_${p.id}`,
          title: p.title,
          type: p.type === 'album' ? 'Album' : p.type === 'ep' ? 'EP' : 'Single',
          year: p.releaseDate
            ? new Date(p.releaseDate).getFullYear()
            : new Date(state.date).getFullYear(),
          trackCount: p.songs?.length || 1,
          cover: p.cover
        }));
    }
    return (npcData?.albums || []).map((a, idx) => ({
      id: `npc_alb_${idx}`,
      title: a.title,
      type: 'Album',
      year: a.year || new Date(state.date).getFullYear(),
      trackCount: a.tracks?.length || 12,
      cover: a.cover
    }));
  }, [isPlayer, state.projects, state.date, npcData]);

  const featuredVideo = useMemo(() => {
    if (channelVideos.length === 0) return null;
    return [...channelVideos].sort((a, b) => b.views - a.views)[0];
  }, [channelVideos]);

  const artistCountryCode = isPlayer
    ? state.artist?.country || 'US'
    : npcData?.country || 'US';
  const artistCountryName =
    COUNTRY_NAMES[artistCountryCode] || artistCountryCode;

  return (
    <div className="pb-24 min-h-screen bg-[#0F0F0F] text-[#F1F1F1]">
      {/* If viewing NPC channel, top bar to jump back to Player's own channel */}
      {!isPlayer && (
        <div className="bg-[#181818] px-3.5 py-2 border-b border-white/[0.08] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#AAAAAA]">
            <i className="ph-fill ph-music-note text-[#FF0000]"></i>
            <span>Viewing Artist Channel</span>
          </div>
          <button
            onClick={onSwitchToPlayerChannel}
            className="text-[#3EA6FF] font-semibold hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Switch to Your Channel</span>
            <i className="ph-bold ph-arrow-right text-[10px]"></i>
          </button>
        </div>
      )}

      {/* 1. YOUTUBE OFFICIAL ARTIST CHANNEL BANNER */}
      <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-[#181818]">
        {featuredVideo ? (
          <OfficialMvThumbnailImg
            artist={artistName}
            title={featuredVideo.title}
            isPlayer={isPlayer}
            explicitSrc={isPlayer ? featuredVideo.cover : undefined}
            alt={artistName}
            className="w-full h-full object-cover opacity-55 scale-105 blur-[2px]"
          />
        ) : (
          <OfficialArtworkImg
            artist={artistName}
            explicitSrc={
              isPlayer ? state.artist?.image || state.artist?.avatar : undefined
            }
            isArtistPortrait={true}
            isPlayer={isPlayer}
            alt={artistName}
            className="w-full h-full object-cover opacity-45 blur-[4px] scale-110"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-black/35 to-black/10" />
        <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] font-semibold text-zinc-200">
          <i className="ph-fill ph-music-note text-[#FF0000]"></i>
          <span>Official Artist Channel</span>
        </div>
      </div>

      {/* 2. CHANNEL AVATAR, HANDLE, SUBSCRIBERS & SUBSCRIBE / STUDIO CTA */}
      <div className="px-4 pb-3 -mt-7 relative z-10">
        <div className="flex items-end justify-between gap-3">
          <OfficialArtworkImg
            artist={artistName}
            explicitSrc={
              isPlayer ? state.artist?.image || state.artist?.avatar : undefined
            }
            isArtistPortrait={true}
            isPlayer={isPlayer}
            alt={artistName}
            className="w-20 h-20 rounded-full object-cover border-[3px] border-[#0F0F0F] bg-[#272727] shadow-2xl shrink-0"
          />

          {isPlayer ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenCreateMv}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-[#FF0000] hover:bg-[#D90000] text-white transition cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <i className="ph-bold ph-video-camera"></i>
                <span>Produce MV</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSubscribed(prev => !prev)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                isSubscribed
                  ? 'bg-[#272727] text-[#F1F1F1] hover:bg-[#3F3F3F]'
                  : 'bg-[#F1F1F1] text-[#0F0F0F] hover:bg-zinc-200'
              }`}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
              {artistName}
            </h1>
            <i
              className="ph-fill ph-music-note-simple text-xs text-[#AAAAAA]"
              title="Official Artist Channel"
            ></i>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#AAAAAA] mt-1">
            <span className="text-zinc-300 font-medium">{artistHandle}</span>
            <span>•</span>
            <span>{formatNum(subscriberCount)} subscribers</span>
            <span>•</span>
            <span>{channelVideos.length} videos</span>
          </div>

          <p
            onClick={() => setChannelTab('about')}
            className="text-xs text-[#AAAAAA] mt-2 line-clamp-1 cursor-pointer hover:text-zinc-200"
          >
            Official YouTube Artist Channel of {artistName}. {formatNumFull(totalViews)} total video views
            <span className="text-white font-semibold ml-1">...more</span>
          </p>
        </div>
      </div>

      {/* 3. YOUTUBE CHANNEL NAVIGATION TABS */}
      <div className="sticky top-[53px] z-20 bg-[#0F0F0F]/95 backdrop-blur-md border-b border-white/[0.1] px-4 flex items-center gap-6 overflow-x-auto hide-scrollbar">
        {([
          { id: 'home', label: 'Home' },
          { id: 'videos', label: `Videos (${channelVideos.length})` },
          { id: 'releases', label: 'Releases' },
          { id: 'about', label: 'About' }
        ] as const).map(tab => {
          const active = channelTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setChannelTab(tab.id)}
              className={`py-3 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition cursor-pointer ${
                active
                  ? 'border-white text-white'
                  : 'border-transparent text-[#AAAAAA] hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENT */}
      <div className="p-4">
        {/* HOME TAB */}
        {channelTab === 'home' && (
          <div className="space-y-6">
            {/* Featured Video Spotlight */}
            {featuredVideo ? (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-sm font-bold text-white">Featured Music Video</h3>
                  <span className="text-[11px] text-[#AAAAAA]">Most Viewed Official MV</span>
                </div>
                <div
                  onClick={() => onSelectVideo(featuredVideo.songObj)}
                  className="cursor-pointer group rounded-xl overflow-hidden bg-[#181818] border border-white/[0.08]"
                >
                  <div className="relative w-full aspect-video bg-[#272727] overflow-hidden">
                    <OfficialMvThumbnailImg
                      artist={artistName}
                      title={featuredVideo.title}
                      isPlayer={isPlayer}
                      explicitSrc={isPlayer ? featuredVideo.cover : undefined}
                      alt={featuredVideo.displayTitle}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300"
                    />
                    {featuredVideo.isVevo && (
                      <div className="absolute bottom-2.5 left-3 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm">
                        <span className="text-white font-black text-[11px] tracking-tight lowercase">
                          vevo
                        </span>
                      </div>
                    )}
                    <span className="absolute bottom-2.5 right-2.5 bg-black/85 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                      {featuredVideo.duration}
                    </span>
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-bold text-white group-hover:text-[#3EA6FF] transition line-clamp-2">
                      {featuredVideo.displayTitle}
                    </h4>
                    <p className="text-xs text-[#AAAAAA] mt-1">
                      {formatNumFull(featuredVideo.views)} views •{' '}
                      {getTimeAgo(featuredVideo.releaseDate, state.date)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 px-4 bg-[#181818] rounded-2xl border border-white/[0.06]">
                <i className="ph ph-video-camera text-3xl text-[#AAAAAA] mb-2 block"></i>
                <h3 className="text-sm font-bold text-white">No Music Videos Yet</h3>
                <p className="text-xs text-[#AAAAAA] mt-1 mb-4">
                  Produce and premiere an official music video to showcase it on your channel.
                </p>
                {isPlayer && (
                  <button
                    onClick={onOpenCreateMv}
                    className="px-4 py-2 rounded-full bg-[#FF0000] text-white text-xs font-semibold cursor-pointer"
                  >
                    Produce Music Video
                  </button>
                )}
              </div>
            )}

            {/* Popular Uploads List */}
            {channelVideos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white">Popular Music Videos</h3>
                  <button
                    onClick={() => setChannelTab('videos')}
                    className="text-xs font-semibold text-[#3EA6FF] hover:underline cursor-pointer"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {channelVideos.slice(0, 5).map(v => (
                    <div
                      key={v.id}
                      onClick={() => onSelectVideo(v.songObj)}
                      className="flex gap-3 cursor-pointer group"
                    >
                      <div className="relative w-36 aspect-video rounded-lg overflow-hidden bg-[#272727] shrink-0 border border-white/[0.06]">
                        <OfficialMvThumbnailImg
                          artist={artistName}
                          title={v.title}
                          isPlayer={isPlayer}
                          explicitSrc={isPlayer ? v.cover : undefined}
                          alt={v.displayTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[10px] font-medium px-1 rounded">
                          {v.duration}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-[#3EA6FF] transition">
                          {v.displayTitle}
                        </h4>
                        <p className="text-[11px] text-[#AAAAAA] mt-1">
                          {formatNum(v.views)} views • {getTimeAgo(v.releaseDate, state.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIDEOS TAB */}
        {channelTab === 'videos' && (
          <div>
            {/* Sort Filter Pills (Latest / Popular / Oldest) */}
            <div className="flex items-center gap-2 mb-4">
              {([
                { id: 'latest', label: 'Latest' },
                { id: 'popular', label: 'Popular' },
                { id: 'oldest', label: 'Oldest' }
              ] as const).map(s => (
                <button
                  key={s.id}
                  onClick={() => setVideoSort(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    videoSort === s.id
                      ? 'bg-[#F1F1F1] text-[#0F0F0F]'
                      : 'bg-[#272727] text-[#F1F1F1] hover:bg-[#3F3F3F]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {sortedVideos.length === 0 ? (
              <div className="text-center py-12 px-4">
                <i className="ph ph-film-strip text-3xl text-[#AAAAAA] mb-2 block"></i>
                <p className="text-sm font-bold text-white">No Videos Uploaded</p>
                <p className="text-xs text-[#AAAAAA] mt-1">
                  When {artistName} premieres official music videos, they will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedVideos.map(v => (
                  <div
                    key={v.id}
                    onClick={() => onSelectVideo(v.songObj)}
                    className="cursor-pointer group"
                  >
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#272727] mb-2.5 border border-white/[0.06]">
                      <OfficialMvThumbnailImg
                        artist={artistName}
                        title={v.title}
                        isPlayer={isPlayer}
                        explicitSrc={isPlayer ? v.cover : undefined}
                        alt={v.displayTitle}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300"
                      />
                      {v.isVevo && (
                        <div className="absolute bottom-2.5 left-3 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm">
                          <span className="text-white font-black text-[11px] tracking-tight lowercase">
                            vevo
                          </span>
                        </div>
                      )}
                      <span className="absolute bottom-2 right-2.5 bg-black/85 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                        {v.duration}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2 px-1">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-[#3EA6FF] transition">
                          {v.displayTitle}
                        </h4>
                        <p className="text-xs text-[#AAAAAA] mt-1">
                          {formatNum(v.views)} views • {getTimeAgo(v.releaseDate, state.date)}
                        </p>
                      </div>
                      <i className="ph ph-dots-three-vertical text-[#AAAAAA] text-lg shrink-0 mt-0.5"></i>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RELEASES TAB */}
        {channelTab === 'releases' && (
          <div>
            <h3 className="text-sm font-bold text-white mb-3">
              Albums &amp; Official Releases
            </h3>
            {channelReleases.length === 0 ? (
              <p className="text-xs text-[#AAAAAA] py-8 text-center">
                No studio albums or EPs released on YouTube Music yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3.5">
                {channelReleases.map(rel => (
                  <div
                    key={rel.id}
                    className="bg-[#181818] border border-white/[0.06] rounded-xl p-2.5"
                  >
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#272727] mb-2">
                      <OfficialArtworkImg
                        artist={artistName}
                        title={rel.title}
                        isAlbum={true}
                        isPlayer={isPlayer}
                        explicitSrc={isPlayer ? rel.cover : undefined}
                        alt={rel.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="text-xs font-bold text-white truncate">
                      {rel.title}
                    </h4>
                    <p className="text-[11px] text-[#AAAAAA] mt-0.5">
                      {rel.type} • {rel.year} • {rel.trackCount} tracks
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABOUT TAB */}
        {channelTab === 'about' && (
          <div className="space-y-4">
            <div className="bg-[#181818] border border-white/[0.08] rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-2">Description</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {isPlayer
                  ? `Welcome to the Official Artist Channel of ${artistName}. Subscribe for official music videos, live performances, behind-the-scenes premieres, and studio album visuals.`
                  : npcData?.bio ||
                    `Official YouTube Artist Channel for ${artistName}. Explore official VEVO music videos, global chart hits, and studio releases.`}
              </p>
            </div>

            <div className="bg-[#181818] border border-white/[0.08] rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-white mb-1">Channel Details</h3>

              <div className="flex items-center gap-3 text-xs text-zinc-300">
                <i className="ph ph-globe text-base text-[#AAAAAA] w-5 text-center"></i>
                <span>www.youtube.com/{artistHandle}</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-300">
                <i className="ph ph-users text-base text-[#AAAAAA] w-5 text-center"></i>
                <span>{formatNumFull(subscriberCount)} subscribers</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-300">
                <i className="ph ph-video-camera text-base text-[#AAAAAA] w-5 text-center"></i>
                <span>{channelVideos.length} videos</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-300">
                <i className="ph ph-trend-up text-base text-[#AAAAAA] w-5 text-center"></i>
                <span>{formatNumFull(totalViews)} views</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-300">
                <i className="ph ph-map-pin text-base text-[#AAAAAA] w-5 text-center"></i>
                <span>{artistCountryName}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeArtistProfileView;
