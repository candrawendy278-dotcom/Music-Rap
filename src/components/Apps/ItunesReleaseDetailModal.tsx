import React, { useMemo } from 'react';
import { Song, Project, GameState } from '../../types';
import { formatNum } from '../../constants';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { getAuthenticAlbumFullTracklist } from '../../data/npcAnnualReleaseCycleAndTracklistEngine';
import { REAL_WORLD_NPCS } from '../../data/realWorldArtistCatalog';

interface ItunesReleaseDetailModalProps {
  item: Song | Project | any;
  state: GameState;
  onClose: () => void;
  onPlaySong?: (title: string, artist: string, cover: string) => void;
  onSelectArtist?: (artistName: string) => void;
}

export const ItunesReleaseDetailModal: React.FC<ItunesReleaseDetailModalProps> = ({
  item,
  state,
  onClose,
  onPlaySong,
  onSelectArtist
}) => {
  const playerArtistName = state.artist?.name || 'Player Artist';
  const itemArtist = item?.artist || playerArtistName;
  const isPlayer =
    item?.isPlayer === true ||
    (!('isPlayer' in item) && (itemArtist === playerArtistName || itemArtist === 'You'));

  const isAlbum =
    item?.isAlbum === true ||
    ('songs' in item && Array.isArray((item as Project).songs)) ||
    ('tracks' in item && Array.isArray(item.tracks)) ||
    item?.type === 'album' ||
    item?.type === 'ep' ||
    item?.type === 'Album' ||
    item?.type === 'EP';

  // 1. Resolve live project or song from state when inspecting a Player release
  const liveProject = useMemo(() => {
    if (!isPlayer || !isAlbum) return null;
    return (
      state.projects.find(
        p => p.id === (item as Project).id || p.title.toLowerCase() === String(item.title || '').toLowerCase()
      ) || (item as Project)
    );
  }, [isPlayer, isAlbum, item, state.projects]);

  const liveSong = useMemo(() => {
    if (!isPlayer || isAlbum) return null;
    return (
      state.songs.find(
        s => s.id === (item as Song).id || s.title.toLowerCase() === String(item.title || '').toLowerCase()
      ) || (item as Song)
    );
  }, [isPlayer, isAlbum, item, state.songs]);

  // Resolve NPC data if inspecting an NPC release
  const npcMatch = useMemo(() => {
    if (isPlayer) return null;
    const target = String(itemArtist || '').trim().toLowerCase();
    return REAL_WORLD_NPCS.find(n => n.name.toLowerCase() === target) || null;
  }, [isPlayer, itemArtist]);

  const artistName = isPlayer ? playerArtistName : (npcMatch?.name || itemArtist);
  const title = (liveProject || liveSong)?.title || item?.title || 'Untitled Release';
  const cover = (liveProject || liveSong)?.cover || item?.cover || '';
  const genre =
    liveSong?.genre ||
    (liveProject as any)?.genre ||
    item?.genre ||
    npcMatch?.genre ||
    state.artist?.genre ||
    'Pop';
  const releaseDate = (liveProject || liveSong)?.releaseDate || item?.releaseDate || state.date.split('T')[0];
  const releaseYear = item?.year || new Date(releaseDate).getFullYear() || new Date(state.date).getFullYear();

  // 2. Build authentic iTunes Tracklist for BOTH Player and NPC releases (Albums & Singles)
  const tracklist = useMemo(() => {
    if (isPlayer) {
      if (isAlbum && liveProject && Array.isArray(liveProject.songs) && liveProject.songs.length > 0) {
        return liveProject.songs.map((ps, index) => {
          const liveTrack = state.songs.find(s => s.id === ps.id) || ps;
          const trackQual = liveTrack.quality || liveProject.quality || 68;
          const trackRating = Math.min(5.0, Math.max(2.2, Math.round((1.8 + (trackQual / 100) * 3.1) * 10) / 10));
          const isTopTrack = trackQual >= 78 || (liveTrack.streams || 0) > 50000 || index === 0;
          return {
            id: liveTrack.id || `p_trk_${index}`,
            number: index + 1,
            title: liveTrack.title,
            artist: artistName,
            quality: trackQual,
            rating: trackRating,
            isTopTrack,
            streams: liveTrack.streams || 0,
            sales: liveTrack.pureSales || 0,
            duration: `${2 + ((index * 37) % 2)}:${String(15 + ((index * 47) % 43)).padStart(2, '0')}`,
            price: '$1.29'
          };
        });
      }
      // Player Single (1-track release)
      const q = liveSong?.quality || 70;
      return [
        {
          id: liveSong?.id || 'p_single_1',
          number: 1,
          title,
          artist: artistName,
          quality: q,
          rating: Math.min(5.0, Math.max(2.2, Math.round((1.8 + (q / 100) * 3.1) * 10) / 10)),
          isTopTrack: true,
          streams: liveSong?.streams || 0,
          sales: liveSong?.pureSales || 0,
          duration: '3:18',
          price: '$1.29'
        }
      ];
    }

    // NPC Release
    if (isAlbum) {
      // Check if npcMatch has album tracks or use getAuthenticAlbumFullTracklist
      const npcAlb = npcMatch?.albums?.find(a => a.title.toLowerCase() === title.toLowerCase());
      const rawTracks =
        (npcAlb && Array.isArray((npcAlb as any).tracks) && (npcAlb as any).tracks.length > 0)
          ? (npcAlb as any).tracks
          : getAuthenticAlbumFullTracklist(artistName, title, npcMatch?.pop || 88, npcMatch?.songs || []);

      return rawTracks.map((trk: any, index: number) => {
        const trkTitle = typeof trk === 'string' ? trk : trk.title;
        const isHit = index === 0 || index === 2 || Boolean(trk.isLeadSingle);
        const estStreams = trk.streams || Math.max(250000, ((npcMatch?.pop || 82) * 850000) - index * 320000);
        const estSales = Math.round(estStreams / 420);
        const rating = isHit ? 4.8 : Math.max(3.9, Math.round((4.6 - (index % 5) * 0.12) * 10) / 10);
        return {
          id: `npc_trk_${index}`,
          number: index + 1,
          title: trkTitle,
          artist: artistName,
          quality: isHit ? 92 : 84,
          rating,
          isTopTrack: isHit,
          streams: estStreams,
          sales: estSales,
          duration: trk.duration || `${2 + ((index * 29) % 2)}:${String(12 + ((index * 41) % 45)).padStart(2, '0')}`,
          price: '$1.29'
        };
      });
    }

    // NPC Single (1-track single release)
    const npcSong = npcMatch?.songs?.find(s => s.title.toLowerCase() === title.toLowerCase());
    const singleSales = item?.pureSales || npcSong?.sales || 85000;
    const singleStreams = item?.streams || npcSong?.streams || singleSales * 450;
    return [
      {
        id: 'npc_single_1',
        number: 1,
        title,
        artist: artistName,
        quality: 90,
        rating: 4.8,
        isTopTrack: true,
        streams: singleStreams,
        sales: singleSales,
        duration: '3:14',
        price: '$1.29'
      }
    ];
  }, [isPlayer, isAlbum, liveProject, liveSong, state.songs, artistName, title, npcMatch, item]);

  const maxTrackStreams = useMemo(() => {
    return Math.max(1, ...tracklist.map((t: any) => t.streams || t.sales || 1));
  }, [tracklist]);

  // 3. Pure Sales & Total Streams
  const pureSales = useMemo(() => {
    if (isPlayer) {
      if (isAlbum && liveProject) {
        if (liveProject.pureSales && liveProject.pureSales > 0) return liveProject.pureSales;
        return tracklist.reduce((acc: number, t: any) => acc + (t.sales || 0), 0);
      }
      return liveSong?.pureSales || 0;
    }
    return item?.pureSales || tracklist.reduce((acc: number, t: any) => acc + (t.sales || 0), 0);
  }, [isPlayer, isAlbum, liveProject, liveSong, item, tracklist]);

  const totalStreams = useMemo(() => {
    if (isPlayer) {
      if (isAlbum && liveProject) {
        if (liveProject.totalStreams && liveProject.totalStreams > 0) return liveProject.totalStreams;
        return tracklist.reduce((acc: number, t: any) => acc + (t.streams || 0), 0);
      }
      return liveSong?.streams || 0;
    }
    return item?.streams || tracklist.reduce((acc: number, t: any) => acc + (t.streams || 0), 0);
  }, [isPlayer, isAlbum, liveProject, liveSong, item, tracklist]);

  // 4. Rating Calculation
  const masterQuality = useMemo(() => {
    if (isPlayer) {
      return (isAlbum ? liveProject?.quality : liveSong?.quality) || 68;
    }
    return Math.min(96, Math.max(76, npcMatch?.pop || 86));
  }, [isPlayer, isAlbum, liveProject, liveSong, npcMatch]);

  const ratingValue = useMemo(() => {
    const raw = 1.8 + (masterQuality / 100) * 3.1;
    return Math.min(5.0, Math.max(2.0, Math.round(raw * 10) / 10));
  }, [masterQuality]);

  const totalRatingsCount = useMemo(() => {
    const buyerRatings = Math.round(pureSales * 0.08);
    const streamRatings = Math.round(totalStreams / 5000);
    return Math.max(24, buyerRatings + streamRatings);
  }, [pureSales, totalStreams]);

  const ratingBreakdown = useMemo(() => {
    const normalized = Math.max(0, Math.min(1, (ratingValue - 1.8) / 3.2));
    const star5 = Math.round(Math.min(90, Math.max(8, normalized * 80 + 5)));
    const star4 = Math.round(Math.min(40, Math.max(10, (100 - star5) * 0.55)));
    const star3 = Math.round(Math.min(30, Math.max(4, (100 - star5 - star4) * 0.55)));
    const star2 = Math.round(Math.min(18, Math.max(1, (100 - star5 - star4 - star3) * 0.60)));
    const star1 = Math.max(1, 100 - star5 - star4 - star3 - star2);
    return { star5, star4, star3, star2, star1 };
  }, [ratingValue]);

  // 5. Chart Performance
  const chartPerformance = useMemo(() => {
    if (item?.currentRank) {
      return {
        currentRank: item.currentRank,
        peakPosition: item.peakPosition || item.currentRank,
        weeksOnChart: item.weeksOnChart || 1,
        isCurrentlyCharted: true
      };
    }

    const cleanTitle = title.trim().toLowerCase();
    const itunesKey = isAlbum ? 'albums_global' : 'daily_global';
    const itunesList = state.itunes?.charts?.[itunesKey] || [];
    const itunesRankIndex = itunesList.findIndex(
      c => c.title.trim().toLowerCase() === cleanTitle && c.artist.toLowerCase() === artistName.toLowerCase()
    );

    if (itunesRankIndex !== -1) {
      const rank = itunesRankIndex + 1;
      return {
        currentRank: rank,
        peakPosition: itunesList[itunesRankIndex].peakPosition || rank,
        weeksOnChart: itunesList[itunesRankIndex].weeksOnChart || 1,
        isCurrentlyCharted: true
      };
    }

    return {
      currentRank: null,
      peakPosition: item?.peakPosition || null,
      weeksOnChart: item?.weeksOnChart || 1,
      isCurrentlyCharted: false
    };
  }, [item, title, artistName, isAlbum, state.itunes?.charts]);

  // 6. Customer Reviews
  const fanReviews = useMemo(() => {
    return [
      {
        user: 'audiophile_mastering',
        rating: Math.min(5, Math.max(3, Math.round(ratingValue + 0.2))),
        title: masterQuality >= 80 ? 'Essential Mastered for iTunes release' : 'Solid production and vocal delivery',
        body: masterQuality >= 80
          ? `"${title}" by ${artistName} sounds phenomenal in 24-bit Apple Digital Master. Every instrument sits cleanly in the mix.`
          : `Really enjoying "${title}". Strong replay value and clean digital mastering throughout.`,
        date: '2 days ago',
        helpful: Math.max(14, Math.round(totalRatingsCount * 0.06))
      },
      {
        user: 'cupertino_crates',
        rating: Math.min(5, Math.max(3, Math.round(ratingValue))),
        title: isAlbum ? 'Zero skips from start to finish' : 'On repeat all week',
        body: isAlbum
          ? `Purchased the complete album on iTunes Store and it delivers from the opening track to the closer.`
          : `Instant purchase on iTunes Store. Easily one of ${artistName}'s best tracks in high-resolution lossless.`,
        date: '5 days ago',
        helpful: Math.max(9, Math.round(totalRatingsCount * 0.04))
      }
    ];
  }, [title, artistName, isAlbum, masterQuality, ratingValue, totalRatingsCount]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-[#121217] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden my-auto text-zinc-100 max-h-[92vh] flex flex-col font-sans">
        {/* Top Authentic iTunes Store Window Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08] bg-[#18181f] sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-zinc-400 min-w-0">
            <i className="ph-fill ph-apple-logo text-zinc-200 text-sm"></i>
            <span className="font-medium text-zinc-300">iTunes Store</span>
            <span aria-hidden="true" className="text-zinc-600">&rsaquo;</span>
            <button
              onClick={() => {
                if (onSelectArtist) onSelectArtist(artistName);
              }}
              className="hover:text-white truncate cursor-pointer transition"
            >
              {artistName}
            </button>
            <span aria-hidden="true" className="text-zinc-600">&rsaquo;</span>
            <span className="text-white font-medium truncate">{title}</span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close release details"
            className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer border border-white/[0.08] shrink-0"
          >
            <i className="ph ph-x text-xs"></i>
          </button>
        </div>

        {/* Classic 2-Column iTunes Store Album / Single Page Content */}
        <div className="overflow-y-auto p-5 sm:p-7 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-7 items-start">
            {/* LEFT COLUMN (4 COLS): ARTWORK, BUY BUTTON, RATINGS SUMMARY & COPYRIGHT */}
            <div className="md:col-span-4 space-y-4">
              <div className="relative aspect-square w-48 sm:w-full max-w-[240px] mx-auto md:mx-0 rounded-lg overflow-hidden border border-white/15 shadow-2xl bg-zinc-900">
                <OfficialArtworkImg
                  artist={artistName}
                  title={title}
                  isAlbum={isAlbum}
                  explicitSrc={isPlayer ? cover : undefined}
                  isPlayer={isPlayer}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Buy Action & Mastered for iTunes Badge */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    {isPlayer ? 'In Your Store Catalog' : isAlbum ? '$9.99' : '$1.29'}
                  </span>
                  <span
                    className={`px-3.5 py-1 rounded-[5px] text-xs font-semibold border ${
                      isPlayer
                        ? 'border-zinc-700 text-zinc-300 bg-zinc-900'
                        : 'border-[#0a84ff] bg-[#0a84ff] text-white shadow'
                    }`}
                  >
                    {isPlayer ? 'Purchased' : isAlbum ? 'Buy Album' : 'Buy Song'}
                  </span>
                </div>

                <div className="pt-2 border-t border-white/[0.07] text-[11px] text-zinc-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-[#0a84ff] font-medium">
                    <i className="ph-fill ph-seal-check text-xs"></i>
                    <span>Mastered for iTunes · 24-Bit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-amber-400 text-xs">
                      {[1, 2, 3, 4, 5].map(s => (
                        <i
                          key={s}
                          className={`ph-fill ph-star ${s <= Math.round(ratingValue) ? 'text-amber-400' : 'text-zinc-700'}`}
                        ></i>
                      ))}
                    </div>
                    <span className="font-mono text-zinc-300 font-semibold">{ratingValue}</span>
                    <span className="text-zinc-500">({formatNum(totalRatingsCount)} Ratings)</span>
                  </div>
                </div>

                {/* Release Metadata List (Authentic iTunes Left Rail) */}
                <div className="pt-2.5 border-t border-white/[0.07] text-[11px] text-zinc-400 space-y-1">
                  <p>
                    <span className="text-zinc-500">Genre:</span>{' '}
                    <span className="text-zinc-300">{genre}</span>
                  </p>
                  <p>
                    <span className="text-zinc-500">Released:</span>{' '}
                    <span className="text-zinc-300">{releaseDate}</span>
                  </p>
                  <p>
                    <span className="text-zinc-500">Format:</span>{' '}
                    <span className="text-zinc-300">{tracklist.length} {tracklist.length === 1 ? 'Song' : 'Songs'}, AAC &amp; Lossless</span>
                  </p>
                  <p>
                    <span className="text-zinc-500">Pure Sales:</span>{' '}
                    <span className="text-white font-mono font-semibold">{formatNum(pureSales)} units</span>
                  </p>
                  {chartPerformance.currentRank && (
                    <p>
                      <span className="text-zinc-500">iTunes Chart:</span>{' '}
                      <span className="text-[#0a84ff] font-mono font-semibold">#{chartPerformance.currentRank}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-zinc-500 pt-1">
                    ℗ {releaseYear} {artistName} Recordings under exclusive license to iTunes Store.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (8 COLS): TITLE, EDITORS' NOTE, TRACKLIST TABLE & CUSTOMER REVIEWS */}
            <div className="md:col-span-8 space-y-6">
              {/* Header */}
              <div className="pb-4 border-b border-white/[0.08]">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                  {title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm">
                  <button
                    onClick={() => onSelectArtist && onSelectArtist(artistName)}
                    className="text-[#0a84ff] hover:underline font-medium cursor-pointer"
                  >
                    {artistName}
                  </button>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span className="text-zinc-400 text-xs">{genre} · {releaseYear}</span>
                </div>

                <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                  <strong className="text-zinc-200 font-semibold">iTunes Store Editors’ Note:</strong>{' '}
                  {isAlbum
                    ? `Presented in 24-bit Apple Digital Master, "${title}" showcases ${artistName}’s full studio vision across ${tracklist.length} tracks.`
                    : `Engineered for high-efficiency digital playback, "${title}" is a standout single release in ${artistName}’s store catalog.`}
                </p>
              </div>

              {/* Authentic iTunes Tracklist Table */}
              <div>
                <div className="grid grid-cols-12 items-center px-3 py-2 bg-[#181820] border-y border-white/[0.08] text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <div className="col-span-7 sm:col-span-6 flex items-center gap-2.5">
                    <span className="w-6 text-center">#</span>
                    <span>Name</span>
                  </div>
                  <div className="hidden sm:flex sm:col-span-2 items-center justify-end pr-3">
                    <span>Time</span>
                  </div>
                  <div className="hidden sm:flex sm:col-span-2 items-center justify-center">
                    <span>Popularity</span>
                  </div>
                  <div className="col-span-5 sm:col-span-2 flex items-center justify-end">
                    <span>Price</span>
                  </div>
                </div>

                <div className="divide-y divide-white/[0.05] border-b border-white/[0.08]">
                  {tracklist.map((t: any, idx: number) => {
                    const ratio = Math.min(1, Math.max(0.2, (t.streams || t.sales || 1) / maxTrackStreams));
                    const bars = Math.max(1, Math.round(ratio * 8));
                    return (
                      <div
                        key={t.id || idx}
                        onClick={() => onPlaySong && onPlaySong(t.title, artistName, cover)}
                        className={`grid grid-cols-12 items-center px-3 py-2 text-xs transition cursor-pointer group ${
                          idx % 2 === 0 ? 'bg-[#121217] hover:bg-white/[0.04]' : 'bg-[#15151c] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="col-span-7 sm:col-span-6 flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="w-6 flex items-center justify-center shrink-0">
                            <span className="group-hover:hidden flex items-center justify-center text-zinc-500 font-mono text-[11px]">
                              {t.isTopTrack ? (
                                <i className="ph-fill ph-star text-[10px] text-zinc-400 mr-0.5" title="Popular Track"></i>
                              ) : null}
                              {t.number}
                            </span>
                            <i className="ph-fill ph-play text-xs text-[#0a84ff] hidden group-hover:inline"></i>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white truncate">{t.title}</p>
                            <p className="text-[11px] text-zinc-500 truncate sm:hidden">{artistName}</p>
                          </div>
                        </div>

                        <div className="hidden sm:flex sm:col-span-2 items-center justify-end pr-3 font-mono text-zinc-400 text-[11px]">
                          {t.duration}
                        </div>

                        {/* Classic iTunes 8-bar Popularity Meter */}
                        <div className="hidden sm:flex sm:col-span-2 items-center justify-center gap-[2px]">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((b) => (
                            <span
                              key={b}
                              className={`w-[3px] h-2.5 rounded-[1px] ${
                                b <= bars ? 'bg-zinc-300' : 'bg-zinc-800'
                              }`}
                            />
                          ))}
                        </div>

                        <div className="col-span-5 sm:col-span-2 flex items-center justify-end">
                          <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border ${
                            isPlayer
                              ? 'border-zinc-700 text-zinc-400 bg-zinc-900'
                              : 'border-[#0a84ff]/80 text-[#409cff] group-hover:bg-[#0a84ff] group-hover:text-white'
                          }`}>
                            {isPlayer ? 'Purchased' : t.price}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer Ratings & Reviews Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-2">
                  <h3 className="text-sm font-semibold text-white">
                    Customer Ratings &amp; Reviews
                  </h3>
                  <span className="text-xs text-zinc-400">
                    {formatNum(totalRatingsCount)} Verified Store Ratings
                  </span>
                </div>

                {/* Rating Histogram */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-[#15151c] p-4 rounded-xl border border-white/[0.06]">
                  <div className="sm:col-span-4 text-center sm:text-left">
                    <div className="text-3xl font-bold font-mono text-white leading-none">
                      {ratingValue} <span className="text-sm font-normal text-zinc-400">out of 5</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start text-amber-400 text-xs mt-1.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <i
                          key={s}
                          className={`ph-fill ph-star ${s <= Math.round(ratingValue) ? 'text-amber-400' : 'text-zinc-700'}`}
                        ></i>
                      ))}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Pure Downloads: <strong className="text-white font-mono">{formatNum(pureSales)}</strong>
                    </p>
                  </div>

                  <div className="sm:col-span-8 space-y-1">
                    {[
                      { stars: 5, pct: ratingBreakdown.star5 },
                      { stars: 4, pct: ratingBreakdown.star4 },
                      { stars: 3, pct: ratingBreakdown.star3 },
                      { stars: 2, pct: ratingBreakdown.star2 },
                      { stars: 1, pct: ratingBreakdown.star1 }
                    ].map(row => (
                      <div key={row.stars} className="flex items-center gap-2.5 text-[11px]">
                        <span className="w-8 text-right text-zinc-400 font-mono">{row.stars} ★</span>
                        <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${row.pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-zinc-500 font-mono">{row.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Review Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fanReviews.map((rev, index) => (
                    <div
                      key={index}
                      className="bg-[#15151c] border border-white/[0.06] rounded-xl p-3.5 flex flex-col justify-between space-y-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex text-amber-400 text-[11px]">
                            {[1, 2, 3, 4, 5].map(s => (
                              <i
                                key={s}
                                className={`ph-fill ph-star ${s <= rev.rating ? 'text-amber-400' : 'text-zinc-700'}`}
                              ></i>
                            ))}
                          </div>
                          <span className="text-[10px] text-zinc-500">{rev.date}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-white">{rev.title}</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">{rev.body}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[10px] text-zinc-500">
                        <span>by {rev.user}</span>
                        <span>{rev.helpful} found helpful</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

