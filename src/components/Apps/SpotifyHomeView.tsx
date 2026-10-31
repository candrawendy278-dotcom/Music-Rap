// Spotify Home View Component
// Replicates the authentic real-world Spotify Home interface:
// 1. Sticky Spotify filter chips bar with user avatar ([Avatar] [All] [Music] [Playlists] [Artists])
// 2. 8-grid compact Quick Access Shortcuts (rounded-[4px] bg-[#282828]/80) with real #1 track artwork + Spotify editorial badge
// 3. "Picked For You" / "New Release" horizontal spotlight card
// 4. Authentic flush Spotify horizontal playlist shelves with real cover art & editorial overlays ("Today's Top Hits", "RapCaviar", etc.)
// 5. Circular "Popular Artists" shelf with verified monthly listeners
// 6. "Popular New Releases" shelf (Albums & Singles from Player & NPCs)

import React, { useMemo } from 'react';
import { GameState } from '../../types';
import { formatNum, formatNumFull } from '../../constants';
import { DetailedNPC, getDetailedNPC } from '../../data/npcAssets';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { NpcArtistsShowcase } from './NpcArtistsShowcase';
import { generateCuratedSpotifyPlaylists } from '../../data/spotifyPlaylistsManager';
import { REAL_WORLD_NPCS, normalizeRealArtistName, normalizeRealTitle } from '../../data/realWorldArtistCatalog';
import { isNpcMatchingPlayerName } from '../../data/npcPlayerDeduplicationEngine';
import {
  AUTHENTIC_SPOTIFY_PLAYLISTS,
  computeTop10MonthlyArtists,
  SpotifyPlaylistDefinition
} from '../../data/authenticSpotifyPlaylistSystem';
import { buildEnhancedSpotifyHomeAndPlaylistCuration } from '../../data/spotifyHomeAndPlaylistEnhancerEngine';
import {
  getActiveSharedWorldRosterArtists,
  convertRosterArtistToDetailedNpc
} from '../../data/rosterSharedWorldBridge';
import { getEnsuredRecordLabelState } from '../../data/recordLabelSystemEngine';

interface SpotifyHomeViewProps {
  state: GameState;
  homeFilter: 'all' | 'music' | 'playlists' | 'artists';
  setHomeFilter: (filter: 'all' | 'music' | 'playlists' | 'artists') => void;
  onSelectPlaylist: (playlist: SpotifyPlaylistDefinition) => void;
  onSelectNpc: (npc: DetailedNPC) => void;
  onOpenPlayerProfile: () => void;
  onOpenCharts?: () => void;
  onSelectPlayerRelease?: (release: any) => void;
  onOpenPlaylistHub?: () => void;
}

export const SpotifyHomeView: React.FC<SpotifyHomeViewProps> = ({
  state,
  homeFilter,
  setHomeFilter,
  onSelectPlaylist,
  onSelectNpc,
  onOpenPlayerProfile,
  onOpenCharts,
  onSelectPlayerRelease,
  onOpenPlaylistHub
}) => {
  const topMonthlyArtists = useMemo(() => {
    return computeTop10MonthlyArtists(state);
  }, [state.spotify?.listeners, state.artist, state.recordLabelState, state.date]);

  const enhancedCuration = useMemo(() => {
    return buildEnhancedSpotifyHomeAndPlaylistCuration(state);
  }, [state.songs, state.spotify?.playlists, state.artist?.name, state.date]);

  // Resolve live tracks per playlist so we can show the #1 cover artist on each playlist cover (just like real Spotify!)
  const curatedPlaylistsMap = useMemo(() => {
    return generateCuratedSpotifyPlaylists(state.songs, state.artist?.name || '', state.popularity || 30);
  }, [state.songs, state.artist?.name, state.popularity]);

  const getPlaylistLeadTrack = (playlistId: string, fallbackIndex: number) => {
    const stateTracks = state.spotify?.playlists?.[playlistId];
    const list =
      stateTracks && stateTracks.length > 0
        ? stateTracks
        : curatedPlaylistsMap[playlistId] || [];
    if (list.length > 0) {
      const top = list[0];
      return {
        artist: top.isPlayer ? top.artist : normalizeRealArtistName(top.artist),
        title: top.isPlayer ? top.title : normalizeRealTitle(top.title),
        cover: top.cover,
        isPlayer: Boolean(top.isPlayer),
        rosterNames: list
          .slice(0, 3)
          .map((t: any) => (t.isPlayer ? t.artist : normalizeRealArtistName(t.artist)))
          .join(', ')
      };
    }
    const fallbackArtist = topMonthlyArtists[fallbackIndex % Math.max(1, topMonthlyArtists.length)];
    return {
      artist: fallbackArtist?.name || 'Taylor Swift',
      title: '',
      cover: fallbackArtist?.avatar,
      isPlayer: Boolean(fallbackArtist?.isPlayer),
      rosterNames: topMonthlyArtists
        .slice(0, 3)
        .map(a => a.name)
        .join(', ')
    };
  };

  // 8-grid Quick Access items (real Spotify top 2x4 grid)
  const quickAccessPlaylists = useMemo(() => {
    return [
      AUTHENTIC_SPOTIFY_PLAYLISTS[0], // Today's Top Hits
      AUTHENTIC_SPOTIFY_PLAYLISTS[15], // Release Radar
      AUTHENTIC_SPOTIFY_PLAYLISTS[3], // RapCaviar
      AUTHENTIC_SPOTIFY_PLAYLISTS[1], // New Music Friday
      AUTHENTIC_SPOTIFY_PLAYLISTS[2], // Pop Rising
      AUTHENTIC_SPOTIFY_PLAYLISTS[16], // Discover Weekly
      AUTHENTIC_SPOTIFY_PLAYLISTS[4], // Viral 50 - Global
      AUTHENTIC_SPOTIFY_PLAYLISTS[5]  // Chill Vibes
    ].filter(Boolean);
  }, []);

  // Filter playlists by categories
  const flagshipPlaylists = useMemo(() => {
    return AUTHENTIC_SPOTIFY_PLAYLISTS.filter(p => p.category === 'flagship');
  }, []);

  const moodPlaylists = useMemo(() => {
    return AUTHENTIC_SPOTIFY_PLAYLISTS.filter(p => p.category === 'mood');
  }, []);

  const focusAndPartyPlaylists = useMemo(() => {
    return AUTHENTIC_SPOTIFY_PLAYLISTS.filter(
      p => p.category === 'focus' || p.category === 'party'
    );
  }, []);

  const algorithmicPlaylists = useMemo(() => {
    return AUTHENTIC_SPOTIFY_PLAYLISTS.filter(p => p.category === 'algorithmic');
  }, []);

  // Popular New Releases (Player + Real-World NPC Albums & Singles)
  const popularReleases = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      artist: string;
      type: 'Album' | 'Single' | 'EP';
      year: number;
      cover?: string;
      streams: number;
      isPlayer: boolean;
      rawPlayerObj?: any;
      npcObj?: DetailedNPC;
    }> = [];

    const playerName = state.artist?.name || '';

    // Add player's latest releases first if any
    const releasedProjects = (state.projects || []).filter(p => p.status === 'released');
    releasedProjects.forEach(p => {
      const totalStreams = (p.songs || []).reduce((acc, s) => {
        const live = state.songs.find(ls => ls.id === s.id);
        return acc + (live?.streams || s.streams || 0);
      }, 0);
      items.push({
        id: `pl_proj_${p.id}`,
        title: p.title,
        artist: playerName,
        type: p.type === 'ep' ? 'EP' : 'Album',
        year: new Date(p.releaseDate || state.date).getFullYear(),
        cover: p.cover,
        streams: totalStreams,
        isPlayer: true,
        rawPlayerObj: p
      });
    });

    const releasedSingles = (state.songs || []).filter(
      s => s.status === 'released' && s.trackType !== 'b_side'
    );
    releasedSingles.slice(0, 3).forEach(s => {
      items.push({
        id: `pl_sng_${s.id}`,
        title: s.title,
        artist: playerName,
        type: 'Single',
        year: new Date(s.releaseDate || state.date).getFullYear(),
        cover: s.cover,
        streams: s.streams || 0,
        isPlayer: true,
        rawPlayerObj: { ...s, type: 'single' }
      });
    });

    // Add signed Record Label Roster Artists' releases so they appear in Popular New Releases alongside Player & NPCs
    const labelState = state ? getEnsuredRecordLabelState(state) : null;
    const imprintName = labelState?.imprint?.imprintName || 'Record Label';
    const dateStr = state?.date ? String(state.date).split('T')[0] : '2026-01-01';
    const rosterArtists = getActiveSharedWorldRosterArtists(state);
    rosterArtists.forEach(rArt => {
      const detailedRoster = convertRosterArtistToDetailedNpc(rArt, imprintName, dateStr);
      (rArt.projects || [])
        .filter(p => p.status === 'released')
        .forEach(p => {
          const totalStreams = (p.songs || []).reduce((acc, s) => acc + (s.streams || 0), 0);
          items.push({
            id: `roster_proj_${rArt.id}_${p.id}`,
            title: p.title,
            artist: detailedRoster.name,
            type: p.type === 'ep' ? 'EP' : 'Album',
            year: new Date(p.releaseDate || state.date).getFullYear(),
            cover: p.cover,
            streams: totalStreams,
            isPlayer: false,
            npcObj: detailedRoster
          });
        });
      (rArt.songs || [])
        .filter(s => s.status === 'released' && s.trackType !== 'b_side')
        .slice(0, 2)
        .forEach(s => {
          items.push({
            id: `roster_sng_${rArt.id}_${s.id}`,
            title: s.title,
            artist: detailedRoster.name,
            type: 'Single',
            year: new Date(s.releaseDate || state.date).getFullYear(),
            cover: s.cover,
            streams: s.streams || 0,
            isPlayer: false,
            npcObj: detailedRoster
          });
        });
    });

    // Add top NPC albums & singles
    REAL_WORLD_NPCS.forEach(npc => {
      if (isNpcMatchingPlayerName(npc.name, playerName)) return;
      const detailed = getDetailedNPC(npc.name);
      if (npc.albums && npc.albums.length > 0) {
        const latestAlb = npc.albums[0];
        const albStreams = (latestAlb.tracks || []).reduce(
          (sum, t) => sum + (t.streams || 0),
          0
        );
        items.push({
          id: `npc_alb_${npc.id}_${latestAlb.title}`,
          title: latestAlb.title,
          artist: npc.name,
          type: 'Album',
          year: latestAlb.year || 2025,
          cover: latestAlb.cover,
          streams: albStreams || 450_000_000,
          isPlayer: false,
          npcObj: detailed
        });
      }
    });

    return items
      .sort((a, b) => {
        if (a.isPlayer && !b.isPlayer) return -1;
        if (!a.isPlayer && b.isPlayer) return 1;
        return b.streams - a.streams;
      })
      .slice(0, 14);
  }, [state.projects, state.songs, state.artist?.name, state.date, state.recordLabelState]);

  const spotlightRelease = popularReleases[0];

  // Authentic Spotify Editorial Playlist Shelf (flush square covers, real cover artist photo + Spotify branding, 2-line gray subtext)
  const renderSpotifyEditorialShelf = (
    title: string,
    items: SpotifyPlaylistDefinition[],
    badgeLabel?: string
  ) => (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          {badgeLabel && (
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#A7A7A7] mb-0.5">
              {badgeLabel}
            </p>
          )}
          <h2 className="text-xl font-black text-white tracking-tight leading-none">
            {title}
          </h2>
        </div>
      </div>

      <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-2 pt-0.5 -mx-4 px-4">
        {items.map((pl, idx) => {
          const lead = getPlaylistLeadTrack(pl.id, idx);
          return (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl)}
              className="w-[148px] shrink-0 group cursor-pointer"
            >
              {/* Authentic Square Editorial Cover Art */}
              <div className="w-[148px] h-[148px] rounded-[6px] overflow-hidden relative shadow-lg bg-[#181818]">
                {/* Cover Artist / Track Photo Background */}
                <OfficialArtworkImg
                  artist={lead.artist}
                  title={lead.title}
                  explicitSrc={lead.cover}
                  isArtistPortrait={!lead.title}
                  isPlayer={lead.isPlayer}
                  alt={pl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                {/* Editorial Gradient Wash */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${pl.gradient} opacity-65 mix-blend-multiply`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />

                {/* Top-Left Spotify Watermark */}
                <div className="absolute top-2.5 left-2.5 flex items-center space-x-1">
                  <i className="ph-fill ph-spotify-logo text-white text-sm drop-shadow"></i>
                </div>

                {/* Top-Right Category Accent Bar */}
                <div
                  className="absolute top-0 right-0 w-8 h-1.5"
                  style={{ backgroundColor: pl.coverAccent || '#1DB954' }}
                />

                {/* Editorial Playlist Typography */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <span className="block text-[15px] font-black text-white leading-[1.1] tracking-tight drop-shadow-md">
                    {pl.name}
                  </span>
                </div>

                {/* Hover Spotify Green Play Button */}
                <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 shadow-xl">
                  <i className="ph-fill ph-play text-lg translate-x-[1px]"></i>
                </div>
              </div>

              {/* Authentic 2-Line Gray Subtext below cover (No card box border!) */}
              <p className="text-[12px] text-[#A7A7A7] line-clamp-2 leading-[1.35] mt-2 font-normal">
                {lead.rosterNames
                  ? `${lead.rosterNames} and more`
                  : pl.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Sticky-style Spotify Top Filter Bar with User Profile Circle */}
      <div className="flex items-center space-x-2 overflow-x-auto hide-scrollbar pt-1 pb-1">
        {/* User Profile Avatar Button (Real Spotify Top-Left Circle) */}
        <button
          onClick={onOpenPlayerProfile}
          title={state.artist?.name || 'Artist Profile'}
          className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-white/20 hover:ring-[#1DB954] transition cursor-pointer active:scale-95 bg-[#282828]"
        >
          <OfficialArtworkImg
            artist={state.artist?.name || 'Artist'}
            explicitSrc={state.artist?.image || state.artist?.avatar}
            isArtistPortrait={true}
            isPlayer={true}
            alt={state.artist?.name || 'You'}
            className="w-full h-full object-cover"
          />
        </button>

        {(['all', 'music', 'playlists', 'artists'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setHomeFilter(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 ${
              homeFilter === tab
                ? 'bg-[#1DB954] text-black font-bold'
                : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]'
            }`}
          >
            {tab === 'all'
              ? 'All'
              : tab === 'music'
              ? 'Music'
              : tab === 'playlists'
              ? 'Playlists'
              : 'Artists'}
          </button>
        ))}

        {onOpenCharts && (
          <button
            onClick={onOpenCharts}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] transition cursor-pointer shrink-0 flex items-center space-x-1"
          >
            <i className="ph-fill ph-chart-bar text-[#1DB954]"></i>
            <span>Top 50</span>
          </button>
        )}

        {onOpenPlaylistHub && (
          <button
            onClick={onOpenPlaylistHub}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#1DB954]/20 border border-[#1DB954]/40 text-[#1DB954] hover:bg-[#1DB954] hover:text-black transition cursor-pointer shrink-0 flex items-center space-x-1"
          >
            <i className="ph-fill ph-playlist"></i>
            <span>Pitch & Playlists</span>
          </button>
        )}
      </div>

      {/* 8-Grid Quick Access Shortcuts (Authentic Real Spotify 2x4 Compact Grid) */}
      {(homeFilter === 'all' || homeFilter === 'music' || homeFilter === 'playlists') && (
        <div className="grid grid-cols-2 gap-2">
          {quickAccessPlaylists.map((pl, idx) => {
            const lead = getPlaylistLeadTrack(pl.id, idx);
            return (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist(pl)}
                className="flex items-center bg-[#282828]/75 hover:bg-[#3E3E3E]/90 rounded-[4px] overflow-hidden cursor-pointer group transition active:scale-[0.99] h-14"
              >
                <div className="w-14 h-14 shrink-0 relative overflow-hidden bg-[#181818]">
                  <OfficialArtworkImg
                    artist={lead.artist}
                    title={lead.title}
                    explicitSrc={lead.cover}
                    isArtistPortrait={!lead.title}
                    isPlayer={lead.isPlayer}
                    alt={pl.name}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${pl.gradient} opacity-60 mix-blend-multiply`}
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-start justify-start p-1">
                    <i className="ph-fill ph-spotify-logo text-white text-[11px] drop-shadow"></i>
                  </div>
                </div>
                <div className="px-2.5 flex-1 min-w-0 flex items-center justify-between">
                  <span className="text-white font-bold text-[12px] leading-tight line-clamp-2">
                    {pl.name}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#1DB954] text-black items-center justify-center hidden group-hover:flex shadow-md shrink-0 ml-1">
                    <i className="ph-fill ph-play text-xs translate-x-[1px]"></i>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SPOTIFY "PICKED FOR YOU" / NEW RELEASE FEATURE CARD */}
      {(homeFilter === 'all' || homeFilter === 'music') && spotlightRelease && (
        <section className="space-y-2.5">
          <div className="flex items-center space-x-2.5">
            <OfficialArtworkImg
              artist={spotlightRelease.artist}
              isArtistPortrait={true}
              isPlayer={spotlightRelease.isPlayer}
              explicitSrc={
                spotlightRelease.isPlayer
                  ? state.artist?.image || state.artist?.avatar
                  : spotlightRelease.npcObj?.avatar
              }
              alt={spotlightRelease.artist}
              className="w-9 h-9 rounded-full object-cover bg-[#282828]"
            />
            <div>
              <p className="text-[10px] text-[#A7A7A7] uppercase tracking-wider font-semibold">
                {spotlightRelease.isPlayer ? 'Your Latest Release' : 'New Release From'}
              </p>
              <h3 className="text-sm font-black text-white leading-tight">
                {spotlightRelease.artist}
              </h3>
            </div>
          </div>

          <div
            onClick={() => {
              if (spotlightRelease.isPlayer) {
                if (onSelectPlayerRelease && spotlightRelease.rawPlayerObj) {
                  onSelectPlayerRelease(spotlightRelease.rawPlayerObj);
                } else {
                  onOpenPlayerProfile();
                }
              } else if (spotlightRelease.npcObj) {
                onSelectNpc(spotlightRelease.npcObj);
              }
            }}
            className="bg-[#242424] hover:bg-[#2E2E2E] rounded-[8px] overflow-hidden flex items-center cursor-pointer transition group shadow-md"
          >
            <div className="w-32 h-32 shrink-0 bg-[#181818] overflow-hidden relative">
              <OfficialArtworkImg
                artist={spotlightRelease.artist}
                title={spotlightRelease.title}
                isAlbum={spotlightRelease.type !== 'Single'}
                isPlayer={spotlightRelease.isPlayer}
                explicitSrc={spotlightRelease.cover}
                alt={spotlightRelease.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            </div>
            <div className="p-3.5 flex-1 min-w-0 flex flex-col justify-between h-32">
              <div>
                <span className="text-[11px] text-[#A7A7A7] font-medium">
                  {spotlightRelease.type} • {spotlightRelease.year}
                </span>
                <h4 className="text-base font-black text-white truncate mt-0.5 group-hover:text-[#1DB954] transition">
                  {spotlightRelease.title}
                </h4>
                <p className="text-xs text-[#A7A7A7] truncate mt-0.5">
                  {spotlightRelease.artist}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-3 text-[#A7A7A7]">
                  <i className="ph-fill ph-plus-circle text-xl text-[#1DB954]"></i>
                  <span className="text-[11px] font-semibold text-zinc-300">
                    {formatNum(spotlightRelease.streams)} streams
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-md group-hover:bg-[#1DB954] group-hover:scale-105 transition">
                  <i className="ph-fill ph-play text-sm translate-x-[1px]"></i>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ACTIVE PLAYER PLAYLIST PLACEMENTS TRACKER & LIVE EDITORIAL REACH */}
      {(homeFilter === 'all' || homeFilter === 'playlists' || homeFilter === 'music') &&
        enhancedCuration.activePlayerPlacements.length > 0 && (
          <section className="bg-gradient-to-br from-[#1DB954]/15 via-[#181818] to-[#121212] border border-[#1DB954]/30 rounded-[10px] p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-widest text-[#1DB954]">
                  Active Editorial & Algorithmic Playlisting
                </span>
              </div>
              <span className="text-[11px] font-bold text-white bg-[#1DB954]/20 border border-[#1DB954]/40 px-2 py-0.5 rounded-full">
                +{formatNum(enhancedCuration.totalDailyPlaylistStreamBoost)} / day
              </span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-[#A7A7A7] leading-snug">
                Your tracks are currently rotating across <strong className="text-white">{enhancedCuration.activePlayerPlacements.length} official Spotify playlists</strong>.
              </p>
              {onOpenPlaylistHub && (
                <button
                  onClick={onOpenPlaylistHub}
                  className="text-[11px] font-black text-[#1DB954] hover:underline shrink-0 ml-2 cursor-pointer"
                >
                  Open Hub →
                </button>
              )}
            </div>

            <div className="flex space-x-3 overflow-x-auto hide-scrollbar pt-1 pb-1">
              {enhancedCuration.activePlayerPlacements.slice(0, 8).map(pl => (
                <div
                  key={`${pl.playlistId}-${pl.songId}`}
                  onClick={() => onSelectPlaylist(pl.playlistDef)}
                  className="w-[215px] shrink-0 bg-[#242424] hover:bg-[#2E2E2E] rounded-[8px] p-2.5 flex items-center space-x-2.5 cursor-pointer transition border border-white/5 group"
                >
                  <div className="w-12 h-12 rounded-[4px] overflow-hidden relative shrink-0 bg-[#181818]">
                    <OfficialArtworkImg
                      artist={state.artist?.name || 'You'}
                      title={pl.songTitle}
                      explicitSrc={pl.songCover}
                      isPlayer={true}
                      alt={pl.songTitle}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${pl.playlistGradient} opacity-45`} />
                    <span className="absolute bottom-0.5 right-0.5 bg-black/85 text-[#1DB954] text-[9px] font-black px-1 rounded">
                      #{pl.positionInPlaylist}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-[#1DB954] uppercase tracking-wider truncate">
                      {pl.playlistName}
                    </div>
                    <div className="text-xs font-black text-white truncate mt-0.5 group-hover:underline">
                      {pl.songTitle}
                    </div>
                    <div className="text-[10px] text-[#A7A7A7] truncate mt-0.5">
                      +{formatNum(pl.estimatedDailyBoost)} daily streams
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      {/* SPOTIFY DYNAMIC DAYLIST CARD */}
      {(homeFilter === 'all' || homeFilter === 'playlists') && (
        <section
          onClick={() => onSelectPlaylist(enhancedCuration.daylistPlaylist)}
          className="bg-gradient-to-r from-indigo-900/70 via-fuchsia-900/50 to-[#181818] hover:from-indigo-800/80 border border-white/10 rounded-[10px] p-4 flex items-center justify-between cursor-pointer transition group shadow-md"
        >
          <div className="pr-3 flex-1 min-w-0">
            <div className="flex items-center space-x-1.5 mb-1">
              <i className="ph-fill ph-spotify-logo text-[#1DB954] text-sm" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                daylist • Personalized Mix
              </span>
            </div>
            <h3 className="text-base font-black text-white leading-tight truncate group-hover:text-[#1DB954] transition">
              {enhancedCuration.daylistTitle}
            </h3>
            <p className="text-[11px] text-zinc-300 line-clamp-2 mt-1">
              {enhancedCuration.daylistDesc}
            </p>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#1DB954] text-black flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition">
            <i className="ph-fill ph-play text-lg translate-x-[1px]" />
          </div>
        </section>
      )}

      {/* SHELF 1: MADE FOR YOU (ALGORITHMIC) */}
      {(homeFilter === 'all' || homeFilter === 'playlists') &&
        renderSpotifyEditorialShelf(
          `Made For ${state.artist?.name || 'You'}`,
          algorithmicPlaylists,
          'Uniquely yours'
        )}

      {/* SHELF 2: TODAY'S BIGGEST HITS (FLAGSHIP EDITORIAL) */}
      {(homeFilter === 'all' || homeFilter === 'playlists' || homeFilter === 'music') &&
        renderSpotifyEditorialShelf("Today's biggest hits", flagshipPlaylists)}

      {/* SHELF 3: POPULAR NEW RELEASES (ALBUMS & SINGLES) */}
      {(homeFilter === 'all' || homeFilter === 'music') && popularReleases.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-black text-white tracking-tight">
              Popular new releases
            </h2>
          </div>

          <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-2 pt-0.5 -mx-4 px-4">
            {popularReleases.map(rel => (
              <div
                key={rel.id}
                onClick={() => {
                  if (rel.isPlayer) {
                    if (onSelectPlayerRelease && rel.rawPlayerObj) {
                      onSelectPlayerRelease(rel.rawPlayerObj);
                    } else {
                      onOpenPlayerProfile();
                    }
                  } else if (rel.npcObj) {
                    onSelectNpc(rel.npcObj);
                  }
                }}
                className="w-[148px] shrink-0 group cursor-pointer"
              >
                <div className="w-[148px] h-[148px] rounded-[6px] overflow-hidden relative shadow-lg bg-[#181818]">
                  <OfficialArtworkImg
                    artist={rel.artist}
                    title={rel.title}
                    isAlbum={rel.type !== 'Single'}
                    isPlayer={rel.isPlayer}
                    explicitSrc={rel.cover}
                    alt={rel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {rel.isPlayer && (
                    <span className="absolute top-2 left-2 bg-[#1DB954] text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow">
                      YOU
                    </span>
                  )}
                  <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 shadow-xl">
                    <i className="ph-fill ph-play text-lg translate-x-[1px]"></i>
                  </div>
                </div>
                <h3 className="text-[13px] font-bold text-white truncate mt-2 group-hover:underline">
                  {rel.title}
                </h3>
                <p className="text-[12px] text-[#A7A7A7] truncate mt-0.5">
                  {rel.type} • {rel.artist}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SHELF 4: POPULAR ARTISTS (CIRCULAR SPOTIFY ARTIST CARDS) */}
      {(homeFilter === 'all' || homeFilter === 'artists' || homeFilter === 'music') && (
        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Popular artists
              </h2>
              <p className="text-xs text-[#A7A7A7]">
                Top global artists by monthly listeners
              </p>
            </div>
          </div>

          <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-2 pt-1 -mx-4 px-4">
            {topMonthlyArtists.map(artist => (
              <div
                key={artist.rank}
                onClick={() => {
                  if (artist.isPlayer) {
                    onOpenPlayerProfile();
                  } else if (artist.npcData) {
                    onSelectNpc(artist.npcData);
                  }
                }}
                className="w-[140px] shrink-0 group cursor-pointer flex flex-col items-center text-left"
              >
                <div className="relative w-[136px] h-[136px] mb-2.5">
                  <OfficialArtworkImg
                    artist={artist.name}
                    explicitSrc={artist.avatar}
                    isArtistPortrait={true}
                    isPlayer={artist.isPlayer}
                    alt={artist.name}
                    className="w-full h-full rounded-full object-cover shadow-xl group-hover:scale-[1.03] transition duration-300 bg-[#282828]"
                  />
                  {/* Rank Badge */}
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-md ${
                      artist.rank === 1
                        ? 'bg-[#1DB954] text-black'
                        : 'bg-black/80 text-white border border-white/15'
                    }`}
                  >
                    #{artist.rank}
                  </div>
                  {/* Hover Play Button */}
                  <div className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 shadow-xl">
                    <i className="ph-fill ph-play text-base translate-x-[1px]"></i>
                  </div>
                </div>

                <div className="w-full px-0.5">
                  <div className="flex items-center space-x-1">
                    <span className="text-white font-bold text-[13px] truncate group-hover:underline">
                      {artist.name}
                    </span>
                    <i className="ph-fill ph-seal-check text-[#3D91F4] text-xs shrink-0"></i>
                  </div>
                  <p className="text-[11px] text-[#A7A7A7] mt-0.5 truncate">
                    Artist • {formatNum(artist.monthlyListeners)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SHELF 5: MOODS & GENRES */}
      {(homeFilter === 'all' || homeFilter === 'playlists') &&
        renderSpotifyEditorialShelf('Mood & Vibes', moodPlaylists)}

      {/* SHELF 6: FOCUS & WORKOUT */}
      {(homeFilter === 'all' || homeFilter === 'playlists') &&
        renderSpotifyEditorialShelf('Focus & Energy', focusAndPartyPlaylists)}

      {/* FULL VERIFIED REAL-WORLD ARTISTS DIRECTORY */}
      {(homeFilter === 'all' || homeFilter === 'artists' || homeFilter === 'music') && (
        <NpcArtistsShowcase onSelectNpc={onSelectNpc} />
      )}
    </div>
  );
};

