import React, { useMemo } from 'react';
import { GameState } from '../../types';
import { formatNum, formatNumFull, COUNTRY_NAMES, NPCS } from '../../constants';
import { getTrackCoverArt, DETAILED_NPCS, DetailedNPC } from '../../data/npcAssets';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { REAL_WORLD_NPCS } from '../../data/realWorldArtistCatalog';
import {
  getCollaborationsForNpcArtist,
  resolveSongMetadataAndCollabCredits
} from '../../data/spotifyTrackMetadataAndCollabEngine';

interface ItunesArtistProfileViewProps {
  state: GameState;
  artistName: string;
  onSelectArtist: (name: string) => void;
  onPlaySong?: (title: string, artist: string, cover: string) => void;
  onSelectRelease?: (item: any) => void;
}

export const ItunesArtistProfileView: React.FC<ItunesArtistProfileViewProps> = ({
  state,
  artistName,
  onSelectArtist,
  onPlaySong,
  onSelectRelease
}) => {
  const isPlayer = !artistName || artistName === state.artist?.name || artistName === 'Player Artist' || artistName === 'You';
  const effectiveArtistName = isPlayer ? (state.artist?.name || 'Player Artist') : artistName;

  // Find NPC data from REAL_WORLD_NPCS (155 synced NPCs) or fallback to DETAILED_NPCS / NPCS
  const npcData: DetailedNPC | undefined = useMemo(() => {
    if (isPlayer) return undefined;
    const target = artistName.trim().toLowerCase();
    return (
      (REAL_WORLD_NPCS.find(n => n.name.toLowerCase() === target) as any) ||
      DETAILED_NPCS.find(n => n.name.toLowerCase() === target) ||
      (NPCS.find(n => n.name.toLowerCase() === target) as any)
    );
  }, [isPlayer, artistName, state.date]);

  const playerReleasedSongs = useMemo(() => {
    return state.songs.filter(s => s.status === 'released');
  }, [state.songs]);

  const playerReleasedProjects = useMemo(() => {
    return state.projects.filter(p => p.status === 'released');
  }, [state.projects]);

  const gameYear = String(new Date(state.date).getFullYear());

  // Aggregate releases for current profile (including bilateral collaborations!)
  const releases = useMemo(() => {
    if (isPlayer) {
      const songs = playerReleasedSongs.map(s => {
        const meta = resolveSongMetadataAndCollabCredits(s, effectiveArtistName, state);
        return {
          id: `song_${s.id}`,
          title: meta.cleanTitle,
          artist: meta.formattedArtistCredits,
          cover: s.cover,
          type: 'Single',
          sales: s.pureSales || 0,
          streams: s.streams || 0,
          releaseDate: s.releaseDate || state.date.split('T')[0],
          genre: s.genre || 'Pop',
          year: s.releaseDate ? s.releaseDate.split('-')[0] : gameYear,
          isAlbum: false,
          isPlayer: true,
          rawItem: s
        };
      });

      const projs = playerReleasedProjects.map(p => ({
        id: `proj_${p.id}`,
        title: p.title,
        artist: effectiveArtistName,
        cover: p.cover,
        type: p.type === 'ep' ? 'EP' : 'Album',
        sales: p.pureSales || 0,
        streams: p.totalStreams || 0,
        releaseDate: p.releaseDate || state.date.split('T')[0],
        genre: (state.artist as any)?.genre || 'Pop',
        year: p.releaseDate ? p.releaseDate.split('-')[0] : gameYear,
        isAlbum: true,
        isPlayer: true,
        rawItem: p
      }));

      return [...songs, ...projs].sort((a, b) => b.sales - a.sales);
    } else {
      const npcSongs = (npcData?.songs || []).map((t: any, idx: number) => {
        const meta = resolveSongMetadataAndCollabCredits(t, effectiveArtistName, state);
        const songTitle = meta.cleanTitle;
        const songSales = (typeof t === 'object' && t?.sales)
          ? t.sales
          : Math.round(Math.max(18000, ((npcData?.pop || 75) * 2400) - (idx * 9000)));
        const songStreams = (typeof t === 'object' && t?.streams) ? t.streams : songSales * 450;
        const songCover = (typeof t === 'object' && t?.cover) ? t.cover : getTrackCoverArt(effectiveArtistName, songTitle);
        const relDate = (typeof t === 'object' && t?.releaseDate) ? t.releaseDate : `${gameYear}-01-15`;
        return {
          id: `npc_s_${idx}`,
          title: songTitle,
          artist: meta.formattedArtistCredits,
          cover: songCover,
          type: 'Single',
          sales: songSales,
          streams: songStreams,
          releaseDate: relDate,
          genre: npcData?.genre || 'Pop',
          year: relDate.split('-')[0] || gameYear,
          isAlbum: false,
          isPlayer: false,
          rawItem: {
            title: songTitle,
            artist: meta.formattedArtistCredits,
            cover: songCover,
            genre: npcData?.genre || 'Pop',
            pureSales: songSales,
            streams: songStreams,
            releaseDate: relDate,
            isAlbum: false,
            isPlayer: false
          }
        };
      });

      // Bilateral Collaborations where this NPC is the Featured Artist
      const bilateralCollabs = getCollaborationsForNpcArtist(effectiveArtistName, state).map((c, idx) => ({
        id: `npc_collab_${idx}_${c.id}`,
        title: c.title,
        artist: c.formattedArtistCredits,
        cover: c.cover || getTrackCoverArt(c.primaryArtist, c.title),
        type: 'Single',
        sales: c.sales,
        streams: c.streams,
        releaseDate: c.releaseDate || `${gameYear}-01-15`,
        genre: npcData?.genre || 'Pop',
        year: String(c.year || gameYear),
        isAlbum: false,
        isPlayer: c.isPlayerPrimary,
        rawItem: c.rawPlayerSong || {
          title: c.title,
          artist: c.formattedArtistCredits,
          cover: c.cover,
          genre: npcData?.genre || 'Pop',
          pureSales: c.sales,
          streams: c.streams,
          releaseDate: c.releaseDate || `${gameYear}-01-15`,
          isAlbum: false,
          isPlayer: c.isPlayerPrimary
        }
      }));

      const npcAlbums = (npcData?.albums || []).map((alb: any, idx: number) => {
        const albSales = alb.sales || Math.round(Math.max(65000, ((npcData?.pop || 75) * 6500) - (idx * 20000)));
        const albYear = String(alb.year || gameYear);
        const albCover = alb.cover || getTrackCoverArt(effectiveArtistName, alb.title);
        return {
          id: `npc_a_${idx}`,
          title: alb.title,
          artist: effectiveArtistName,
          cover: albCover,
          type: 'Album',
          sales: albSales,
          streams: albSales * 1250,
          releaseDate: `${albYear}-02-01`,
          genre: npcData?.genre || 'Pop',
          year: albYear,
          isAlbum: true,
          isPlayer: false,
          rawItem: {
            title: alb.title,
            artist: effectiveArtistName,
            cover: albCover,
            genre: npcData?.genre || 'Pop',
            year: albYear,
            pureSales: albSales,
            tracks: alb.tracks,
            isAlbum: true,
            isPlayer: false
          }
        };
      });

      const dedupedMap = new Map<string, any>();
      [...npcSongs, ...bilateralCollabs, ...npcAlbums].forEach(item => {
        const k = `${item.type}::${item.title.toLowerCase()}`;
        if (!dedupedMap.has(k)) dedupedMap.set(k, item);
      });

      return Array.from(dedupedMap.values()).sort((a, b) => b.sales - a.sales);
    }
  }, [isPlayer, effectiveArtistName, playerReleasedSongs, playerReleasedProjects, npcData, state, gameYear]);

  // Total Lifetime Digital Pure Sales
  const totalPureSales = useMemo(() => {
    return releases.reduce((sum, r) => sum + r.sales, 0);
  }, [releases]);

  // Latest Release
  const latestRelease = useMemo(() => {
    if (releases.length === 0) return null;
    const sorted = [...releases].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
    return sorted[0];
  }, [releases]);

  // Top Songs (Bestsellers)
  const topSongs = useMemo(() => {
    return releases.filter(r => r.type === 'Single').slice(0, 8);
  }, [releases]);

  const maxSongSales = Math.max(1, topSongs[0]?.sales || 10000);

  // Albums & EPs
  const albumsAndEPs = useMemo(() => {
    return releases.filter(r => r.type === 'Album' || r.type === 'EP');
  }, [releases]);

  // Singles & Standalone Drops
  const standaloneSingles = useMemo(() => {
    return releases.filter(r => r.type === 'Single');
  }, [releases]);

  // Digital Certifications (RIAA Pure Sales Thresholds)
  const certifications = useMemo(() => {
    const list: { tier: string; title: string; count: number; icon: string; color: string }[] = [];
    if (totalPureSales >= 10000000) {
      list.push({ tier: 'Diamond', title: '10M+ Digital Units Certified', count: Math.floor(totalPureSales / 10000000), icon: 'ph-diamond', color: 'text-cyan-400 bg-cyan-950/30 border-cyan-500/30' });
    }
    if (totalPureSales >= 2000000) {
      list.push({ tier: 'Multi-Platinum', title: '2M+ Digital Units Certified', count: Math.floor(totalPureSales / 2000000), icon: 'ph-certificate', color: 'text-sky-300 bg-sky-950/30 border-sky-500/30' });
    }
    if (totalPureSales >= 1000000) {
      list.push({ tier: 'Platinum', title: '1M+ Digital Sales Certified', count: 1, icon: 'ph-seal-check', color: 'text-slate-200 bg-slate-800/50 border-slate-400/30' });
    }
    if (totalPureSales >= 500000) {
      list.push({ tier: 'Gold', title: '500K+ Digital Sales Certified', count: 1, icon: 'ph-medal', color: 'text-amber-400 bg-amber-950/30 border-amber-500/30' });
    }
    return list;
  }, [totalPureSales]);

  const artistAvatar = isPlayer
    ? (state.artist?.avatar || getTrackCoverArt(effectiveArtistName, 'Debut'))
    : (npcData?.avatar || npcData?.image || getTrackCoverArt(effectiveArtistName, 'Hit'));

  const countryName = isPlayer
    ? (COUNTRY_NAMES[state.artist?.country || 'US'] || 'United States')
    : (npcData?.country ? (COUNTRY_NAMES[npcData.country] || npcData.country) : 'United States');

  const mainGenre = isPlayer ? (state.artist?.genre || 'Pop') : (npcData?.genre || 'Pop');

  return (
    <div className="space-y-8 pb-32">
      {/* 1. AUTHENTIC ITUNES STORE ARTIST HEADER */}
      <section className="relative overflow-hidden rounded-xl border border-white/[0.08] shadow-2xl bg-gradient-to-b from-[#1a1a22] to-[#121217] p-6 sm:p-7">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Artist Portrait */}
          <div className="relative shrink-0">
            {isPlayer && state.artist?.avatar ? (
              <img
                src={artistAvatar}
                alt={effectiveArtistName}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover shadow-2xl border border-white/15"
              />
            ) : (
              <OfficialArtworkImg
                artist={effectiveArtistName}
                explicitSrc={npcData?.avatar || npcData?.image}
                isArtistPortrait={!isPlayer}
                alt={effectiveArtistName}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover shadow-2xl border border-white/15 bg-zinc-800"
              />
            )}
          </div>

          {/* Artist Details */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-zinc-400 mb-1">
              <span className="text-[#0a84ff] font-semibold tracking-wider uppercase text-[11px]">
                iTunes Store Artist
              </span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>{mainGenre}</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>{countryName}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight truncate">
              {effectiveArtistName}
            </h1>

            <p className="text-zinc-400 text-xs sm:text-sm mt-2 leading-relaxed max-w-2xl">
              {isPlayer
                ? (state.artist?.bio || 'Official digital storefront catalog available in 24-bit Apple Digital Master and Lossless audio.')
                : (npcData?.bio || `Acclaimed ${mainGenre} recording artist with an extensive Mastered for iTunes catalog.`)}
            </p>

            {/* Quick Store Actions */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-4">
              {latestRelease && (
                <button
                  onClick={() => onSelectRelease && onSelectRelease(latestRelease.rawItem)}
                  className="px-3.5 py-1.5 rounded-[6px] border border-[#0a84ff] bg-[#0a84ff]/15 hover:bg-[#0a84ff] text-[#409cff] hover:text-white font-semibold text-xs transition cursor-pointer"
                >
                  View Latest Release ({latestRelease.isAlbum ? '$9.99' : '$1.29'})
                </button>
              )}

              {!isPlayer && (
                <button
                  onClick={() => onSelectArtist(state.artist?.name || 'Player Artist')}
                  className="px-3.5 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 font-medium text-xs rounded-[6px] border border-white/10 transition cursor-pointer"
                >
                  &lsaquo; Back to My Artist Page
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Career Storefront Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/[0.06]">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider block">
              Lifetime Digital Sales
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-white">
              {formatNumFull(totalPureSales)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider block">
              Est. Store Revenue
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-400">
              ${formatNum(Math.round(totalPureSales * 0.90))}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider block">
              Store Catalog
            </span>
            <span className="text-base sm:text-lg font-bold text-zinc-200">
              {releases.length} Releases
            </span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider block">
              Mastered Format
            </span>
            <span className="text-base sm:text-lg font-bold text-[#0a84ff]">
              Apple Digital Master
            </span>
          </div>
        </div>
      </section>

      {/* 2. LATEST RELEASE & TOP SONGS (CLASSIC 2-COLUMN ITUNES ARTIST LAYOUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Left: Latest Release Card (4 Cols) */}
        {latestRelease && (
          <div className="lg:col-span-4">
            <div className="flex items-baseline justify-between pb-2 mb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Latest Release
              </h3>
              <span className="text-[11px] text-zinc-500">{latestRelease.releaseDate}</span>
            </div>

            <div
              onClick={() => onSelectRelease && onSelectRelease(latestRelease.rawItem)}
              className="bg-[#131318] p-4 rounded-xl border border-white/[0.08] hover:border-white/20 transition cursor-pointer group"
            >
              <div className="flex gap-4 items-center">
                <OfficialArtworkImg
                  artist={effectiveArtistName}
                  title={latestRelease.title}
                  isAlbum={latestRelease.isAlbum}
                  explicitSrc={isPlayer ? latestRelease.cover : undefined}
                  alt={latestRelease.title}
                  className="w-24 h-24 rounded-lg object-cover shadow-lg border border-white/10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0a84ff]">
                    {latestRelease.type} · {latestRelease.year}
                  </span>
                  <h4 className="text-sm font-bold text-white group-hover:underline truncate mt-0.5">
                    {latestRelease.title}
                  </h4>
                  <p className="text-xs text-zinc-400 truncate">{effectiveArtistName}</p>
                  <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                    {formatNum(latestRelease.sales)} sold
                  </p>
                  <div className="mt-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-[4px] text-[11px] font-semibold border ${
                      isPlayer
                        ? 'border-zinc-700 text-zinc-400 bg-zinc-900'
                        : 'border-[#0a84ff]/80 text-[#409cff] group-hover:bg-[#0a84ff] group-hover:text-white'
                    }`}>
                      {isPlayer ? 'Purchased' : latestRelease.isAlbum ? '$9.99' : '$1.29'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right: Top Songs Table with Popularity Meter (8 Cols) */}
        <div className={latestRelease ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <div className="flex items-baseline justify-between pb-2 mb-3 border-b border-white/[0.08]">
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Top Songs
            </h3>
            <span className="text-[11px] text-zinc-500">Ranked by iTunes Store Sales</span>
          </div>

          <div className="bg-[#131318] border border-white/[0.08] rounded-xl overflow-hidden divide-y divide-white/[0.05]">
            {topSongs.map((song, i) => {
              const ratio = Math.min(1, Math.max(0.2, song.sales / maxSongSales));
              const activeBars = Math.max(1, Math.round(ratio * 8));
              return (
                <div
                  key={song.id}
                  onClick={() => onSelectRelease && onSelectRelease(song.rawItem)}
                  className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition cursor-pointer group"
                >
                  <div className="flex items-center min-w-0 gap-2.5 flex-1">
                    <span className="w-5 text-center font-mono text-zinc-500 text-xs shrink-0">
                      {i + 1}
                    </span>
                    <div className="relative shrink-0 group/play">
                      <OfficialArtworkImg
                        artist={effectiveArtistName}
                        title={song.title}
                        isAlbum={false}
                        explicitSrc={isPlayer ? song.cover : undefined}
                        alt={song.title}
                        className="w-9 h-9 rounded object-cover border border-white/10"
                      />
                      {onPlaySong && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlaySong(song.title, effectiveArtistName, song.cover);
                          }}
                          className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-black/80 hover:bg-[#0a84ff] text-white flex items-center justify-center opacity-0 group-hover/play:opacity-100 transition cursor-pointer"
                          aria-label={`Play preview of ${song.title}`}
                        >
                          <i className="ph-fill ph-play text-[10px] ml-0.5"></i>
                        </button>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-white group-hover:underline text-xs sm:text-sm truncate leading-tight">
                        {song.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                        <span>{effectiveArtistName}</span>
                        <span aria-hidden="true" className="text-zinc-600">·</span>
                        <span>{song.year}</span>
                      </div>
                    </div>
                  </div>

                  {/* Classic iTunes Popularity Bars */}
                  <div className="hidden sm:flex items-center gap-[2px] px-2" title="iTunes Popularity">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((b) => (
                      <span
                        key={b}
                        className={`w-[3px] h-2.5 rounded-[1px] ${
                          b <= activeBars ? 'bg-zinc-300' : 'bg-zinc-800'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
                      {formatNum(song.sales)}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-[4px] text-xs font-semibold border transition ${
                      isPlayer
                        ? 'border-zinc-700 text-zinc-400 bg-zinc-900'
                        : 'border-[#0a84ff]/80 text-[#409cff] group-hover:bg-[#0a84ff] group-hover:text-white'
                    }`}>
                      {isPlayer ? 'Purchased' : '$1.29'}
                    </span>
                  </div>
                </div>
              );
            })}

            {topSongs.length === 0 && (
              <p className="text-zinc-400 text-center py-8 text-xs">
                No single tracks registered on the storefront yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. ALBUMS DISCOGRAPHY SHELF */}
      {albumsAndEPs.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between pb-2 mb-3.5 border-b border-white/[0.08]">
            <h3 className="text-base font-semibold text-white tracking-tight">
              Albums
            </h3>
            <span className="text-xs text-zinc-500">{albumsAndEPs.length} Studio Releases</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {albumsAndEPs.map(proj => (
              <div
                key={proj.id}
                onClick={() => onSelectRelease && onSelectRelease(proj.rawItem)}
                className="group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative mb-2 overflow-hidden rounded-lg bg-zinc-900 border border-white/[0.08] shadow-md">
                    <OfficialArtworkImg
                      artist={effectiveArtistName}
                      title={proj.title}
                      isAlbum={true}
                      explicitSrc={isPlayer ? proj.cover : undefined}
                      alt={proj.title}
                      className="w-full aspect-square object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    />
                  </div>

                  <h4 className="text-white group-hover:underline font-medium text-xs sm:text-sm truncate leading-snug">
                    {proj.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                    <span>{proj.year}</span>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <span>{proj.type}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">{formatNum(proj.sales)} sold</span>
                  <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border ${
                    isPlayer
                      ? 'border-zinc-700 text-zinc-400 bg-zinc-900'
                      : 'border-[#0a84ff]/80 text-[#409cff] group-hover:bg-[#0a84ff] group-hover:text-white'
                  }`}>
                    {isPlayer ? 'Purchased' : '$9.99'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. SINGLES & EPS SHELF */}
      {standaloneSingles.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between pb-2 mb-3.5 border-b border-white/[0.08]">
            <h3 className="text-base font-semibold text-white tracking-tight">
              Singles &amp; EPs
            </h3>
            <span className="text-xs text-zinc-500">{standaloneSingles.length} Singles</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {standaloneSingles.map(song => (
              <div
                key={song.id}
                onClick={() => onSelectRelease && onSelectRelease(song.rawItem)}
                className="group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative mb-2 overflow-hidden rounded-lg bg-zinc-900 border border-white/[0.08] shadow-md">
                    <OfficialArtworkImg
                      artist={effectiveArtistName}
                      title={song.title}
                      isAlbum={false}
                      explicitSrc={isPlayer ? song.cover : undefined}
                      alt={song.title}
                      className="w-full aspect-square object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    />
                  </div>

                  <h4 className="text-white group-hover:underline font-medium text-xs sm:text-sm truncate leading-snug">
                    {song.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                    <span>{song.year}</span>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <span>Single</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">{formatNum(song.sales)} sold</span>
                  <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border ${
                    isPlayer
                      ? 'border-zinc-700 text-zinc-400 bg-zinc-900'
                      : 'border-[#0a84ff]/80 text-[#409cff] group-hover:bg-[#0a84ff] group-hover:text-white'
                  }`}>
                    {isPlayer ? 'Purchased' : '$1.29'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. DIGITAL SALES CERTIFICATIONS (RIAA) */}
      {certifications.length > 0 && (
        <section className="pt-2 border-t border-white/[0.08]">
          <h3 className="text-sm font-semibold text-white tracking-tight mb-3">
            RIAA Certified Digital Sales Milestones
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {certifications.map((cert, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-center gap-3.5 ${cert.color}`}
              >
                <i className={`ph-fill ${cert.icon} text-xl shrink-0`}></i>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs uppercase tracking-wide">{cert.tier} Certification</h4>
                  <p className="text-xs opacity-80 mt-0.5">{cert.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ItunesArtistProfileView;

