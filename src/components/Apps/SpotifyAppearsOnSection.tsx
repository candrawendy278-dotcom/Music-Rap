import React, { useState, useMemo } from 'react';
import { GameState, Song } from '../../types';
import { SPOTIFY_PLAYLISTS, formatNum } from '../../constants';
import { DetailedNPC, getDetailedNPC } from '../../data/npcAssets';
import {
  EXPANDED_SPOTIFY_PLAYLISTS,
  SpotifyPlaylistMeta
} from '../../data/spotifyCatalogExpanded';
import { generateCuratedSpotifyPlaylists } from '../../data/spotifyPlaylistsManager';
import {
  BilateralCollabTrackEntry,
  getCollaborationsForNpcArtist,
  resolvePlayerCollabNpcName,
  resolveSongMetadataAndCollabCredits
} from '../../data/spotifyTrackMetadataAndCollabEngine';
import { OfficialArtworkImg } from '../Common/OfficialArtworkImg';
import { normalizeRealArtistName } from '../../data/realWorldArtistCatalog';

export interface AppearsOnPlaylistEntry {
  playlist: SpotifyPlaylistMeta;
  featuredSongTitle: string;
  featuredSongCover?: string;
  position?: number;
}

export interface AppearsOnCollabEntry {
  id: string;
  title: string;
  primaryArtist: string;
  collaboratorName: string;
  formattedCredits: string;
  cover?: string;
  year: number;
  streams: number;
  isPlayerPrimary: boolean;
  rawReleasePayload?: any;
}

interface SpotifyAppearsOnSectionProps {
  isPlayer: boolean;
  artistName: string;
  artistAvatar?: string;
  state: GameState;
  npc?: DetailedNPC;
  bilateralCollabs?: BilateralCollabTrackEntry[];
  onSelectPlaylist?: (playlist: SpotifyPlaylistMeta) => void;
  onSelectRelease?: (releaseItem: any) => void;
  onSelectCollaboratorArtist?: (artistName: string, isPlayerArtist: boolean) => void;
}

export const SpotifyAppearsOnSection: React.FC<SpotifyAppearsOnSectionProps> = ({
  isPlayer,
  artistName,
  artistAvatar,
  state,
  npc,
  bilateralCollabs,
  onSelectPlaylist,
  onSelectRelease,
  onSelectCollaboratorArtist
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'playlists' | 'collabs'>('all');

  const currentYear = useMemo(() => {
    const d = state?.date ? new Date(state.date) : new Date('2026-01-01T00:00:00');
    return Number.isNaN(d.getFullYear()) ? 2026 : d.getFullYear();
  }, [state?.date]);

  // 1. Resolve all Spotify Playlists this artist (Player or NPC) currently appears on
  const playlistAppearances = useMemo<AppearsOnPlaylistEntry[]>(() => {
    const results: AppearsOnPlaylistEntry[] = [];
    const seenPlIds = new Set<string>();

    const findPlaylistMeta = (plId: string): SpotifyPlaylistMeta | undefined => {
      const expanded = EXPANDED_SPOTIFY_PLAYLISTS.find(p => p.id === plId);
      if (expanded) return expanded;
      const basic = SPOTIFY_PLAYLISTS.find(p => p.id === plId);
      if (!basic) return undefined;
      return {
        id: basic.id,
        name: basic.name,
        desc: basic.desc,
        followers: basic.followers,
        category: 'flagship',
        gradient: 'from-emerald-700 to-zinc-900'
      };
    };

    const livePlaylistsMap =
      state?.spotify?.playlists && Object.keys(state.spotify.playlists).length > 0
        ? state.spotify.playlists
        : generateCuratedSpotifyPlaylists(
            state?.songs || [],
            state?.artist?.name || 'Artist',
            state?.popularity || 30
          );

    if (isPlayer) {
      // A. Check explicit playlistPlacements on released Player songs
      const releasedPlayerSongs = (state?.songs || []).filter(s => s.status === 'released');
      releasedPlayerSongs.forEach(song => {
        (song.playlistPlacements || []).forEach(plId => {
          if (seenPlIds.has(plId)) return;
          const meta = findPlaylistMeta(plId);
          if (!meta) return;

          const plTracks = livePlaylistsMap?.[plId] || [];
          const foundIdx = plTracks.findIndex(
            (t: any) =>
              t.isPlayer &&
              String(t.title || '').toLowerCase().trim() === song.title.toLowerCase().trim()
          );

          seenPlIds.add(plId);
          results.push({
            playlist: meta,
            featuredSongTitle: song.title,
            featuredSongCover: song.cover,
            position: foundIdx >= 0 ? foundIdx + 1 : undefined
          });
        });
      });

      // B. Also check livePlaylistsMap for any player tracks placed algorithmically or editorially
      Object.entries(livePlaylistsMap || {}).forEach(([plId, tracks]) => {
        if (seenPlIds.has(plId) || !Array.isArray(tracks)) return;
        const playerIdx = tracks.findIndex(
          (t: any) =>
            Boolean(t.isPlayer) ||
            (state?.artist?.name &&
              String(t.artist || '').toLowerCase().trim() ===
                state.artist.name.toLowerCase().trim())
        );
        if (playerIdx >= 0) {
          const meta = findPlaylistMeta(plId);
          if (meta) {
            seenPlIds.add(plId);
            results.push({
              playlist: meta,
              featuredSongTitle: tracks[playerIdx].title,
              featuredSongCover: tracks[playerIdx].cover,
              position: playerIdx + 1
            });
          }
        }
      });
    } else if (npc) {
      const cleanNpcName = normalizeRealArtistName(npc.name).toLowerCase().trim();

      // A. Check livePlaylistsMap for tracks by this NPC
      Object.entries(livePlaylistsMap || {}).forEach(([plId, tracks]) => {
        if (seenPlIds.has(plId) || !Array.isArray(tracks)) return;
        const npcIdx = tracks.findIndex((t: any) => {
          const rawArt = normalizeRealArtistName(String(t.artist || '')).toLowerCase().trim();
          return rawArt === cleanNpcName || rawArt.includes(cleanNpcName);
        });
        if (npcIdx >= 0) {
          const meta = findPlaylistMeta(plId);
          if (meta) {
            seenPlIds.add(plId);
            results.push({
              playlist: meta,
              featuredSongTitle: tracks[npcIdx].title,
              featuredSongCover: tracks[npcIdx].cover,
              position: npcIdx + 1
            });
          }
        }
      });

      // B. Deterministic genre & popularity playlist placements for NPCs so every established NPC
      // shows authentic Spotify Editorial playlists featuring their top songs
      const npcSongs = npc.songs || [];
      if (npcSongs.length > 0 && results.length < 4) {
        const genreLower = (npc.genre || 'Pop').toLowerCase();
        const npcPop = npc.pop || 75;
        const candidatePlaylistIds: string[] = [];

        if (npcPop >= 82) candidatePlaylistIds.push('tth');
        candidatePlaylistIds.push('nmf');

        if (genreLower.includes('k-pop')) {
          candidatePlaylistIds.push('kpop', 'pr', 'v50');
        } else if (
          genreLower.includes('hip') ||
          genreLower.includes('rap') ||
          genreLower.includes('trap')
        ) {
          candidatePlaylistIds.push('rc', 'v50', ' locked_in');
        } else if (genreLower.includes('latin') || genreLower.includes('reggaeton')) {
          candidatePlaylistIds.push('vl', 'tth', 'v50');
        } else if (genreLower.includes('r&b') || genreLower.includes('soul')) {
          candidatePlaylistIds.push('rnb', 'cv', 'pr');
        } else {
          candidatePlaylistIds.push('pr', 'v50', 'cv');
        }

        candidatePlaylistIds.forEach((plId, idx) => {
          const cleanId = plId.trim();
          if (seenPlIds.has(cleanId) || results.length >= 6) return;
          const meta = findPlaylistMeta(cleanId);
          if (!meta) return;
          const featuredSong = npcSongs[idx % npcSongs.length];
          if (!featuredSong) return;

          seenPlIds.add(cleanId);
          results.push({
            playlist: meta,
            featuredSongTitle: featuredSong.title,
            featuredSongCover: featuredSong.cover,
            position: Math.max(1, (( cleanNpcName.length * 3 + idx * 5) % 25) + 1)
          });
        });
      }
    }

    return results;
  }, [isPlayer, state?.songs, state?.spotify?.playlists, state?.artist?.name, state?.popularity, npc]);

  // 2. Resolve all Collaborations & Featured Releases this artist appears on
  const collabAppearances = useMemo<AppearsOnCollabEntry[]>(() => {
    const entries: AppearsOnCollabEntry[] = [];
    const seenTitles = new Set<string>();

    if (isPlayer) {
      const playerName = state?.artist?.name || 'Artist';
      const releasedSongs = (state?.songs || []).filter(s => s.status === 'released');

      releasedSongs.forEach((s: Song) => {
        if (!s.collabId || s.collabId === 'none') return;
        const collabNpcName = resolvePlayerCollabNpcName(s.collabId, playerName, s.genre);
        if (!collabNpcName) return;

        const key = s.title.toLowerCase().trim();
        if (seenTitles.has(key)) return;
        seenTitles.add(key);

        const releaseYear = s.releaseDate
          ? new Date(s.releaseDate).getFullYear()
          : currentYear;

        entries.push({
          id: `pl_collab_${s.id}`,
          title: s.title,
          primaryArtist: playerName,
          collaboratorName: collabNpcName,
          formattedCredits: `${playerName}, ${collabNpcName}`,
          cover: s.cover,
          year: Number.isNaN(releaseYear) ? currentYear : releaseYear,
          streams: s.streams || 0,
          isPlayerPrimary: true,
          rawReleasePayload: { ...s, type: 'single' }
        });
      });
    } else if (npc) {
      const cleanNpcName = normalizeRealArtistName(npc.name);
      const resolvedBilateral =
        bilateralCollabs || getCollaborationsForNpcArtist(cleanNpcName, state);

      resolvedBilateral.forEach((c, idx) => {
        const key = c.title.toLowerCase().trim();
        if (seenTitles.has(key)) return;
        seenTitles.add(key);

        const otherArtist =
          c.primaryArtist.toLowerCase() === cleanNpcName.toLowerCase()
            ? c.featuredArtists[0] || cleanNpcName
            : c.primaryArtist;

        entries.push({
          id: `npc_bi_collab_${idx}_${c.title}`,
          title: c.title,
          primaryArtist: c.primaryArtist,
          collaboratorName: otherArtist,
          formattedCredits: c.formattedArtistCredits,
          cover: c.cover,
          year: c.year || currentYear,
          streams: c.streams || 0,
          isPlayerPrimary: c.isPlayerPrimary,
          rawReleasePayload: {
            id: `appears_collab_${idx}_${c.title}`,
            title: c.title,
            type: 'single',
            cover: c.cover,
            year: c.year || currentYear,
            streams: Math.floor(c.streams || 0),
            primaryArtist: c.formattedArtistCredits,
            isPlayerCollab: c.isPlayerPrimary,
            tracks: [
              {
                title: c.title,
                streams: Math.floor(c.streams || 0),
                trackType: c.trackType || 'single',
                artist: c.formattedArtistCredits,
                hasMV: c.hasMusicVideo,
                isExplicit: c.isExplicit,
                isPlayer: c.isPlayerPrimary
              }
            ]
          }
        });
      });

      // Also inspect the NPC's own songs & album tracks for featured collaborators
      (npc.songs || []).forEach((s, idx) => {
        const meta = resolveSongMetadataAndCollabCredits(s, cleanNpcName, state);
        if (!meta.isCollab || meta.featuredArtists.length === 0) return;
        const key = meta.cleanTitle.toLowerCase().trim();
        if (seenTitles.has(key)) return;
        seenTitles.add(key);

        entries.push({
          id: `npc_own_collab_${idx}_${meta.cleanTitle}`,
          title: meta.cleanTitle,
          primaryArtist: meta.primaryArtist,
          collaboratorName: meta.featuredArtists[0],
          formattedCredits: meta.formattedArtistCredits,
          cover: s.cover,
          year: currentYear,
          streams: Math.floor(s.streams || 0),
          isPlayerPrimary: false,
          rawReleasePayload: {
            id: `appears_own_collab_${idx}_${meta.cleanTitle}`,
            title: meta.cleanTitle,
            type: 'single',
            cover: s.cover,
            year: currentYear,
            streams: Math.floor(s.streams || 0),
            primaryArtist: meta.formattedArtistCredits,
            tracks: [
              {
                title: meta.cleanTitle,
                streams: Math.floor(s.streams || 0),
                trackType: (s as any).trackType || 'single',
                artist: meta.formattedArtistCredits,
                hasMV: meta.hasMusicVideo,
                isExplicit: meta.isExplicit
              }
            ]
          }
        });
      });
    }

    return entries.sort((a, b) => b.streams - a.streams);
  }, [isPlayer, state, npc, bilateralCollabs, currentYear]);

  const showPlaylists = activeFilter === 'all' || activeFilter === 'playlists';
  const showCollabs = activeFilter === 'all' || activeFilter === 'collabs';
  const totalCount = playlistAppearances.length + collabAppearances.length;

  return (
    <div className="mt-8 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xl font-bold text-white leading-tight">Appears On</h3>
          <p className="text-[11px] text-[#A7A7A7] mt-0.5">
            Playlists & collaborations featuring {artistName}
          </p>
        </div>
        {totalCount > 0 && (
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#1DB954] text-black'
                  : 'bg-[#282828] text-gray-300 hover:bg-[#333]'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('playlists')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                activeFilter === 'playlists'
                  ? 'bg-[#1DB954] text-black'
                  : 'bg-[#282828] text-gray-300 hover:bg-[#333]'
              }`}
            >
              Playlists ({playlistAppearances.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('collabs')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                activeFilter === 'collabs'
                  ? 'bg-[#1DB954] text-black'
                  : 'bg-[#282828] text-gray-300 hover:bg-[#333]'
              }`}
            >
              Collabs ({collabAppearances.length})
            </button>
          </div>
        )}
      </div>

      {totalCount === 0 ? (
        <div className="bg-[#181818] border border-white/5 rounded-xl p-4 text-center">
          <p className="text-xs text-[#A7A7A7]">
            No playlist placements or collaborations yet. Pitch released songs to Spotify Editorial playlists or record a collaboration in the Studio!
          </p>
        </div>
      ) : (
        <div className="flex overflow-x-auto space-x-4 hide-scrollbar pb-3 -mx-4 px-4">
          {/* 1. PLAYLIST APPEARANCE CARDS */}
          {showPlaylists &&
            playlistAppearances.map(entry => {
              const pl = entry.playlist;
              const coverGrad = pl.gradient || 'from-emerald-700 to-zinc-900';
              return (
                <div
                  key={`appears_pl_${pl.id}`}
                  onClick={() => onSelectPlaylist && onSelectPlaylist(pl)}
                  className="w-36 flex-shrink-0 group cursor-pointer"
                >
                  <div
                    className={`w-36 h-36 rounded-md mb-2.5 shadow-md relative overflow-hidden bg-gradient-to-br ${coverGrad}`}
                  >
                    <OfficialArtworkImg
                      artist={artistName}
                      title={entry.featuredSongTitle}
                      explicitSrc={entry.featuredSongCover || artistAvatar}
                      isArtistPortrait={!entry.featuredSongTitle}
                      isPlayer={isPlayer}
                      alt={pl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-t ${coverGrad} opacity-55 mix-blend-multiply`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />

                    {/* Spotify Logo & Position Badge */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                      <i className="ph-fill ph-spotify-logo text-[#1DB954] text-base drop-shadow"></i>
                      {entry.position && (
                        <span className="bg-black/75 text-[#1DB954] border border-[#1DB954]/40 text-[9px] font-black px-1.5 py-0.5 rounded">
                          #{entry.position}
                        </span>
                      )}
                    </div>

                    {/* Playlist Title Overlay */}
                    <div className="absolute bottom-2 left-2.5 right-2.5">
                      <span className="text-[8px] uppercase tracking-widest font-black text-[#1DB954] block mb-0.5 truncate">
                        Spotify Editorial
                      </span>
                      <span className="text-sm font-black text-white leading-tight drop-shadow block line-clamp-2">
                        {pl.name}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-white font-bold text-sm truncate group-hover:text-[#1DB954] transition">
                    {pl.name}
                  </h4>
                  <p className="text-[#A7A7A7] text-[11px] mt-0.5 truncate">
                    Playlist • Feat. &ldquo;{entry.featuredSongTitle}&rdquo;
                  </p>
                </div>
              );
            })}

          {/* 2. COLLABORATION & FEATURED RELEASE CARDS */}
          {showCollabs &&
            collabAppearances.map(collab => (
              <div
                key={collab.id}
                onClick={() => {
                  if (onSelectRelease && collab.rawReleasePayload) {
                    onSelectRelease(collab.rawReleasePayload);
                  } else if (onSelectCollaboratorArtist) {
                    const isPl =
                      Boolean(state?.artist?.name) &&
                      collab.collaboratorName.toLowerCase() ===
                        state.artist!.name.toLowerCase();
                    onSelectCollaboratorArtist(collab.collaboratorName, isPl);
                  }
                }}
                className="w-36 flex-shrink-0 group cursor-pointer"
              >
                <div className="w-36 h-36 rounded-md mb-2.5 shadow-md relative overflow-hidden bg-zinc-800">
                  <OfficialArtworkImg
                    artist={collab.primaryArtist}
                    title={collab.title}
                    isAlbum={false}
                    isPlayer={collab.isPlayerPrimary}
                    explicitSrc={collab.cover}
                    alt={collab.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute top-2 left-2">
                    <span className="bg-purple-950/85 text-purple-200 border border-purple-500/40 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded backdrop-blur-sm">
                      Collab
                    </span>
                  </div>
                  {collab.streams > 0 && (
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-gray-200 font-bold">
                      <span className="truncate">{formatNum(collab.streams)} streams</span>
                    </div>
                  )}
                </div>

                <h4 className="text-white font-bold text-sm truncate group-hover:text-[#1DB954] transition">
                  {collab.title}
                </h4>
                <p
                  onClick={e => {
                    if (onSelectCollaboratorArtist) {
                      e.stopPropagation();
                      const isPl =
                        Boolean(state?.artist?.name) &&
                        collab.collaboratorName.toLowerCase() ===
                          state.artist!.name.toLowerCase();
                      onSelectCollaboratorArtist(collab.collaboratorName, isPl);
                    }
                  }}
                  className="text-[#A7A7A7] hover:text-white hover:underline text-[11px] mt-0.5 truncate"
                >
                  Single • with {collab.collaboratorName} • {collab.year}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
