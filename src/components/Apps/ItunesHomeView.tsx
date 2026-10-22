import React, { useState, useMemo } from 'react';
import { GameState } from '../../types';
import { formatNum } from '../../constants';
import { getTrackCoverArt } from '../../data/npcAssets';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { REAL_WORLD_NPCS } from '../../data/realWorldArtistCatalog';
import { isNpcMatchingPlayerName } from '../../data/npcPlayerDeduplicationEngine';

interface ItunesHomeViewProps {
  state: GameState;
  onNavigateToChart: (type?: 'singles' | 'albums') => void;
  onSelectArtist: (artistName: string) => void;
  onPlaySong?: (title: string, artist: string, cover: string) => void;
  onSelectRelease?: (item: any) => void;
}

export const ItunesHomeView: React.FC<ItunesHomeViewProps> = ({
  state,
  onNavigateToChart,
  onSelectArtist,
  onPlaySong,
  onSelectRelease
}) => {
  const releasedPlayerSongs = state.songs.filter(s => s.status === 'released');
  const releasedProjects = state.projects.filter(p => p.status === 'released');
  const latestPlayerSong = releasedPlayerSongs[0] || null;
  const latestPlayerProject = releasedProjects[0] || null;
  const playerName = state.artist?.name || '';

  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  // Pull real active NPC songs & albums (excluding any NPC matching the player's name)
  const { activeNpcSongs, activeNpcAlbums } = useMemo(() => {
    const songs: Array<{
      title: string;
      artist: string;
      cover: string;
      genre: string;
      sales: number;
      streams: number;
      releaseDate?: string;
    }> = [];
    const albums: Array<{
      title: string;
      artist: string;
      cover: string;
      genre: string;
      year: string;
      sales: number;
      tracks?: any[];
    }> = [];

    for (const npc of REAL_WORLD_NPCS) {
      if (isNpcMatchingPlayerName(npc.name, playerName)) continue;
      if (npc.songs && npc.songs.length > 0) {
        const topSong = npc.songs[0];
        songs.push({
          title: topSong.title,
          artist: npc.name,
          cover: topSong.cover || getTrackCoverArt(npc.name, topSong.title),
          genre: npc.genre || 'Pop',
          sales: Math.max(850, topSong.dailySales ?? Math.round((topSong.sales || 10000) / 14)),
          streams: topSong.streams || 0,
          releaseDate: (topSong as any).releaseDate
        });
      }
      if (npc.albums && npc.albums.length > 0) {
        const topAlb = npc.albums[0];
        albums.push({
          title: topAlb.title,
          artist: npc.name,
          cover: topAlb.cover || getTrackCoverArt(npc.name, topAlb.title),
          genre: npc.genre || 'Pop',
          year: String(topAlb.year || new Date(state.date).getFullYear()),
          sales: topAlb.sales || 50000,
          tracks: (topAlb as any).tracks
        });
      }
    }

    songs.sort((a, b) => b.sales - a.sales);
    albums.sort((a, b) => b.sales - a.sales);
    return { activeNpcSongs: songs, activeNpcAlbums: albums };
  }, [playerName, state.date]);

  const spotSong1 = activeNpcSongs[0] || {
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    cover: getTrackCoverArt('Sabrina Carpenter', 'Espresso'),
    genre: 'Pop',
    sales: 45000,
    streams: 12000000
  };
  const spotSong2 = activeNpcSongs[1] || {
    title: 'BIRDS OF A FEATHER',
    artist: 'Billie Eilish',
    cover: getTrackCoverArt('Billie Eilish', 'BIRDS OF A FEATHER'),
    genre: 'Alternative',
    sales: 41000,
    streams: 11000000
  };
  const spotAlbum1 = activeNpcAlbums[0] || {
    title: 'THE TORTURED POETS DEPARTMENT',
    artist: 'Taylor Swift',
    cover: getTrackCoverArt('Taylor Swift', 'THE TORTURED POETS DEPARTMENT'),
    genre: 'Pop',
    year: '2026',
    sales: 320000
  };

  // Curated iTunes Store Hero Banners
  const heroBanners = [
    {
      id: 'hero_1',
      kicker: 'FEATURED ON ITUNES · MASTERED FOR ITUNES',
      title: spotSong1.title,
      artist: spotSong1.artist,
      cover: spotSong1.cover,
      genre: spotSong1.genre || 'Pop',
      isAlbum: false,
      headline: 'Shattering digital storefront records across 70+ territories. Available in 24-bit Apple Digital Master.',
      isPlayer: false,
      price: '$1.29',
      rawItem: {
        title: spotSong1.title,
        artist: spotSong1.artist,
        cover: spotSong1.cover,
        genre: spotSong1.genre || 'Pop',
        pureSales: spotSong1.sales * 14,
        streams: spotSong1.streams,
        isAlbum: false,
        isPlayer: false
      }
    },
    {
      id: 'hero_2',
      kicker: latestPlayerSong ? 'NEW RELEASE SPOTLIGHT · HOT PICK' : 'EDITORS’ CHOICE · SINGLE OF THE WEEK',
      title: latestPlayerSong ? latestPlayerSong.title : spotSong2.title,
      artist: latestPlayerSong ? (state.artist?.name || 'You') : spotSong2.artist,
      cover: latestPlayerSong ? latestPlayerSong.cover : spotSong2.cover,
      genre: latestPlayerSong ? (latestPlayerSong.genre || 'Pop') : (spotSong2.genre || 'Pop'),
      isAlbum: false,
      headline: latestPlayerSong
        ? 'Climbing iTunes digital sales leaderboards with rapid global listener conversion.'
        : 'Atmospheric production and unmistakable hooks dominating worldwide digital downloads.',
      isPlayer: !!latestPlayerSong,
      price: '$1.29',
      rawItem: latestPlayerSong || {
        title: spotSong2.title,
        artist: spotSong2.artist,
        cover: spotSong2.cover,
        genre: spotSong2.genre || 'Pop',
        pureSales: spotSong2.sales * 14,
        streams: spotSong2.streams,
        isAlbum: false,
        isPlayer: false
      }
    },
    {
      id: 'hero_3',
      kicker: latestPlayerProject ? 'ESSENTIAL ALBUM · APPLE DIGITAL MASTER' : 'ESSENTIAL STUDIO ALBUM · COMPLETE EDITION',
      title: latestPlayerProject ? latestPlayerProject.title : spotAlbum1.title,
      artist: latestPlayerProject ? (state.artist?.name || 'You') : spotAlbum1.artist,
      cover: latestPlayerProject ? latestPlayerProject.cover : spotAlbum1.cover,
      genre: latestPlayerProject ? (state.artist?.genre || 'Pop') : (spotAlbum1.genre || 'Pop'),
      isAlbum: true,
      headline: latestPlayerProject
        ? 'Official full-length studio release available now on iTunes Store with complete tracklist.'
        : 'The monumental full-length studio album leading global iTunes digital sales.',
      isPlayer: !!latestPlayerProject,
      price: '$9.99',
      rawItem: latestPlayerProject || {
        title: spotAlbum1.title,
        artist: spotAlbum1.artist,
        cover: spotAlbum1.cover,
        genre: spotAlbum1.genre || 'Pop',
        pureSales: spotAlbum1.sales,
        isAlbum: true,
        isPlayer: false
      }
    }
  ];

  const currentBanner = heroBanners[activeBannerIdx];

  // Curated New & Noteworthy grid (8 items: player's latest + top active NPC singles)
  const newAndNoteworthy = [
    ...(latestPlayerSong ? [{
      id: `p_song_${latestPlayerSong.id}`,
      title: latestPlayerSong.title,
      artist: state.artist?.name || 'You',
      cover: latestPlayerSong.cover,
      genre: latestPlayerSong.genre || 'Pop',
      isPlayer: true,
      isAlbum: false,
      price: '$1.29',
      rawItem: latestPlayerSong
    }] : []),
    ...activeNpcSongs.slice(0, 8).map((s, idx) => ({
      id: `npc_nr_${idx}`,
      title: s.title,
      artist: s.artist,
      cover: s.cover,
      genre: s.genre,
      isPlayer: false,
      isAlbum: false,
      price: '$1.29',
      rawItem: {
        title: s.title,
        artist: s.artist,
        cover: s.cover,
        genre: s.genre,
        pureSales: s.sales * 14,
        streams: s.streams,
        isAlbum: false,
        isPlayer: false
      }
    }))
  ].slice(0, 8);

  // Hot Tracks (Songs Under $1.29)
  const hotTracks = activeNpcSongs.slice(0, 8).map((s) => ({
    title: s.title,
    artist: s.artist,
    cover: s.cover,
    genre: s.genre,
    price: '$1.29',
    sales: s.sales,
    rawItem: {
      title: s.title,
      artist: s.artist,
      cover: s.cover,
      genre: s.genre,
      pureSales: s.sales * 14,
      streams: s.streams,
      isAlbum: false,
      isPlayer: false
    }
  }));

  // Essential Studio Albums
  const featuredAlbums = [
    ...(latestPlayerProject ? [{
      title: latestPlayerProject.title,
      artist: state.artist?.name || 'You',
      cover: latestPlayerProject.cover,
      year: latestPlayerProject.releaseDate ? latestPlayerProject.releaseDate.split('-')[0] : '2026',
      genre: state.artist?.genre || 'Pop',
      price: '$9.99',
      isPlayer: true,
      rawItem: latestPlayerProject
    }] : []),
    ...activeNpcAlbums.slice(0, 8).map((a) => ({
      title: a.title,
      artist: a.artist,
      cover: a.cover,
      year: a.year,
      genre: a.genre,
      price: '$9.99',
      isPlayer: false,
      rawItem: {
        title: a.title,
        artist: a.artist,
        cover: a.cover,
        genre: a.genre,
        year: a.year,
        pureSales: a.sales,
        isAlbum: true,
        isPlayer: false
      }
    }))
  ].slice(0, 8);

  // Sidebar live Top Songs & Top Albums (like the right rail of the real iTunes Store)
  const sidebarTopSongs = activeNpcSongs.slice(0, 8);
  const sidebarTopAlbums = activeNpcAlbums.slice(0, 5);

  return (
    <div className="space-y-7 pb-32">
      {/* 1. AUTHENTIC ITUNES STORE HERO SHOWCASE BANNER */}
      <section className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-b from-[#1a1a22] to-[#111116] shadow-2xl">
        <div className="p-5 sm:p-7 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          <div className="relative group shrink-0">
            <div
              onClick={() => onSelectRelease && onSelectRelease(currentBanner.rawItem)}
              className="cursor-pointer"
            >
              <OfficialArtworkImg
                artist={currentBanner.artist}
                title={currentBanner.title}
                isAlbum={currentBanner.isAlbum}
                explicitSrc={currentBanner.isPlayer ? currentBanner.cover : undefined}
                alt={currentBanner.title}
                className="w-40 h-40 sm:w-44 sm:h-44 rounded-lg object-cover shadow-2xl border border-white/15 group-hover:scale-[1.01] transition-transform duration-200"
              />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex items-center justify-center md:justify-start gap-2 text-[11px] font-semibold text-[#0a84ff] tracking-wider uppercase mb-1">
              <span>{currentBanner.kicker}</span>
            </div>

            <h2
              onClick={() => onSelectRelease && onSelectRelease(currentBanner.rawItem)}
              className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight truncate leading-tight cursor-pointer hover:underline"
            >
              {currentBanner.title}
            </h2>

            <div className="flex items-center justify-center md:justify-start gap-2 mt-1 text-xs sm:text-sm text-zinc-300">
              <button
                onClick={() => onSelectArtist(currentBanner.artist)}
                className="hover:text-white font-medium cursor-pointer transition hover:underline"
              >
                {currentBanner.artist}
              </button>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="text-zinc-400">{currentBanner.genre}</span>
            </div>

            <p className="text-zinc-400 text-xs sm:text-sm mt-2.5 line-clamp-2 leading-relaxed max-w-xl">
              {currentBanner.headline}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mt-4">
              <button
                onClick={() => onSelectRelease && onSelectRelease(currentBanner.rawItem)}
                className="px-3.5 py-1.5 rounded-[6px] border border-[#0a84ff] bg-[#0a84ff]/15 hover:bg-[#0a84ff] text-[#409cff] hover:text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{currentBanner.isPlayer ? 'View in Store' : `Buy ${currentBanner.isAlbum ? 'Album' : 'Song'} ${currentBanner.price}`}</span>
              </button>

              <button
                onClick={() => onSelectArtist(currentBanner.artist)}
                className="px-3 py-1.5 rounded-[6px] text-zinc-400 hover:text-white font-medium text-xs transition cursor-pointer"
              >
                Artist Page &rsaquo;
              </button>
            </div>
          </div>
        </div>

        {/* Banner Slide Dots */}
        <div className="flex items-center justify-between px-5 py-2 bg-[#0d0d11]/70 border-t border-white/[0.06] text-[11px] text-zinc-500">
          <span>iTunes Store Editors’ Selection</span>
          <div className="flex items-center gap-1.5">
            {heroBanners.map((b, idx) => (
              <button
                key={b.id}
                onClick={() => setActiveBannerIdx(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  activeBannerIdx === idx ? 'w-5 bg-[#0a84ff]' : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                }`}
                aria-label={`Featured Banner ${idx + 1}`}
              />
            ))}
          </div>
          <span className="hidden sm:inline">Apple Digital Master</span>
        </div>
      </section>

      {/* 2. AUTHENTIC 2-COLUMN ITUNES STORE DESKTOP LAYOUT (MAIN SHELVES + RIGHT SIDEBAR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* LEFT / MAIN STOREFRONT COLUMN (8 COLS) */}
        <div className="lg:col-span-8 space-y-8">
          {/* SECTION A: NEW & NOTEWORTHY */}
          <section>
            <div className="flex items-baseline justify-between pb-2 mb-3.5 border-b border-white/[0.08]">
              <div>
                <h3 className="text-white font-semibold text-base tracking-tight">
                  New &amp; Noteworthy
                </h3>
              </div>
              <button
                onClick={() => onNavigateToChart('singles')}
                className="text-[#0a84ff] hover:underline text-xs font-medium transition cursor-pointer"
              >
                See All &rsaquo;
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {newAndNoteworthy.map((item) => (
                <div
                  key={item.id}
                  className="group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative mb-2 overflow-hidden rounded-lg bg-zinc-900 border border-white/[0.08] shadow-md">
                      <div
                        onClick={() => onSelectRelease && onSelectRelease(item.rawItem)}
                        className="cursor-pointer"
                      >
                        <OfficialArtworkImg
                          artist={item.artist}
                          title={item.title}
                          isAlbum={false}
                          explicitSrc={item.isPlayer ? item.cover : undefined}
                          alt={item.title}
                          className="w-full aspect-square object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        />
                      </div>

                      {onPlaySong && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlaySong(item.title, item.artist, item.cover);
                          }}
                          className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/75 hover:bg-[#0a84ff] text-white border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow cursor-pointer"
                          aria-label={`Play preview of ${item.title}`}
                        >
                          <i className="ph-fill ph-play text-xs ml-0.5"></i>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => onSelectRelease && onSelectRelease(item.rawItem)}
                      className="text-white hover:underline font-medium text-xs truncate block w-full text-left leading-snug cursor-pointer"
                    >
                      {item.title}
                    </button>
                    <button
                      onClick={() => onSelectArtist(item.artist)}
                      className="text-zinc-400 hover:text-white text-[11px] truncate block w-full text-left mt-0.5 cursor-pointer transition"
                    >
                      {item.artist}
                    </button>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 truncate">{item.genre}</span>
                    <button
                      onClick={() => onSelectRelease && onSelectRelease(item.rawItem)}
                      className={`px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border transition cursor-pointer ${
                        item.isPlayer
                          ? 'border-zinc-700 text-zinc-400 bg-zinc-900'
                          : 'border-[#0a84ff]/80 text-[#409cff] hover:bg-[#0a84ff] hover:text-white'
                      }`}
                    >
                      {item.isPlayer ? 'Purchased' : item.price}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION B: HOT TRACKS (SONGS $1.29) */}
          <section>
            <div className="flex items-baseline justify-between pb-2 mb-3 border-b border-white/[0.08]">
              <div className="flex items-baseline gap-2">
                <h3 className="text-white font-semibold text-base tracking-tight">
                  Hot Tracks
                </h3>
                <span className="text-xs text-zinc-500">Songs · $1.29</span>
              </div>
              <button
                onClick={() => onNavigateToChart('singles')}
                className="text-[#0a84ff] hover:underline text-xs font-medium transition cursor-pointer"
              >
                See All &rsaquo;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 divide-y divide-white/[0.05] sm:divide-y-0">
              {hotTracks.map((track, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-white/[0.05] hover:bg-white/[0.02] px-1.5 rounded transition group"
                >
                  <div className="flex items-center min-w-0 mr-2.5">
                    <div className="relative shrink-0 mr-2.5 group/cover">
                      <OfficialArtworkImg
                        artist={track.artist}
                        title={track.title}
                        isAlbum={false}
                        alt={track.title}
                        className="w-10 h-10 rounded object-cover border border-white/[0.08]"
                      />
                      {onPlaySong && (
                        <button
                          onClick={() => onPlaySong(track.title, track.artist, track.cover)}
                          className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-black/80 text-white flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition cursor-pointer"
                          aria-label={`Play preview of ${track.title}`}
                        >
                          <i className="ph-fill ph-play text-[10px] ml-0.5"></i>
                        </button>
                      )}
                    </div>
                    <div className="min-w-0">
                      <button
                        onClick={() => onSelectRelease && onSelectRelease(track.rawItem)}
                        className="font-medium text-white hover:underline text-xs truncate block text-left leading-tight cursor-pointer"
                      >
                        {track.title}
                      </button>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                        <button
                          onClick={() => onSelectArtist(track.artist)}
                          className="hover:text-white truncate cursor-pointer transition"
                        >
                          {track.artist}
                        </button>
                        <span aria-hidden="true" className="text-zinc-600">·</span>
                        <span className="text-zinc-500">{track.genre}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectRelease && onSelectRelease(track.rawItem)}
                    className="shrink-0 px-2.5 py-0.5 rounded-[4px] border border-[#0a84ff]/80 text-[#409cff] hover:bg-[#0a84ff] hover:text-white text-[11px] font-semibold transition cursor-pointer"
                  >
                    {track.price}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION C: ESSENTIAL ALBUMS · MASTERED FOR ITUNES */}
          <section>
            <div className="flex items-baseline justify-between pb-2 mb-3.5 border-b border-white/[0.08]">
              <div className="flex items-baseline gap-2">
                <h3 className="text-white font-semibold text-base tracking-tight">
                  Albums · Mastered for iTunes
                </h3>
                <span className="text-xs text-zinc-500">24-Bit Lossless</span>
              </div>
              <button
                onClick={() => onNavigateToChart('albums')}
                className="text-[#0a84ff] hover:underline text-xs font-medium transition cursor-pointer"
              >
                See All &rsaquo;
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {featuredAlbums.map((album, i) => (
                <div
                  key={i}
                  onClick={() => onSelectRelease && onSelectRelease(album.rawItem)}
                  className="group flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="relative mb-2 overflow-hidden rounded-lg bg-zinc-900 border border-white/[0.08] shadow-md">
                      <OfficialArtworkImg
                        artist={album.artist}
                        title={album.title}
                        isAlbum={true}
                        explicitSrc={album.isPlayer ? album.cover : undefined}
                        alt={album.title}
                        className="w-full aspect-square object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                    </div>

                    <h4 className="text-white group-hover:underline font-medium text-xs truncate leading-snug">
                      {album.title}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectArtist(album.artist);
                      }}
                      className="text-zinc-400 hover:text-white text-[11px] truncate block text-left mt-0.5 cursor-pointer transition"
                    >
                      {album.artist}
                    </button>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">{album.genre} · {album.year}</span>
                    <span
                      className={`px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border transition ${
                        album.isPlayer
                          ? 'border-zinc-700 text-zinc-400 bg-zinc-900'
                          : 'border-[#0a84ff]/80 text-[#409cff] group-hover:bg-[#0a84ff] group-hover:text-white'
                      }`}
                    >
                      {album.isPlayer ? 'Purchased' : album.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION D: PLAYER'S REGISTERED ITUNES STORE CATALOG */}
          {releasedPlayerSongs.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between pb-2 mb-3.5 border-b border-white/[0.08]">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-white font-semibold text-base tracking-tight">
                    Your iTunes Store Catalog
                  </h3>
                  <span className="text-xs text-zinc-500">Registered Artist Storefront</span>
                </div>
                <button
                  onClick={() => onSelectArtist(state.artist?.name || 'Player Artist')}
                  className="text-[#0a84ff] hover:underline text-xs font-medium transition cursor-pointer"
                >
                  Artist Page &rsaquo;
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {releasedPlayerSongs.slice(0, 4).map(song => (
                  <div
                    key={song.id}
                    onClick={() => onSelectRelease && onSelectRelease(song)}
                    className="group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative mb-2 overflow-hidden rounded-lg bg-zinc-900 border border-white/[0.08]">
                        <img
                          src={song.cover}
                          alt={song.title}
                          className="w-full aspect-square object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        />
                        {onPlaySong && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlaySong(song.title, state.artist?.name || 'You', song.cover);
                            }}
                            className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/75 hover:bg-[#0a84ff] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow cursor-pointer"
                            aria-label={`Play preview of ${song.title}`}
                          >
                            <i className="ph-fill ph-play text-xs ml-0.5"></i>
                          </button>
                        )}
                      </div>
                      <h4 className="text-white group-hover:underline font-medium text-xs truncate leading-snug">
                        {song.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {formatNum(song.pureSales || 0)} sold
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT SIDEBAR COLUMN (4 COLS) — CLASSIC ITUNES STORE QUICK LINKS & TOP CHARTS */}
        <aside className="lg:col-span-4 space-y-6 bg-[#131318] border border-white/[0.07] rounded-xl p-4">
          {/* QUICK LINKS */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 pb-2 mb-2 border-b border-white/[0.07]">
              Quick Links
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  onClick={() => onNavigateToChart('singles')}
                  className="text-[#409cff] hover:underline flex items-center justify-between w-full cursor-pointer py-0.5"
                >
                  <span>iTunes Top 50 Songs</span>
                  <span>&rsaquo;</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateToChart('albums')}
                  className="text-[#409cff] hover:underline flex items-center justify-between w-full cursor-pointer py-0.5"
                >
                  <span>iTunes Top 50 Albums</span>
                  <span>&rsaquo;</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectArtist(state.artist?.name || 'Player Artist')}
                  className="text-[#409cff] hover:underline flex items-center justify-between w-full cursor-pointer py-0.5"
                >
                  <span>My iTunes Artist Page</span>
                  <span>&rsaquo;</span>
                </button>
              </li>
            </ul>
          </div>

          {/* SIDEBAR TOP SONGS */}
          <div>
            <div className="flex items-baseline justify-between pb-2 mb-2.5 border-b border-white/[0.07]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                Top Songs
              </h4>
              <button
                onClick={() => onNavigateToChart('singles')}
                className="text-[11px] text-[#0a84ff] hover:underline cursor-pointer"
              >
                See All &rsaquo;
              </button>
            </div>

            <div className="divide-y divide-white/[0.05]">
              {sidebarTopSongs.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() =>
                    onSelectRelease &&
                    onSelectRelease({
                      title: s.title,
                      artist: s.artist,
                      cover: s.cover,
                      genre: s.genre,
                      pureSales: s.sales * 14,
                      streams: s.streams,
                      isAlbum: false,
                      isPlayer: false
                    })
                  }
                  className="py-2 flex items-center justify-between gap-2 hover:bg-white/[0.02] px-1 rounded cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-4 text-right font-mono text-xs text-zinc-500 shrink-0">
                      {idx + 1}
                    </span>
                    <OfficialArtworkImg
                      artist={s.artist}
                      title={s.title}
                      isAlbum={false}
                      alt={s.title}
                      className="w-8 h-8 rounded object-cover border border-white/[0.08] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white group-hover:underline truncate leading-tight">
                        {s.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {s.artist}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 px-1.5 py-0.5 rounded-[4px] border border-[#0a84ff]/70 text-[#409cff] group-hover:bg-[#0a84ff] group-hover:text-white text-[10px] font-semibold">
                    $1.29
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SIDEBAR TOP ALBUMS */}
          <div>
            <div className="flex items-baseline justify-between pb-2 mb-2.5 border-b border-white/[0.07]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                Top Albums
              </h4>
              <button
                onClick={() => onNavigateToChart('albums')}
                className="text-[11px] text-[#0a84ff] hover:underline cursor-pointer"
              >
                See All &rsaquo;
              </button>
            </div>

            <div className="divide-y divide-white/[0.05]">
              {sidebarTopAlbums.map((a, idx) => (
                <div
                  key={idx}
                  onClick={() =>
                    onSelectRelease &&
                    onSelectRelease({
                      title: a.title,
                      artist: a.artist,
                      cover: a.cover,
                      genre: a.genre,
                      year: a.year,
                      pureSales: a.sales,
                      isAlbum: true,
                      isPlayer: false
                    })
                  }
                  className="py-2 flex items-center justify-between gap-2 hover:bg-white/[0.02] px-1 rounded cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-4 text-right font-mono text-xs text-zinc-500 shrink-0">
                      {idx + 1}
                    </span>
                    <OfficialArtworkImg
                      artist={a.artist}
                      title={a.title}
                      isAlbum={true}
                      alt={a.title}
                      className="w-9 h-9 rounded object-cover border border-white/[0.08] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white group-hover:underline truncate leading-tight">
                        {a.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {a.artist}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 px-1.5 py-0.5 rounded-[4px] border border-[#0a84ff]/70 text-[#409cff] group-hover:bg-[#0a84ff] group-hover:text-white text-[10px] font-semibold">
                    $9.99
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ItunesHomeView;


